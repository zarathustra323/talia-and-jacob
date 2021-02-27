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
      const { title, slug } = input;
      const { wedding } = await repos.weddingManager.registerNewWedding({
        payload: { title, slug },
        userId,
        role: WeddingManagerRoles.OWNER,
      });
      return wedding;
    },
  },
};
