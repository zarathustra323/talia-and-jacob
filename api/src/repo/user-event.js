const { Repo } = require('@parameter1/mongodb/repo');
const { validateAsync } = require('@parameter1/joi/utils');
const Joi = require('../joi');
const createSchema = require('../schema/user-event/create');

class UserEventRepo extends Repo {
  /**
   *
   */
  constructor({ client, dbName } = {}) {
    super({
      name: 'user event',
      collectionName: 'user-events',
      dbName,
      client,
    });
  }

  /**
   * @param {object} params
   * @param {object} params.payload
   * @param {string} params.payload.userId
   * @param {string} params.payload.action
   * @param {Date}  [params.payload.date]
   * @param {string} [params.payload.ip]
   * @param {string} [params.payload.ua]
   * @param {pbject} [params.payload.data]
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const { payload, options } = await validateAsync(Joi.object({
      payload: createSchema.required(),
      options: Joi.object().default({}),
    }).required(), params);
    const { ip, ua, data } = payload;
    const doc = {
      user: { _id: payload.userId },
      action: payload.action,
      date: payload.date,
      ...(ip && { ip }),
      ...(ua && { ua }),
      ...(data && { data }),
    };
    return this.insertOne({ doc, options });
  }
}

module.exports = UserEventRepo;
