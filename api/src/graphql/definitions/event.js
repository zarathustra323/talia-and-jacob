const { gql } = require('apollo-server-express');

module.exports = gql`

extend type Mutation {
  "Cretes a new event for a wedding. The currently logged-in user must manage the wedding."
  createEvent(input: CreateEventMutationInput!): Event!
    @auth
}

"""
Signifies an event that will occur as a part of a wedding.
Some obvious events incude:
- Ceremony
- Reception
- Rehearsal Dinner
"""
type Event {
  "The internal event identifier."
  id: ObjectID! @project(field: "_id")
  "The wedding this event belongs to."
  wedding: Wedding! @project
  "The event name, e.g. 'Ceremony' or 'Reception'"
  name: String! @project
  "The (optional) event description."
  description: String @project
  "The event start date and time. @todo Need to determine timezone here!"
  startsAt: Date! @project
  "The event end date and time. @todo Need to determine timezone here!"
  endsAt: Date! @project
  "The Google place that the event will take place at."
  place: GooglePlace! @project
  "Available meal options at this event."
  meals: [EventMeal!]! @project
  "Whether this event is enabled for invitations by default."
  inviteByDefault: Boolean! @project
}

type EventMeal {
  "The internal meal identifier."
  id: ObjectID!
  "The meal name/title."
  title: String!
  "The (optional) meal description"
  description: String
}

input CreateEventMutationInput {
  "The wedding ID to set this event to."
  weddingId: ObjectID!
  "The Google Place ID where this event will occur."
  placeId: String!
  "The event name, e.g. 'Ceremony' or 'Reception'"
  name: String!
  "The (optional) event description."
  description: String
  "The event start date and time. @todo Need to determine timezone here!"
  startsAt: Date!
  "The event end date and time. @todo Need to determine timezone here!"
  endsAt: Date!
  "Whether this event is enabled for invitations by default."
  inviteByDefault: Boolean = true
}

`;
