const { gql } = require('apollo-server-express');
const projectDirectives = require('@parameter1/graphql-directive-project/directives');
const pagination = require('@parameter1/graphql-mongodb-pagination/definitions');

const user = require('./user');

module.exports = gql`

${projectDirectives.typeDefs}
directive @auth on FIELD_DEFINITION

scalar Date
scalar ObjectID

${pagination}

type Query {
  "A generic ping/pong test query."
  ping: String!
}

type Mutation {
  "A generic ping/pong test mutation."
  ping: String!
}

${user}

`;
