const { connectionProjection, typeProjection } = require('@parameter1/graphql-directive-project/utils');

module.exports = {
  /**
   *
   */
  WeddingManagerRoleEnum: {
    OWNER: 'Owner',
    MEMBER: 'Member',
    RESTRICTED: 'Restricted',
  },

  /**
   *
   */
  WeddingManagerSortFieldEnum: {
    ID: '_id',
    INVITE_SENT_AT: 'invite.sentAt',
    WEDDING_TITLE: 'wedding.title',
    WEDDING_UPDATED_AT: 'wedding.updatedAt',
    USER_EMAIL: 'user.email',
  },

  /**
   *
   */
  WeddingManagerStatusEnum: {
    ACTIVE: 'Active',
    INVITED: 'Invited',
  },

  /**
   *
   */
  WeddingManager: {
    /**
     *
     */
    wedding({ wedding }, _, { loaders }, info) {
      const projection = typeProjection(info);
      const localFields = ['_id', 'title', 'slug', 'updatedAt', 'createdAt'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return wedding;
      return loaders.wedding.load({ id: wedding._id, projection });
    },

    /**
     *
     */
    user({ user }, _, { loaders }, info) {
      const projection = typeProjection(info);
      const localFields = ['_id', 'email'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return user;
      return loaders.user.load({ id: user._id, projection });
    },
  },

  /**
   *
   */
  WeddingManagerInvitation: {
    /**
     *
     */
    sentBy({ sentBy }, _, { loaders }, info) {
      const projection = typeProjection(info);
      const localFields = ['_id', 'email'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return sentBy;
      return loaders.user.load({ id: sentBy._id, projection });
    },
  },

  /**
   *
   */
  Query: {
    /**
     *
     */
    myManagedWeddings(_, { input }, { repos, auth }, info) {
      const userId = auth.getUserId();
      const { sort, pagination, status } = input;
      const options = {
        sort,
        projection: connectionProjection(info),
        ...pagination,
      };
      return repos.weddingManager.paginateForUser({ userId, status, options });
    },

    /**
     *
     */
    async managersForWedding(_, { input }, { repos, auth }, info) {
      const {
        weddingId,
        status,
        sort,
        pagination,
      } = input;
      await auth.checkCan('wedding-manager:list-for-wedding', { weddingId });
      const options = {
        sort,
        projection: connectionProjection(info),
        ...pagination,
      };
      return repos.weddingManager.paginateForWedding({ weddingId, status, options });
    },
  },
};
