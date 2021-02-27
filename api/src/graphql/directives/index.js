const projectDirectives = require('@parameter1/graphql-directive-project/directives');
const interfaceDirectives = require('@parameter1/graphql-directive-interface-fields/directives');
const AuthDirective = require('./auth');

module.exports = {
  ...projectDirectives.classes,
  ...interfaceDirectives.classes,
  auth: AuthDirective,
};
