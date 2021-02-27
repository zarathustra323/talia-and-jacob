const merge = require('lodash.merge');
const pagination = require('@parameter1/graphql-mongodb-pagination/resolvers');

module.exports = merge(
  pagination,

  {
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
