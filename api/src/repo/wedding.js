const { validateAsync } = require('@parameter1/joi/utils');
const Joi = require('../joi');
const PaginableRepo = require('./-paginable');
const fields = require('../schema/wedding/fields');

class WeddingRepo extends PaginableRepo {
  /**
   *
   */
  constructor({ client, dbName } = {}) {
    super({
      name: 'wedding',
      collectionName: 'weddings',
      dbName,
      client,
      collatableFields: ['title'],
    });
  }

  /**
   * @param {object} params
   * @param {string} params.name
   * @param {string} [params.slug]
   */
  async create(params = {}) {
    const { payload, options } = await validateAsync(Joi.object({
      payload: Joi.object({
        title: fields.title.required(),
        slug: fields.slug,
      }).required(),
      options: Joi.object().default({}),
    }).required(), {
      ...params,
      payload: { ...params.payload, slug: params.payload.slug || params.payload.title },
    });
    return this.insertOne({ doc: payload, options: { ...options, withDates: true } });
  }
}

module.exports = WeddingRepo;
