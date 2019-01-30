import { config } from 'dotenv'
import * as Twit from 'twit'
config({})

const twit = new Twit({
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  strictSSL: true, // optional - requires SSL certificates to be valid.
  timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
})

exports.findGoodTweet = (count: number, query: string) =>
  twit.get(
    'search/tweets',
    { q: query, count, result_type: 'popular' },
    (err, data: { statuses: Tweet[] }, response) => {
      if (err) {
        console.error('WHOOPS', err)
      }
      if (data.statuses) {
        console.log(`Retreived ${data.statuses.length} tweets`)
        for (const tweet of data.statuses) {
          console.log(
            `Found ${tweet.id} / ${tweet.id_str}: "${
              tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text
            }"`
          )
        }
      } else {
        console.log('RESP:', response.statusCode, response.statusMessage, data)
      }
    }
  )

// findGoodTweet(2, 'mosey')

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
