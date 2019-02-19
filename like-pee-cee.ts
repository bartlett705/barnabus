import { Client } from 'pg'
import { logger, queryDB, Tweet, twit } from './init-twit'
import { followUser } from './utils'

const BASE_DELAY = 180_000
const JITTER = 120_000

const FOLLOW_RATE = 0.075
const RETWEET_RATE = 0.15

const { PGHOST, PGPORT, PGDATABASE, PGUSER } = process.env
logger.debug(`DB ${PGUSER}@${PGHOST}:${PGPORT}/${PGDATABASE}`)
const dbClient = new Client()

const [fetchLimit, likeLimi] = process.argv.slice(2)
const handles = process.env.TARGETS.split(',')

dbClient.connect().then(async () =>
  handles.forEach(async (handle, index) => {
    // logger.warn('Starting: ', handle)
    const tweetsToLike = await findLikeableTweets(
      Number(fetchLimit),
      Number(likeLimi),
      handle
    )
    await likeTweets(tweetsToLike)
    logger.warn('Finished engaging with ', handle)
    if (index === handles.length - 1) {
      logger.info('Done with all handles.')
      // await dbClient.end()
    }
  })
)
// .then(() => {
//   process.exit(0)
// })

const findLikeableTweets = async (
  count: number,
  maxLikes: number,
  screenName: string
): Promise<Tweet[]> => {
  queryDB(
    console,
    dbClient,
    `
      CREATE TABLE IF NOT EXISTS ${screenName} (
        id VARCHAR(256) PRIMARY KEY,
        tweetBody varchar,
        timeSeen varchar(32),
        retweeted boolean,
        faved boolean
      );
    `
  ).catch((err) => logger.error(err))

  dbClient
    .query(`SELECT count(*) FROM ${screenName};`)
    .then((res) => {
      logger.debug(
        `We have previously seen ${
          res.rows[0].count
        } of ${screenName}'s Tweets.`
      )
    })
    .catch((err) => logger.error('derp!', err))

  logger.info(
    `Engaging with a maximum of ${maxLikes} of ${screenName}'s tweets out of ${count} to be fetched.`
  )
  return new Promise((resolve, reject) => {
    twit.get(
      `statuses/user_timeline.json?screen_name=${screenName}&count=${count}`,
      async (err: any, data: Tweet[], response: any) => {
        // console.log('GOT RESP', JSON.stringify(response))
        if (err) {
          logger.error('WHOOPS', err)
          reject(err)
        }
        if (data && data.length) {
          logger.info(`Retreived ${data.length} tweets by ${screenName}`)
          // reverse to service older tweets first
          data.reverse()
          // we will filter out these replies
          const replies = data
            .filter((tweet) => !!tweet.in_reply_to_status_id)
            .map((tweet) => tweet.id_str)

          if (replies.length) {
            logger.log(
              `Dropping the following replies by ${screenName} (${
                replies.length
              } / ${data.length}): ${replies.join(',')}`
            )
          }
          // } else if (tweet.is_quote_status) {
          //   logger.log(`${tweet.id_str} was a quote tweet`)
          // } else if (tweet.retweeted_status) {
          //   logger.log(
          //     `${tweet.id_str} was a retweet of ${
          //       tweet.retweeted_status.user.screen_name
          //     }`
          //   )
        } else {
          logger.log(
            'RESP:',
            response.statusCode,
            response.statusMessage,
            response.url
          )
        }
        const tweetsToMaybeLike: Tweet[] = data.filter(
          (tweet) => !tweet.in_reply_to_status_id
        )

        logger.log(
          `Found ${
            tweetsToMaybeLike.length
          } tweets by ${screenName} that we might like. Checking if we have already seen them.`
        )
        // filter for ones we have seen
        const tweetCheckPromises: Array<
          Promise<Tweet | null>
        > = tweetsToMaybeLike.map(async (tweet) => {
          // logger.debug(`Maybe liking ${tweet.id_str}`)

          const existenceQuery = `select * from ${screenName} where id = '${
            tweet.id_str
          }';`
          const result = await queryDB(console, dbClient, existenceQuery)
          if (result && result.rows.length) {
            // logger.debug('skipping, seen before')
            return null
          }
          return tweet
        })

        const unfilteredTweetsToLike = await Promise.all(tweetCheckPromises)
        const tweetsToLike = unfilteredTweetsToLike
          .filter((t) => !!t)
          .slice(0, maxLikes)

        logger.info(
          `found ${
            tweetsToLike.length
          } of ${screenName}'s tweets to engage with`
        )

        if (tweetsToLike.length === 0) {
          logger.debug('No Tweets to engage with for ', screenName)

          // logger.debug('No Tweets to like; ending DB session.')
          // return dbClient.end()
        }

        resolve(tweetsToLike)
      }
    )
  })
}

