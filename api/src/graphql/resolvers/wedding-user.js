module.exports = {
  /**
   *
   */
  WeddingUserRoleEnum: {
    OWNER: 'Owner',
    MEMBER: 'Member',
    RESTRICTED: 'Restricted',
  },

  /**
   *
   */
  WeddingUserSortFieldEnum: {
    ID: '_id',
    INVITE_SENT_AT: 'invite.sentAt',
    WEDDING_TITLE: 'wedding.title',
    WEDDING_UPDATED_AT: 'wedding.updatedAt',
    USER_EMAIL: 'user.email',
  },

  /**
   *
   */
  WeddingUserStatusEnum: {
    ACTIVE: 'Active',
    INVITED: 'Invited',
  },
};
