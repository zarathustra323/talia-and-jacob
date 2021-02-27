const client = require('../mongodb');
const { DB_NAME: dbName } = require('../mongodb/constants');

const Token = require('./token');
const User = require('./user');
const UserEvent = require('./user-event');

const token = new Token({ client, dbName });
const userEvent = new UserEvent({ client, dbName });

const user = new User({
  client,
  dbName,
  tokenRepo: token,
  userEventRepo: userEvent,
});

module.exports = {
  token,
  user,
  userEvent,
};
