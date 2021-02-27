const { connectionProjection, typeProjection } = require('@parameter1/graphql-directive-project/utils');
const { APP_URL, EMAIL_FROM } = require('../../env');
const sendMail = require('../../send-email');

/**
 *
 * @todo Fix this
 * @todo Add proper invite routing
 */
const sendInvite = async ({ token, manager }) => {
  const { sentBy } = manager.invite;
  const next = `/invites/${manager._id}`;
  const url = `${APP_URL}/authenticate?token=${token}&next=${encodeURIComponent(next)}`;
  return sendMail({
    from: EMAIL_FROM,
    to: manager.user.email,
    subject: 'You\'ve been invited',
    html: `
      <p>${sentBy.name} (${sentBy.email}) has invited you to manage their wedding, <strong>${manager.wedding.title}</strong>.</p>
      <p><a href="${url}">View Invitation</a></p>
    `,
    text: `
      ${sentBy.name} (${sentBy.email}) has invited you to manage their wedding, ${manager.wedding.title}.
      View Invitation: ${url}
    `,
  });
};

const loadManager = ({ repos, id, projection }) => repos.weddingManager.findByObjectId({
  id,
  options: { strict: true, projection },
});

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
  Mutation: {
    /**
     *
     */
    async acceptWeddingManagerInvite(_, { input }, { repos, auth }) {
      const { id } = input;
      // lookup the manager.
      const manager = await loadManager({ repos, id, projection: { 'user._id': 1 } });
      await auth.checkCan('wedding-manager:accept-invite', { userId: manager.user._id });
      // accept the invite.
      return repos.weddingManager.acceptInvite({ id });
    },

    /**
     *
     */
    async rejectWeddingManagerInvite(_, { input }, { repos, auth }) {
      const { id } = input;
      // lookup the manager.
      const manager = await loadManager({ repos, id, projection: { 'user._id': 1 } });
      await auth.checkCan('wedding-manager:reject-invite', { userId: manager.user._id });
      // reject the invite.
      return repos.weddingManager.rejectInvite({ id });
    },

    /**
     *
     */
    async removeWeddingManager(_, { input }, { repos, auth }) {
      const { id } = input;
      // lookup the manager.
      const manager = await loadManager({ repos, id, projection: { 'wedding._id': 1, 'user._id': 1 } });
      await auth.checkCan('wedding-manager:delete', { weddingId: manager.wedding._id, userId: manager.user._id });
      await repos.weddingManager.deleteOne({ query: { _id: id } });
      return 'ok';
    },

    /**
     *
     */
    async resendWeddingManagerInvite(_, { input }, {
      repos,
      auth,
      ip,
      ua,
    }) {
      const { id } = input;
      // lookup the current manager.
      const man = await loadManager({ repos, id, projection: { 'wedding._id': 1 } });
      await auth.checkCan('wedding-manager:resend-invite', { weddingId: man.wedding._id });
      const userId = auth.getUserId();
      const { manager } = await repos.weddingManager.resendInvite({
        id,
        invitedById: userId,
        ip,
        ua,
        inTransaction: async (data) => sendInvite({
          manager: data.manager,
          token: data.loginToken,
        }),
      });
      return manager;
    },

    /**
     *
     */
    async sendWeddingManagerInvite(_, { input }, {
      repos,
      auth,
      ip,
      ua,
    }) {
      const { weddingId, email, role } = input;
      await auth.checkCan('wedding-manager:send-invite', { weddingId });
      const userId = auth.getUserId();
      const { manager } = await repos.weddingManager.createInvite({
        weddingId,
        email,
        role,
        invitedById: userId,
        ip,
        ua,
        inTransaction: async (data) => sendInvite({
          manager: data.manager,
          token: data.loginToken,
        }),
      });
      return manager;
    },

    /**
     *
     */
    async setWeddingManagerRole(_, { input }, { auth, repos }, info) {
      const { id, role } = input;
      // lookup the current manager.
      const man = await loadManager({ repos, id, projection: { 'wedding._id': 1 } });
      await auth.checkCan('wedding-manager:set-role', { weddingId: man.wedding._id });
      const projection = typeProjection(info);
      return repos.weddingManager.setRole({ id, role, options: { projection } });
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
