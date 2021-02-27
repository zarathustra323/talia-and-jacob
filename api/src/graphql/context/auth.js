const { ApolloError } = require('apollo-server-express');
const UserContext = require('./user');

class AuthContext {
  /**
   * @param {object} params
   * @param {string} [params.header] The Authorization header value
   * @param {UserRepo} params.userRepo The user repository
   */
  constructor({ header, userRepo } = {}) {
    this.header = header;
    this.userRepo = userRepo;
    this.user = new UserContext();
  }

  /**
   *
   */
  async load() {
    if (!this.header) return;
    const { type, value } = this.parseHeader();
    try {
      if (type !== 'Bearer') throw AuthContext.error(`The auth type '${type}' is not supported.`, 400);
      const options = { projection: { email: 1 } };
      const user = await this.userRepo.verifyBearerAuth({ token: value, options });
      this.user.set(user);
      // @todo when more auth strategies are added, will need to determine
      // how to logout besides using the bearerToken
      this.token = value;
    } catch (e) {
      this.error = e;
    }
  }

  /**
   *
   */
  check() {
    if (this.didError()) throw AuthContext.error(this.error.message);
    if (!this.hasUser()) throw AuthContext.error('You must be authenticated to access this resource.');
    return true;
  }

  /**
   * @todo This is a preliminary interface for checking roles and is not complete.
   * @todo Update to work in a more elegant way.
   * @param {string} action
   */
  async checkCan(action) {
    switch (action) {
      case 'wedding:register':
        return this.isValid(); // must be logged-in
      default:
        throw new Error(`Unable to find an authorization action for '${action}'`);
    }
  }

  /**
   *
   */
  isValid() {
    try {
      this.check();
      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   *
   */
  getUserId() {
    return this.user.get('_id');
  }

  /**
   *
   */
  hasUser() {
    return Boolean(this.getUserId());
  }

  /**
   *
   */
  didError() {
    return Boolean(this.error);
  }

  /**
   *
   */
  parseHeader() {
    const { header } = this;
    if (!header) return {};
    const [type, value] = header.trim().replace(/\s\s+/, ' ').split(' ');
    return { type, value };
  }

  /**
   *
   */
  static error(message, statusCode = 401) {
    const e = new ApolloError(message);
    e.statusCode = statusCode;
    return e;
  }
}

module.exports = AuthContext;
