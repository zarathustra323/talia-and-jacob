const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Query {
  "Finds all managed weddings belonging to the currently logged-in user. The result is paginated."
  myManagedWeddings(input: MyManagedWeddingsQueryInput = {}): WeddingManagerConnection!
    @auth
  "Finds all managers for the provided wedding. The result is paginated."
  managersForWedding(input: ManagersForWeddingQueryInput!): WeddingManagerConnection!
    @auth
}

enum WeddingManagerRoleEnum {
  OWNER
  MEMBER
  RESTRICTED
}

enum WeddingManagerSortFieldEnum {
  ID
  INVITE_SENT_AT
  WEDDING_TITLE
  WEDDING_UPDATED_AT
  USER_EMAIL
}

enum WeddingManagerStatusEnum {
  ACTIVE
  INVITED
}

"""
- Signifies that a user is a manager of a wedding: e.g. user X is a manager of wedding Y
- Has roles for managing the wedding
- Dictates that the user can perform high-level wedding management operations
- Can invite other users to become managers
"""
type WeddingManager implements ChangedDateInterface @interfaceFields {
  "The internal wedding manager identifier."
  id: ObjectID! @project(field: "_id")
  "The wedding the manager belongs to."
  wedding: Wedding! @project
  "The user that manages the wedding."
  user: User! @project
  "The wedding manager role."
  role: WeddingManagerRoleEnum! @project
  "The current status of the wedding manager."
  status: WeddingManagerStatusEnum! @project
  "The wedding manager invitation details, if applicable."
  invitation: WeddingManagerInvitation @project(field: "invite")
}

type WeddingManagerConnection @projectUsing(type: "WeddingManager") {
  "The total number of records found in the query."
  totalCount: Int!
  "An array of edge objects containing the record and the cursor."
  edges: [WeddingManagerEdge]!
  "Contains the pagination info for this query."
  pageInfo: PageInfo!
}

type WeddingManagerEdge {
  "The edge result node."
  node: WeddingManager!
  "The opaque cursor value for this record edge."
  cursor: String!
}

type WeddingManagerInvitation {
  "The user that sent the invitation."
  sentBy: User! @project
  "The date the invitation was sent."
  sentAt: Date! @project
  "The date the invite was accepted."
  acceptedAt: Date @project
}

input ManagersForWeddingQueryInput {
  "The wedding ID to return members for."
  weddingId: ObjectID!
  "The manager status to filter managers by. Leaving empty will prevent filtering by status."
  status: [WeddingManagerStatusEnum!] = []
  "Sets sorting criteria for the query."
  sort: WeddingManagerSortInput
  "Sets pagination (limit/after) criteria for the query."
  pagination: PaginationInput = {}
}

input MyManagedWeddingsQueryInput {
  "The manager status to filter managers by. Leaving empty will prevent filtering by status."
  status: [WeddingManagerStatusEnum!] = []
  "Sets sorting criteria for the query."
  sort: WeddingManagerSortInput
  "Sets pagination (limit/after) criteria for the query."
  pagination: PaginationInput = {}
}

input WeddingManagerSortInput {
  "The field to sort by."
  field: WeddingManagerSortFieldEnum
  "The sort order, either \`DESC\` or \`ASC\`"
  order: SortOrderEnum
}



`;
