const projectDirectives = require('@parameter1/graphql-directive-project/directives');
const formatDateDirectives = require('@parameter1/graphql-directive-format-date/directives');
const interfaceDirectives = require('@parameter1/graphql-directive-interface-fields/directives');
const AuthDirective = require('./auth');

module.exports = {
  ...projectDirectives.classes,
  ...formatDateDirectives.classes,
  ...interfaceDirectives.classes,
  auth: AuthDirective,
};
