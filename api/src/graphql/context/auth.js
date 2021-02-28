const { ApolloError, UserInputError } = require('apollo-server-express');
const UserContext = require('./user');

class AuthContext {
  /**
   * @param {object} params
   * @param {string} [params.header] The Authorization header value
   * @param {WeddingManagerRepoRepo} params.weddingManagerRepo The wedding manager repo.
   */
  constructor({ header, weddingManagerRepo } = {}) {
    this.header = header;
    this.weddingManagerRepo = weddingManagerRepo;
    this.userRepo = weddingManagerRepo.userRepo;
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
   * @param {string} action
   * @param {object} [params={}]
   */
  async checkCan(action, params = {}) {
    const userId = this.getUserId();
    if (!action) throw new Error('Unable to authorize: no action was provided.');

    const checkParam = (key) => {
      if (!params[key]) throw new Error(`Unable to authorize: no '${key}' was provided.`);
    };

    const checkManagerRole = async (weddingId, roles) => {
      checkParam('weddingId');
      return this.checkWeddingManagerRole({ weddingId, roles });
    };

    switch (action) {
      case 'accomodation:create':
        return checkManagerRole(params.weddingId, ['Owner', 'Member']);
      case 'event:create':
        return checkManagerRole(params.weddingId, ['Owner', 'Member']);
      case 'wedding:register':
        return this.isValid(); // must be logged-in
      case 'wedding-manager:list-for-wedding':
        return checkManagerRole(params.weddingId); // any role
      case 'wedding-manager:accept-invite':
        checkParam('userId');
        if (`${params.userId}` === `${userId}`) return true;
        throw AuthContext.error('You do not have the proper permissions to perform this operation.', 403);
      case 'wedding-manager:reject-invite':
        checkParam('userId');
        if (`${params.userId}` === `${userId}`) return true;
        throw AuthContext.error('You do not have the proper permissions to perform this operation.', 403);
      case 'wedding-manager:send-invite':
        return checkManagerRole(params.weddingId, ['Owner']); // owner
      case 'wedding-manager:resend-invite':
        return checkManagerRole(params.weddingId, ['Owner']); // owner
      case 'wedding-manager:set-role':
        return checkManagerRole(params.weddingId, ['Owner']); // owner
      case 'wedding-manager:delete':
        checkParam('userId');
        if (`${params.userId}` === `${userId}`) throw new UserInputError('You currently cannot remove yourself as a manager.');
        return checkManagerRole(params.weddingId, ['Owner']); // owner
      default:
        throw new Error(`Unable to find an authorization action for '${action}'`);
    }
  }

  /**
   * @param {object} params
   * @param {*} params.weddingId
   * @param {*} params.roles
   */
  async checkWeddingManagerRole({ weddingId, roles }) {
    this.check();
    const userId = this.getUserId();
    const hasRole = await this.weddingManagerRepo.checkRole({
      weddingId,
      userId,
      roles,
    });
    if (!hasRole) throw AuthContext.error('You do not have the proper wedding permissions to perform this operation.', 403);
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
