const { gql } = require('apollo-server-express');
const projectDirectives = require('@parameter1/graphql-directive-project/directives');
const interfaceDirectives = require('@parameter1/graphql-directive-interface-fields/directives');
const pagination = require('@parameter1/graphql-mongodb-pagination/definitions');

const user = require('./user');
const wedding = require('./wedding');
const weddingUser = require('./wedding-user');

module.exports = gql`

${projectDirectives.typeDefs}
${interfaceDirectives.typeDefs}
directive @auth on FIELD_DEFINITION

scalar Date
scalar ObjectID

${pagination}

interface ChangedDateInterface {
  "The timestamp (in milliseconds) when the record was created."
  createdAt: Date! @project
  "The timestamp (in milliseconds) when the record was last updated."
  updatedAt: Date! @project
}

type Query {
  "A generic ping/pong test query."
  ping: String!
}

type Mutation {
  "A generic ping/pong test mutation."
  ping: String!
}

${user}
${wedding}
${weddingUser}

`;
