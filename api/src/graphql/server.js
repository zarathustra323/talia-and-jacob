const http = require('http');
const { ApolloServer } = require('apollo-server-express');
const { get, set } = require('@parameter1/utils');
const schema = require('./schema');
const { isProduction } = require('../env');
const context = require('./context');

const { STATUS_CODES } = http;

module.exports = ({ app, path }) => {
  const server = new ApolloServer({
    context,
    schema,
    tracing: false,
    cacheControl: false,
    introspection: true,
    debug: isProduction ? false : { endpoint: path },
    playground: !isProduction,
    formatError: (err) => {
      const code = get(err, 'extensions.exception.statusCode');
      if (code) set(err, 'extensions.code', STATUS_CODES[code].replace(/\s/g, '_').toUpperCase());
      return err;
    },
  });
  server.applyMiddleware({ app, path });
  return server;
};
