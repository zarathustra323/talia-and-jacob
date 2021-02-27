const {
  bool,
  port,
  cleanEnv,
  str,
} = require('envalid');

module.exports = cleanEnv(process.env, {
  MONGO_URI: str({ desc: 'The MongoDB instance to connect to.' }),
  HOST: str({ desc: 'The host that the service will run on.', default: '0.0.0.0' }),
  NEW_RELIC_ENABLED: bool({ desc: 'Whether New Relic is enabled.', default: false }),
  NEW_RELIC_LICENSE_KEY: str({ desc: 'The license key for New Relic.', default: '(unset)' }),
  PORT: port({ desc: 'The port that the service will run on.', default: 80 }),
});
