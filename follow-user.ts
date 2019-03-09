#!/usr/bin/env ts-node
import { logger } from './init-twit'
import { followUser, verifyCreds } from './utils'

const screenName = process.argv[2]

verifyCreds()
  .then((_) => followUser(screenName).then(() => logger.log('Done!')))
  .catch((e) => logger.error(e))
