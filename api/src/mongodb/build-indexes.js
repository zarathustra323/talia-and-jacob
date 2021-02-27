const mongodb = require('./index');
const indexes = require('./indexes');
const { DB_NAME } = require('./constants');

module.exports = () => mongodb
  .buildIndexesFor({ dbName: DB_NAME, obj: indexes, forceBackground: true });
