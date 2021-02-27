const { makeExecutableSchema } = require('apollo-server-express');
const resolvers = require('./resolvers');
const schemaDirectives = require('./directives');
const typeDefs = require('./definitions');

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
  schemaDirectives,
});
