const { validateAsync } = require('@parameter1/joi/utils');
const { get } = require('@parameter1/utils');
const Joi = require('../joi');
const PaginableRepo = require('./-paginable');
const fields = require('../schema/place/fields');

class PlaceRepo extends PaginableRepo {
  /**
   *
   */
  constructor({
    client,
    dbName,
    googleMaps,
  } = {}) {
    super({
      name: 'place',
      collectionName: 'places',
      dbName,
      client,
    });
    if (!googleMaps) throw new Error('The Google Maps API is required.');
    this.googleMaps = googleMaps;
  }

  /**
   * @param {object} params
   * @param {ObjectID} params.placeId
   * @param {object} [params.findOptions]
   * @param {object} [params.updateOptions]
   */
  async upsertOne(params = {}) {
    const {
      placeId,
      findOptions,
      updateOptions,
    } = await validateAsync(Joi.object({
      placeId: fields.id.required(),
      findOptions: Joi.object().default({}),
      updateOptions: Joi.object().default({}),
    }).required(), params);

    const res = await this.googleMaps.placeDetails({
      params: { place_id: placeId },
    });
    const result = get(res, 'data.result');
    if (!result) throw new Error(`Unable to find place details for ID ${placeId}`);

    const query = { _id: placeId };
    const update = {
      $setOnInsert: query,
      $set: { result, lastRetrievedAt: new Date() },
    };
    await super.updateOne({ query, update, options: { ...updateOptions, upsert: true } });
    return super.findOne({ query, options: findOptions });
  }
}

module.exports = PlaceRepo;
