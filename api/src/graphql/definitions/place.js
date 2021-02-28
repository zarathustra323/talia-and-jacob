const { gql } = require('apollo-server-express');

module.exports = gql`

type Place {
  "The Google Place ID."
  id: String! @project(field: "_id")
  "The place name."
  name: String! @project(field: "result.name")
  "The full address of the place."
  fullAddress: String! @project(field: "result.formatted_address")
  "The place's phone number."
  phoneNumber: String @project(field: "result.formatted_phone_number")
  "The place's website."
  website: String @project(field: "result.website")
  "The Google maps URL of the place."
  mapsUrl: String @project(field: "result.url")
}

`;
