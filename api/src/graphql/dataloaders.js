const MongoDBLoader = require('@parameter1/dataloader-mongodb');
const repos = require('../repo');

module.exports = async () => {
  const loaders = {};
  await Promise.all(Object.keys(repos).map(async (key) => {
    const repo = repos[key];
    const collection = await repo.collection();
    loaders[key] = new MongoDBLoader({ collection });
  }));
  return loaders;
};
