const { Repo } = require('@parameter1/mongodb/repo');
const { find } = require('@parameter1/graphql-mongodb-pagination');
const { get } = require('@parameter1/utils');

class PaginableRepo extends Repo {
  /**
   *
   */
  constructor({
    name,
    collectionName,
    client,
    dbName,
    collatableFields = [],
  } = {}) {
    super({
      name,
      collectionName,
      dbName,
      client,
    });
    this.collatableFields = Array.isArray(collatableFields)
      ? collatableFields.reduce((o, field) => ({ ...o, [field]: true }), {})
      : {};
  }

  /**
   * @param {object} params
   */
  async paginate({
    query,
    limit,
    after,
    sort,
    projection,
    excludeProjection,
    additionalData,
  } = {}) {
    const collection = await this.collection();
    const sortField = get(sort, 'field');
    return find(collection, {
      query,
      limit,
      after,
      sort,
      projection,
      excludeProjection,
      collate: this.collatableFields[sortField],
      additionalData,
    });
  }
}

module.exports = PaginableRepo;
