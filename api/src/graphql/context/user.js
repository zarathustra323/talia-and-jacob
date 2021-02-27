const { get } = require('@parameter1/utils');

class UserContext {
  set(user) {
    this.user = user;
  }

  get(path, def) {
    return get(this.user, path, def);
  }
}

module.exports = UserContext;
