/* eslint-disable class-methods-use-this */
const { SchemaDirectiveVisitor } = require('apollo-server-express');

class AuthDirective extends SchemaDirectiveVisitor {
  /**
   *
   * @param {*} field
   */
  visitFieldDefinition(field) {
    const { resolve } = field;

    // eslint-disable-next-line no-param-reassign
    field.resolve = async (...args) => {
      const [, , { auth }] = args;
      auth.check();
      if (typeof resolve === 'function') return resolve(...args);
      return null;
    };
  }
}

module.exports = AuthDirective;
