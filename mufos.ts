#!/usr/bin/env ts-node
import { logger, twit } from './init-twit'
import { verifyCreds } from './utils'

const screenName1 = process.argv[2]
const screenName2 = process.argv[3]

verifyCreds()
  .then(() => twit.get('application/rate_limit_status'))
  .then((res: any) => {
    const { remaining, reset } = res.data.resources.friends['/friends/ids']
    console.debug('Rate limit info:')
    console.warn(`Remaining: ${remaining}`)
    console.warn(
      `Reset in ${String((reset - Date.now() / 1000) / 60).slice(0, 5)} mins`
    )
    if (remaining < 2) {
      throw new Error('Cannot continue; would excede rate limit')
    }
  })
  .then((_) =>
    Promise.all([
      twit.get('friends/ids', { screen_name: screenName1 }),
      twit.get('friends/ids', { screen_name: screenName2 })
    ])
  )
  .then(([res1, res2]: any[]) => {
    const result = res1.data.ids.reduce(
      (acc: any, user: any) =>
        res2.data.ids.includes(user) ? [...acc, user] : acc,
      []
    )
    logger.info(`Found ${result.length} common friends:`)
    return result
  })
  .then((result) => twit.post('users/lookup', { user_id: result.join(',') }))
  .then((result: any) => {
    const names = result.data.map((user: any) => user.screen_name).join(', ')
    logger.log(JSON.stringify(names, null, 2))
  })
  .catch((e) => logger.error(e))
