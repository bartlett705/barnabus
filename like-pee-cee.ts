import dotenv from 'dotenv'
import Twit from 'twit'
dotenv.config({})

const twit = new Twit({
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  strictSSL: true, // optional - requires SSL certificates to be valid.
  timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
})

// Callback functions
const error = (err: any) => {
  console.log('ERROR [%s]', err)
}
const success = (data: any) => {
  console.log('Data [%s]', data)
}

// twit
//   .get('account/verify_credentials')
//   .then((results: any) => {
//     console.log('results', results)
//   })
//   .catch(console.error)

// twit.post(
//   'statuses/update',
//   {
//     status: `Hi Twitter! 👋
// How do you get followers on this thing, anyway?`
//   },
//   (err: any, data: any) => {
//     if (err) {
//       console.error('WHOOPS', err)
//     }
//     console.log('DATA:', data)
//   }
// )

const likeLastTweets = (count: number, screenName: string) =>
  twit.get(
    `statuses/user_timeline.json?screen_name=${screenName}&count=${count}`,
    (err, data: Tweet[], response) => {
      if (err) {
        console.error('WHOOPS', err)
      }
      if (data) {
        console.log(`Retreived ${data.length} tweets`)
        for (const tweet of data) {
          if (tweet.in_reply_to_status_id) {
            console.log(
              `${tweet.id_str} was a reply to ${tweet.in_reply_to_screen_name}`
            )
          } else if (tweet.is_quote_status) {
            console.log(`${tweet.id_str} was a quote tweet`)
          } else if (tweet.retweeted_status) {
            console.log(
              `${tweet.id_str} was a retweet of ${
                tweet.retweeted_status.user.screen_name
              }`
            )
          } else {
            console.log(
              `Liking ${tweet.id} / ${tweet.id_str}: "${
                tweet.extended_tweet
                  ? tweet.extended_tweet.full_text
                  : tweet.text
              }..."`
            )
          }
          // setTimeout(() => {
          //   const url = `favorites/create.json?id=${tweet.id_str}`
          //   console.log(url)
          //   twit.post(url, (faveErr, faveData, faveResponse) => {
          //     if (faveErr || faveResponse.statusCode !== 200) {
          //       console.error(
          //         'WHOOPS',
          //         faveResponse.statusCode,
          //         err,
          //         faveResponse.statusMessage,
          //         faveResponse.url
          //       )
          //     } else {
          //       console.log(`Liked ${tweet.id} 👍`)
          //     }
          //   })
          // }, 1000 * data.indexOf(tweet))
        }
      } else {
        console.log(
          'RESP:',
          response.statusCode,
          response.statusMessage,
          response.url
        )
      }
    }
  )

likeLastTweets(250, 'pc_')
// const sanClemente = ['-117.672', '33.457', '-117.548', '33.411']

// const stream = twit.stream('statuses/filter', {
//   track: 'trump is a baby'
// })

// stream.on('tweet', (tweet: Tweet) => {
//   console.log(
//     tweet.created_at,
//     tweet.place && tweet.place.name,
//     tweet.coordinates && tweet.coordinates.coordinates,
//     tweet.text
//   )
// })

// twit
//   .get('favorites/list.json?screen_name=cboneventure&count=2')
//   .then((results: any) => {
//     console.log('results', results)
//   })
//   .catch(console.error)

interface Tweet {
  created_at: string
  truncated: boolean
  id: number
  id_str: string
  text: string
  user: TwitterUser
  coordinates: { coordinates: string[] }
  place: { name: string }
  extended_tweet: {
    full_text: string;
  }
  in_reply_to_status_id?: number
  in_reply_to_screen_name?: string
  is_quote_status: boolean
  retweeted_status?: Tweet
}

interface TwitterUser {
  id: number
  name: string
  screen_name: string
}
