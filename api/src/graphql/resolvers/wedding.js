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
