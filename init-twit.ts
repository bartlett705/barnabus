import { config } from 'dotenv'
import * as Twit from 'twit'
config({})
import chalk from 'chalk'
import { Client, QueryResult } from 'pg'

export const twit = new Twit({
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  strictSSL: true, // optional - requires SSL certificates to be valid.
  timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
})

export const logger = process.env.PRODUCTION
  ? console
  : {
      debug: (...args: any) => console.log(chalk.blueBright(...args)),
      error: (...args: any) => console.log(chalk.redBright(...args)),
      info: (...args: any) => console.log(chalk.greenBright(...args)),
      log: (...args: any) => console.log(chalk.white(...args)),
      warn: (...args: any) => console.log(chalk.yellowBright(...args))
    }

export async function queryDB(
  dbLogger: typeof console,
  client: Client,
  query: string,
  params?: any
) {
  return new Promise<QueryResult | null>(async (res, rej) => {
    try {
      // dbLogger.debug('QUERY:', query)
      const result = await client.query(query, params)
      if (result && result.rows) {
        // dbLogger.debug(`Returning ${result.rows.length} rows`)
      }
      res(result as QueryResult)
    } catch (err) {
      dbLogger.error('hrm')
      dbLogger.error(err)
      rej(err)
    }
  })
}
export interface Tweet {
  created_at: string
  truncated: boolean
  id: number
  id_str: string
  text: string
  user: TwitterUser
  coordinates: {
    coordinates: string[];
  }
  place: {
    name: string;
  }
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
