const { gql } = require('apollo-server-express');

module.exports = gql`

enum WeddingUserRoleEnum {
  OWNER
  MEMBER
  RESTRICTED
}

enum WeddingUserSortFieldEnum {
  ID
  INVITE_SENT_AT
  WEDDING_TITLE
  WEDDING_UPDATED_AT
  USER_EMAIL
}

enum WeddingUserStatusEnum {
  ACTIVE
  INVITED
}

`;
