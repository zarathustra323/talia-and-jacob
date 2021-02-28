const { connectionProjection } = require('@parameter1/graphql-directive-project/utils');
const { WeddingManagerRoleEnum: WeddingManagerRoles } = require('./wedding-manager');

module.exports = {
  /**
   *
   */
  WeddingSortFieldEnum: {
    ID: '_id',
    TITLE: 'title',
    SLUG: 'slug',
    UPDATED_AT: 'updatedAt',
  },

  /**
   *
   */
  Wedding: {
    /**
     *
     */
    events(wedding, { input }, { repos }, info) {
      const { sort, pagination } = input;
      const options = {
        sort,
        projection: connectionProjection(info),
        ...pagination,
      };
      return repos.event.paginateForWedding({ weddingId: wedding._id, options });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    async registerNewWedding(_, { input }, { repos, auth }) {
      await auth.checkCan('wedding:register');
      const userId = auth.getUserId();
      const { title, slug, day } = input;
      const { wedding } = await repos.weddingManager.registerNewWedding({
        payload: { title, slug, day: day.toDate() },
        userId,
        role: WeddingManagerRoles.OWNER,
      });
      return wedding;
    },
  },
};
