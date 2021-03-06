#!/usr/bin/env ts-node
import { logger, twit } from './init-twit'

export const verifyCreds = () =>
  twit
    .get('account/verify_credentials')
    .then((results) => {
      if (!results || !results.resp || results.resp.statusCode !== 200) {
        logger.error('unexpected results!') 
        logger.warn(JSON.stringify(results, null, 2))
      } else {
        logger.info('Creds Verified 👍')
      }
    })
    .catch(logger.error)

export const post = async (status: string) =>
  twit.post(
    'statuses/update',
    {
      status
    },
    (err, data: any) => {
      if (err) {
        logger.error('WHOOPS', JSON.stringify(err, null, 2))
      }
      else if (data.created_at) {
        logger.info('A Poast...to toast 🎉')
      } else {

        logger.info('DATA:', JSON.stringify(data, null, 2))
      }
    }
  )

// const stream = twit.stream('statuses/filter', {
//   track: 'trump is a baby'
// })

// stream.on('tweet', (tweet: Tweet) => {
//   logger.log(
//     tweet.created_at,
//     tweet.place && tweet.place.name,
//     tweet.coordinates && tweet.coordinates.coordinates,
//     tweet.text
//   )
// })

// twit
//   .get('favorites/list.json?screen_name=cboneventure&count=2')
//   .then((results: any) => {
//     logger.log('results', results)
//   })
//   .catch(logger.error)

export const followUser = (screenName: string) => {
  return new Promise((resolve, reject) => {
    twit.post(
      '/friendships/create',
      {
        follow: true,
        screen_name: String(screenName)
      },
      (followErr, followData, followResp) => {
        if (
          followErr ||
          (followResp.statusCode !== 200 && followResp.statusCode !== 403)
        ) {
          logger.error(
            'WHOOPS',
            followResp.statusCode,
            followResp.statusMessage,
            followResp.url
          )
          reject(followErr)
        } else {
          logger.info(`Followed 🤓 ${screenName}`)
          resolve(followData)
        }
      }
    )
  })
}

// const usersToFollow = process.env.TARGETS.split(',')
// const usersToFollow = ['travis_view']
// console.log('Following: ', usersToFollow.join(', '))

// usersToFollow.forEach(async (user) => await followUser(user))
