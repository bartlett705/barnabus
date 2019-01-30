import { config } from 'dotenv'
import * as Twit from 'twit'
config({})
import fetch from 'node-fetch'

export interface DiscordMessage {
  content: string
  username?: string
  avatar_url?: string
  embeds?: any
}

export class Discord {
  constructor(private discordToken: string, private channelID: string) {
    if (!discordToken || !channelID) {
      throw new Error('Discord config missing')
    }
  }

  public async postMessage(msg: DiscordMessage) {
    try {
      const res = await fetch(
        `https://discordapp.com/api/webhooks/${this.channelID}/${
          this.discordToken
        }`,
        {
          body: JSON.stringify(msg),
          headers: { 'Content-Type': 'application/json' },
          method: 'POST'
        }
      )
    } catch (err) {
      console.error('Error posting webhook to discord :/')
    }
  }
}

const discord = new Discord(
  'PK7ONG8GO2WpnWWa2NM_zLj__R3gUnWO9bf7Gyi1qTtqVszVltFYqb7I4HJCxI7QDZs5',
  '540023877724667906'
)

const twit = new Twit({
  access_token: process.env.ACCESS_TOKEN,
  access_token_secret: process.env.ACCESS_TOKEN_SECRET,
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  strictSSL: true, // optional - requires SSL certificates to be valid.
  timeout_ms: 60 * 1000 // optional HTTP request timeout to apply to all requests.
})

exports.findGoodTweet = (event: any, context: any, callback: any) => {
  console.log(event)
  twit.get(
    'search/tweets',
    { q: 'mosey', count: 2, result_type: 'popular' },
    (err, data: { statuses: Tweet[] }, response) => {
      if (err) {
        callback(err)
      }
      if (data.statuses) {
        console.log(`Retreived ${data.statuses.length} tweets`)
        for (const tweet of data.statuses) {
          discord.postMessage({
            content: `Found ${tweet.id} / ${tweet.id_str}: "${
              tweet.extended_tweet ? tweet.extended_tweet.full_text : tweet.text
            }"`
          })
        }
      } else {
        console.log('RESP:', response.statusCode, response.statusMessage, data)
      }
      callback(null, 'Okie dokie')
    }
  )
}
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
