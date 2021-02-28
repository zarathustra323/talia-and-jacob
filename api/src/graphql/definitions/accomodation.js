const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Mutation {
  "Cretes a new accomodation for a wedding. The currently logged-in user must manage the wedding."
  createAccomodation(input: CreateAccomodationMutationInput!): Accomodation!
    @auth
}

enum AccomodationSortFieldEnum {
  ID
  NAME
}

"""
Signifies an accomodation at a wedding, i.e. a hotel.
"""
type Accomodation {
  "The internal accomodation identifier."
  id: ObjectID! @project(field: "_id")
  "The wedding this accomodation belongs to."
  wedding: Wedding! @project
  "The (optional) accomodation description."
  description: String @project
  "The Google place where the accomodation is located."
  place: Place! @project
  "The room block information for this accomodation."
  roomBlock: AccomodationRoomBlock @project
}

type AccomodationRoomBlock {
  "The room block check-in date."
  checkIn(input: FormatDateInput = { format: "MMM D, YYYY" }): String!
    @formatDate(field: "checkIn", inputArg: "input")
  "The room block check-out date."
  checkOut(input: FormatDateInput = { format: "MMM D, YYYY" }): String!
    @formatDate(field: "checkOut", inputArg: "input")
  "The room block code."
  code: String
  "The room block rate."
  rate: Float
}

type AccomodationConnection @projectUsing(type: "Accomodation") {
  "The total number of records found in the query."
  totalCount: Int!
  "An array of edge objects containing the record and the cursor."
  edges: [AccomodationEdge]!
  "Contains the pagination info for this query."
  pageInfo: PageInfo!
}

type AccomodationEdge {
  "The edge result node."
  node: Accomodation!
  "The opaque cursor value for this record edge."
  cursor: String!
}

input CreateAccomodationMutationInput {
  "The wedding ID this accomodation is for."
  weddingId: ObjectID!
  "The Google Place ID where the accomodation is located."
  placeId: String!
  "The (optional) accomodation description."
  description: String
  "The room block information for this accomodation."
  roomBlock: CreateAccomodationMutationRoomBlockInput
}

input CreateAccomodationMutationRoomBlockInput {
  "The room block check-in date."
  checkIn: Day
  "The room block check-out date."
  checkOut: Day
  "The room block code."
  code: String
  "The room block rate."
  rate: Float
}

input AccomodationSortInput {
  "The field to sort by."
  field: AccomodationSortFieldEnum
  "The sort order, either \`DESC\` or \`ASC\`"
  order: SortOrderEnum
}

`;
