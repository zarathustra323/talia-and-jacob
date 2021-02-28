const { gql } = require('apollo-server-express');

module.exports = gql`

type GooglePlace {
  "The Google Place ID."
  id: String! @project(field: "_id")
  "The place name."
  name: String! @project
  "The formatted address."
  formattedAddress: String! @project
}

`;
