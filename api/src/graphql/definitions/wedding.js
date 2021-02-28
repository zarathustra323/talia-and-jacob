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
  "Events for this wedding."
  events(input: WeddingEventsInput = {}): EventConnection!
  "The wedding day."
  day(input: FormatDateInput = { format: "dddd, MMMM D, YYYY" }): String!
    @formatDate(field: "day", inputArg: "input")
    @project
}

input RegisterNewWeddingMutationInput {
  "The wedding title."
  title: String!
  "The wedding day date. This will be saved as the start of day, in GMT. In other words, it ignores timezones."
  day: Day!
  "The unique slug of this wedding. If not specified, will be generated from the wedding title. This will be used for generating the sub-domain of the wedding website."
  slug: String
}

input WeddingEventsInput {
  "Sets sorting criteria for the query."
  sort: EventSortInput
  "Sets pagination (limit/after) criteria for the query."
  pagination: PaginationInput = {}
}

`;
