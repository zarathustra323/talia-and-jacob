const client = require('../mongodb');
const { DB_NAME: dbName } = require('../mongodb/constants');
const googleMaps = require('../google-maps');

const Accomodation = require('./accomodation');
const Event = require('./event');
const Place = require('./place');
const Token = require('./token');
const User = require('./user');
const UserEvent = require('./user-event');
const Wedding = require('./wedding');
const WeddingManager = require('./wedding-manager');

const place = new Place({ client, dbName, googleMaps });
const token = new Token({ client, dbName });
const userEvent = new UserEvent({ client, dbName });

const user = new User({
  client,
  dbName,
  tokenRepo: token,
  userEventRepo: userEvent,
});

const wedding = new Wedding({ client, dbName });

const accomodation = new Accomodation({
  client,
  dbName,
  placeRepo: place,
  weddingRepo: wedding,
});

const event = new Event({
  client,
  dbName,
  placeRepo: place,
  weddingRepo: wedding,
});

const weddingManager = new WeddingManager({
  client,
  dbName,
  userRepo: user,
  weddingRepo: wedding,
});

module.exports = {
  accomodation,
  event,
  place,
  token,
  user,
  userEvent,
  wedding,
  weddingManager,
};
