const merge = require('lodash.merge');
const { ObjectId } = require('@parameter1/mongodb');
const GraphQLDate = require('@parameter1/graphql-type-date');
const GraphQLObjectID = require('@parameter1/graphql-type-objectid');
const pagination = require('@parameter1/graphql-mongodb-pagination/resolvers');
const GraphQLDay = require('../types/day');

const user = require('./user');
const wedding = require('./wedding');
const weddingManager = require('./wedding-manager');

const genericResolveType = (_, __, info) => info.returnType.ofType.name;

module.exports = merge(
  pagination,

  user,
  wedding,
  weddingManager,

  {
    Day: GraphQLDay,
    Date: GraphQLDate,
    ObjectID: GraphQLObjectID(ObjectId),

    /**
     *
     */
    ChangedDateInterface: {
      /**
       *
       */
      __resolveType: genericResolveType,
    },

    /**
     *
     */
    Mutation: {
      /**
       *
       */
      ping() {
        return 'pong';
      },
    },

    /**
     *
     */
    Query: {
      /**
       *
       */
      ping() {
        return 'pong';
      },
    },
  },
);
