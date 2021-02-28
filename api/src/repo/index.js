const client = require('../mongodb');
const { DB_NAME: dbName } = require('../mongodb/constants');
const googleMaps = require('../google-maps');

const Event = require('./event');
const GooglePlace = require('./google-place');
const Token = require('./token');
const User = require('./user');
const UserEvent = require('./user-event');
const Wedding = require('./wedding');
const WeddingManager = require('./wedding-manager');

const googlePlace = new GooglePlace({ client, dbName, googleMaps });
const token = new Token({ client, dbName });
const userEvent = new UserEvent({ client, dbName });

const user = new User({
  client,
  dbName,
  tokenRepo: token,
  userEventRepo: userEvent,
});

const wedding = new Wedding({ client, dbName });

const event = new Event({
  client,
  dbName,
  googlePlaceRepo: googlePlace,
  weddingRepo: wedding,
});

const weddingManager = new WeddingManager({
  client,
  dbName,
  userRepo: user,
  weddingRepo: wedding,
});

module.exports = {
  event,
  googlePlace,
  token,
  user,
  userEvent,
  wedding,
  weddingManager,
};
