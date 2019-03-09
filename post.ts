import { logger } from './init-twit'
import { post, verifyCreds } from './utils'

const content = process.argv[2]

verifyCreds()
  .then((_) => post(content).then(() => logger.log('Done!')))
  .catch((e) => logger.error(e))
