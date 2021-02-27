const { makeExecutableSchema } = require('apollo-server-express');
const resolvers = require('./resolvers');
const typeDefs = require('./definitions');

module.exports = makeExecutableSchema({
  typeDefs,
  resolvers,
});