function likeTweets(tweetsToLike: Tweet[]) {
  const engagementPromises = tweetsToLike.map((tweet) => {
    const tweetBody = tweet.extended_tweet
      ? tweet.extended_tweet.full_text
      : tweet.text
    const delay =
      BASE_DELAY * tweetsToLike.indexOf(tweet) + Math.random() * JITTER
    const { url, actionName, twitParams } = getEngagementAction(tweet)
    logger.log(
      `${actionName}ing ${tweetsToLike.indexOf(tweet) + 1}/${
        tweetsToLike.length
      }\t| ${tweet.id_str} in ${delay / 1000} seconds.`
    )
    return new Promise((innerResolve, innerReject) => {
      setTimeout(
        likeOrRetweet(
          innerResolve,
          innerReject,
          tweet,
          url,
          actionName,
          twitParams,
          tweetsToLike,
          tweetBody
        ),
        delay
      )
    })
  })
  return Promise.all(engagementPromises)
}

function likeOrRetweet(
  resolve: (value?: {} | PromiseLike<{}>) => void,
  reject: (value?: {} | PromiseLike<{}>) => void,
  tweet: Tweet,
  url: string,
  actionName: Action,
  twitParams: { id: string } | undefined,
  tweetsToLike: Tweet[],
  tweetBody: string
): (...args: any[]) => void {
  return async () => {
    const screenName = tweet.user.screen_name
    twit.post(url, twitParams, async (faveErr, faveData, faveResponse) => {
      if (
        faveErr ||
        (faveResponse.statusCode !== 200 && faveResponse.statusCode !== 403)
      ) {
        logger.error(
          'WHOOPS',
          faveResponse.statusCode,
          faveResponse.statusMessage,
          faveErr
        )
      } else {
        logger.info(
          `${actionName}ed ${tweetsToLike.indexOf(tweet) + 1}/${
            tweetsToLike.length
          } 👍 ${tweet.id_str} 🕛 ${tweet.created_at} 👱 ${
            tweet.user.screen_name
          }: '${tweetBody}'`
        )
      }
      if (faveResponse.statusCode === 200 || faveResponse.statusCode === 403) {
        // tslint:disable-next-line:max-line-length
        const insert = `insert into ${screenName}(id, tweetBody, timeSeen, retweeted, faved) values ($1, $2, $3, $4, $5);`
        const params = [
          tweet.id_str,
          tweetBody,
          new Date().toISOString(),
          actionName === Action.Retweet,
          actionName === Action.Like
        ]
        const insertionResult = await queryDB(
          console,
          dbClient,
          insert,
          params
        )
        if (insertionResult) {
          logger.warn(`Recorded ${tweet.id_str} as seen.`)
          // Randomly follow the retweeted user
          if (tweet.retweeted_status && Math.random() < FOLLOW_RATE) {
            await followUser(tweet.retweeted_status.user.screen_name)
          } else {
            resolve()
          }
        } else {
          logger.error('DB err on', tweet.id_str)
          reject()
        }
      }
      resolve()
    })
  }
}

enum Action {
  Like = 'Lik',
  Retweet = 'Retweet'
}
function getEngagementAction(tweet: Tweet) {
  let url = 'favorites/create'
  let actionName = Action.Like
  let twitParams = { id: tweet.id_str }
  if (Math.random() < RETWEET_RATE) {
    url = `statuses/retweet/${tweet.id_str}`
    twitParams = undefined
    actionName = Action.Retweet
  }
  return { url, actionName, twitParams }
}
