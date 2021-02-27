const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  "Returns the currently logged-in user. Will return an authentication error if no user is logged-in."
  currentUser: User! @auth
}

extend type Mutation {
  "Logs a user in via a magic login link token."
  loginUserFromLink(input: LoginUserFromLinkMutationInput!): UserAuth!
  "Logs out the currently logged-in user."
  logoutUser: String! @auth
  "Registers a new user."
  registerUser(input: RegisterUserMutationInput!): User!
  "Sends a magic login link to a user. The user must already exist."
  sendUserLoginLink(input: SendUserLoginLinkMutationInput!): String!
}

type User {
  "The unique ID of the User."
  id: ObjectID! @project(field: "_id")
  "The email address of the User. This value is required and is unique."
  email: String! @project
  "The user's given/first name."
  givenName: String! @project
  "The user's family/last name."
  familyName: String! @project
  "The user's full name."
  name: String @project
  "Whether the user has been verified via email."
  verified: Boolean! @project
  "The number of times the user has logged in."
  loginCount: Int! @project
  "The timestamp (in milliseconds) when the user last logged in."
  lastLoggedInAt: Date @project
  "The timestamp (in milliseconds) when the user was last seen accessing the system."
  lastSeenAt: Date @project
  "The timestamp (in milliseconds) when this user was created."
  createdAt: Date @project
  "The timestamp (in milliseconds) when this user was last updated."
  updatedAt: Date @project
}

type UserAuth {
  "The user object."
  user: User!
  "The authentication JWT. Use this value to authenticate requests."
  authToken: String!
}

input LoginUserFromLinkMutationInput {
  "The JWT token provided from the user login link."
  loginToken: String!
}

input RegisterUserMutationInput {
  "The user's email address."
  email: String!
  "The user's given/first name."
  givenName: String!
  "The user's family/last name."
  familyName: String!
  "A location to redirect the user to after successful authentication."
  redirectTo: String
}

input SendUserLoginLinkMutationInput {
  "The user email address to send the login link to. The user must exist."
  email: String!
  "A location to redirect the user to after successful authentication."
  redirectTo: String
}

`;
