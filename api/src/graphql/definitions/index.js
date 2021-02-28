const { gql } = require('apollo-server-express');
const projectDirectives = require('@parameter1/graphql-directive-project/directives');
const formatDateDirectives = require('@parameter1/graphql-directive-format-date/directives');
const interfaceDirectives = require('@parameter1/graphql-directive-interface-fields/directives');
const pagination = require('@parameter1/graphql-mongodb-pagination/definitions');

const event = require('./event');
const google = require('./google');
const user = require('./user');
const wedding = require('./wedding');
const weddingManager = require('./wedding-manager');

module.exports = gql`

${projectDirectives.typeDefs}
${formatDateDirectives.typeDefs}
${interfaceDirectives.typeDefs}
directive @auth on FIELD_DEFINITION

scalar Day
scalar Date
scalar ObjectID

${pagination}

interface ChangedDateInterface {
  "The timestamp (in milliseconds) when the record was created."
  createdAt: Date! @project
  "The timestamp (in milliseconds) when the record was last updated."
  updatedAt: Date! @project
  "A formattable, string date when the record was created."
  createdDate(input: FormatDateInput = {}): String!
    @formatDate(field: "createdAt", inputArg: "input")
    @project(field: "createdAt")
  "A formattable, string date when the record was last updated."
  updatedDate(input: FormatDateInput = {}): String!
    @formatDate(field: "updatedAt", inputArg: "input")
    @project(field: "updatedAt")
}

type Query {
  "A generic ping/pong test query."
  ping: String!
}

type Mutation {
  "A generic ping/pong test mutation."
  ping: String!
}

${event}
${google}
${user}
${wedding}
${weddingManager}

`;
