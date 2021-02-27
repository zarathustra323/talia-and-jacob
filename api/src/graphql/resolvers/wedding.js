const { WeddingUserRoleEnum: WeddingUserRoles } = require('./wedding-user');

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
      const { wedding } = await repos.weddingUser.registerNewWedding({
        payload: { title, slug },
        userId,
        role: WeddingUserRoles.OWNER,
      });
      return wedding;
    },
  },
};
