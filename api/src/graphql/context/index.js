const AuthContext = require('./auth');
const repos = require('../../repo');

module.exports = async ({ req }) => {
  const auth = new AuthContext({
    header: req.get('authorization'),
    userRepo: repos.user,
  });
  await auth.load();
  return {
    auth,
    req,
    repos,
    ip: req.ip,
    ua: req.get('user-agent'),
  };
};
