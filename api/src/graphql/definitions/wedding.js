const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Mutation {
  "Registers (creates) a new wedding and sets the current user as the owner."
  registerNewWedding(input: RegisterNewWeddingMutationInput!): Wedding!
    @auth
}

enum WeddingSortFieldEnum {
  ID
  TITLE
  SLUG
  UPDATED_AT
}

type Wedding implements ChangedDateInterface @interfaceFields {
  "The unique ID of the Wedding."
  id: ObjectID! @project(field: "_id")
  "The title of the wedding."
  title: String! @project
  "The unique slug of this wedding. Is used for generating the sub-domain of the wedding website."
  slug: String! @project
}

input RegisterNewWeddingMutationInput {
  "The wedding title."
  title: String!
  "The unique slug of this wedding. If not specified, will be generated from the wedding title. This will be used for generating the sub-domain of the wedding website."
  slug: String
}

`;
