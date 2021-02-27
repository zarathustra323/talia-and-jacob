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
};
