const jwt = require('jsonwebtoken');
const { Repo } = require('@parameter1/mongodb/repo');
const { validateAsync } = require('@parameter1/joi/utils');
const { dateToUnix } = require('@parameter1/utils');
const Joi = require('../joi');
const createSchema = require('../schema/token/create');
const fields = require('../schema/token/fields');
const { TOKEN_SECRET } = require('../env');

class TokenRepo extends Repo {
  /**
   *
   */
  constructor({ client, dbName } = {}) {
    super({
      name: 'token',
      collectionName: 'tokens',
      dbName,
      client,
    });
  }

  /**
   * @param {object} params
   * @param {object} params.payload
   * @param {string} params.options
   */
  async create(params = {}) {
    const { payload, options } = await validateAsync(Joi.object({
      payload: createSchema.required(),
      options: Joi.object().default({}),
    }).required(), params);
    const doc = await this.insertOne({
      doc: payload,
      options,
    });
    const signed = TokenRepo.signDocument(doc);
    return { doc, signed };
  }

  /**
   * Invalidates/deletes a token by ID.
   *
   * @param {object} params
   * @param {string} params.id
   */
  async invalidate(params = {}) {
    const { id, options } = await validateAsync(Joi.object({
      id: fields.id.required(),
      options: Joi.object().default({}),
    }).required(), params);
    const query = { _id: id };
    return super.deleteOne({ query, options });
  }

  /**
   * Verifies a signed token string.
   *
   * @param {object} params
   * @param {string} params.token
   * @param {string} params.subject
   */
  async verify(params = {}) {
    const { token, subject } = await validateAsync(Joi.object({
      token: Joi.string().trim().required(),
      subject: fields.subject.required(),
    }).required(), params);

    const { createError } = Repo;
    try {
      // Verify the token signature.
      const verified = jwt.verify(token, TOKEN_SECRET, { algorithms: ['HS256'] });
      // Ensure the token exists in the db and matches the subject.
      const { jti } = verified;
      const doc = await super.findByObjectId({ id: jti, options: { strict: true } });
      if (subject !== doc.subject) throw createError(409, 'The token subject does not match.');
      return { doc, signed: token };
    } catch (e) {
      switch (e.message) {
        case 'invalid signature':
          throw createError(401, 'The token signature is invalid.');
        case 'jwt expired':
          throw createError(401, 'The provided token has expired.');
        case 'jwt malformed':
          throw createError(422, 'The provided value is not a valid token.');
        default:
          throw e;
      }
    }
  }

  /**
   * @param {object} params
   * @param {string|ObjectId} params.userId
   */
  async getOrCreateAuthToken(params = {}) {
    const { userId } = await validateAsync(Joi.object({
      userId: Joi.mongoId().required(),
    }).required(), params);
    const query = { subject: 'auth', audience: userId };
    const doc = await super.findOne({ query });
    if (doc) return { doc, signed: TokenRepo.signDocument(doc) };
    const payload = { ...query };
    return this.create({ payload });
  }

  /**
   * Converts a MongoDB token doc to a JWT payload.
   *
   * @param {object} doc
   */
  static toJWT(doc) {
    const { expiresAt } = doc;
    const exp = expiresAt ? dateToUnix(expiresAt) : undefined;
    return {
      jti: doc._id,
      sub: doc.subject,
      iss: doc.issuer,
      aud: doc.audience,
      iat: dateToUnix(doc.issuedAt),
      ...(exp && { exp }),
      data: doc.data,
    };
  }

  /**
   * Signs a MongoDB token document.
   *
   * @param {object} doc
   */
  static signDocument(doc) {
    const payload = TokenRepo.toJWT(doc);
    return TokenRepo.sign(payload);
  }

  /**
   * Signs a JWT payload.
   *
   * @param {object} payload
   */
  static sign(payload) {
    return jwt.sign(payload, TOKEN_SECRET);
  }
}

module.exports = TokenRepo;
