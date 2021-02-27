const client = require('../mongodb');
const { DB_NAME: dbName } = require('../mongodb/constants');

const Token = require('./token');
const User = require('./user');
const UserEvent = require('./user-event');
const Wedding = require('./wedding');
const WeddingManager = require('./wedding-manager');

const token = new Token({ client, dbName });
const userEvent = new UserEvent({ client, dbName });

const user = new User({
  client,
  dbName,
  tokenRepo: token,
  userEventRepo: userEvent,
});

const wedding = new Wedding({ client, dbName });

const weddingManager = new WeddingManager({
  client,
  dbName,
  userRepo: user,
  weddingRepo: wedding,
});

module.exports = {
  token,
  user,
  userEvent,
  wedding,
  weddingManager,
};
