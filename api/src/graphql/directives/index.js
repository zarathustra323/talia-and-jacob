const projectDirectives = require('@parameter1/graphql-directive-project/directives');
const AuthDirective = require('./auth');

module.exports = {
  ...projectDirectives.classes,
  auth: AuthDirective,
};
