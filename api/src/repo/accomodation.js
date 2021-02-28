const { validateAsync } = require('@parameter1/joi/utils');
const Joi = require('../joi');
const PaginableRepo = require('./-paginable');
const PlaceRepo = require('./place');
const WeddingRepo = require('./wedding');
const fields = require('../schema/accomodation/fields');
const placeFields = require('../schema/place/fields');
const weddingFields = require('../schema/wedding/fields');

class AccomodationRepo extends PaginableRepo {
  /**
   *
   */
  constructor({
    client,
    dbName,
    placeRepo,
    weddingRepo,
  } = {}) {
    super({
      name: 'accomodation',
      collectionName: 'accomodations',
      dbName,
      client,
      collatableFields: ['name'],
    });
    if (!(placeRepo instanceof PlaceRepo)) throw new Error('The `placeRepo` must be an instance of PlaceRepo');
    if (!(weddingRepo instanceof WeddingRepo)) throw new Error('The `weddingRepo` must be an instance of WeddingRepo');
    this.placeRepo = placeRepo;
    this.weddingRepo = weddingRepo;
  }

  /**
   * @param {object} params
   * @param {ObjectID} params.weddingId
   * @param {string} params.placeId
   * @param {string} [params.description]
   * @param {object} [params.roomBlock]
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      weddingId,
      placeId,
      description,
      roomBlock,
      options,
    } = await validateAsync(Joi.object({
      weddingId: weddingFields.id.required(),
      placeId: placeFields.id.required(),
      description: fields.description,
      roomBlock: fields.roomBlock,
      options: Joi.object().default({}),
    }).required(), params);

    const session = await this.client.startSession();

    let accomodation;
    await session.withTransaction(async () => {
      const [wedding, place] = await Promise.all([
        this.weddingRepo.findByObjectId({
          id: weddingId,
          options: { strict: true, projection: { _id: 1 }, session },
        }),
        this.placeRepo.upsertOne({
          placeId,
          updateOptions: { session },
          findOptions: { session, projection: { _id: 1 } },
        }),
      ]);

      const doc = {
        wedding,
        place,
        description,
        roomBlock,
      };
      accomodation = await this.insertOne({ doc, options: { ...options, withDates: true } });
    });
    session.endSession();
    return accomodation;
  }

  /**
   *
   * @param {object} params
   * @param {ObjectID} params.weddingId
   * @param {object} [params.options]
   */
  async paginateForWedding(params = {}) {
    const { weddingId, options } = await validateAsync(Joi.object({
      weddingId: weddingFields.id.required(),
      options: Joi.object().default({}),
    }).required(), params);
    const query = { 'wedding._id': weddingId };
    return this.paginate({ ...options, query });
  }
}

module.exports = AccomodationRepo;
