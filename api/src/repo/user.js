const { validateAsync } = require('@parameter1/joi/utils');
const { get, isFunction: isFn } = require('@parameter1/utils');
const Joi = require('../joi');
const PaginableRepo = require('./-paginable');
const TokenRepo = require('./token');
const UserEventRepo = require('./user-event');
const createSchema = require('../schema/user/create');
const fields = require('../schema/user/fields');
const userEventFields = require('../schema/user-event/fields');

class UserRepo extends PaginableRepo {
  /**
   *
   */
  constructor({
    client,
    dbName,
    tokenRepo,
    userEventRepo,
  } = {}) {
    super({
      name: 'user',
      collectionName: 'users',
      dbName,
      client,
      collatableFields: ['email'],
    });
    if (!(tokenRepo instanceof TokenRepo)) throw new Error('The `tokenRepo` must be an instance of TokenRepo');
    if (!(userEventRepo instanceof UserEventRepo)) throw new Error('The `userEventRepo` must be an instance of UserEventRepo');
    this.tokenRepo = tokenRepo;
    this.userEventRepo = userEventRepo;
  }

  /**
   * @param {object} params
   * @param {string} params.email
   * @param {string} [params.givenName]
   * @param {string} [params.familyName]
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const { payload, options } = await validateAsync(Joi.object({
      payload: createSchema.required(),
      options: Joi.object().default({}),
    }).required(), params);
    const { email, givenName, familyName } = payload;
    return this.insertOne({
      doc: {
        email,
        givenName,
        familyName,
      },
      options: { ...options, withDates: true },
    });
  }

  /**
   *
   * @param {object} params
   * @param {string} params.email
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   * @param {string} [params.ttl=3600]
   * @param {string} [params.scope]
   * @param {object} [params.options]
   */
  async createLoginLinkToken(params = {}) {
    const {
      email,
      ip,
      ua,
      ttl,
      scope,
      inTransaction,
      options,
    } = await validateAsync(Joi.object({
      email: fields.email.required(),
      ip: userEventFields.ip,
      ua: userEventFields.ua,
      ttl: Joi.number().min(0).default(3600),
      scope: Joi.string(),
      inTransaction: Joi.function(),
      options: Joi.object().default({}),
    }).required(), params);

    const session = await this.client.startSession();

    let signed;
    await session.withTransaction(async () => {
      const user = await this.findByEmail({
        email,
        options: { ...options, strict: true, projection: { email: 1 } },
      });
      const payload = {
        subject: 'login-link',
        audience: user._id,
        ttl,
        ...(scope && { data: { scope } }),
      };
      const token = await this.tokenRepo.create({ payload, options: { session } });
      signed = token.signed;
      const { doc } = signed;
      await this.userEventRepo.create({
        payload: {
          userId: user._id,
          action: 'send-login-link',
          ip,
          ua,
          data: { scope, loginToken: { doc, value: signed } },
        },
        options: { session },
      });
      if (isFn(inTransaction)) await inTransaction({ user, token });
    });
    session.endSession();
    return signed;
  }

  /**
   *
   * @param {object} params
   * @param {string} params.email
   * @param {object} [params.options]
   */
  async findByEmail(params = {}) {
    const { email, options } = await validateAsync(Joi.object({
      email: fields.email.required(),
      options: Joi.object().default({}),
    }).required(), params);
    return this.findOne({ query: { email }, options });
  }

  /**
   * @param {object} params
   * @param {string} params.authToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  async logout(params = {}) {
    const { authToken, ip, ua } = await validateAsync(Joi.object({
      authToken: Joi.string().trim().required(),
      ip: userEventFields.ip,
      ua: userEventFields.ua,
    }).required(), params);

    const { doc, signed: token } = await this.tokenRepo.verify({ token: authToken, subject: 'auth' });
    const { audience: userId } = doc;

    const event = {
      userId,
      action: 'logout',
      ip,
      ua,
      data: { authToken: { doc, value: token } },
    };

    const session = await this.client.startSession();
    await session.withTransaction(async () => {
      await Promise.all([
        this.tokenRepo.invalidate({ id: doc._id, options: { session } }),
        this.userEventRepo.create({
          payload: event,
          options: { session },
        }),
        this.updateOne({
          query: { _id: userId },
          update: { $set: { lastSeenAt: new Date() } },
          options: { session },
        }),
      ]);
    });
    session.endSession();
    return 'ok';
  }

  /**
   * @param {object} params
   * @param {string} params.loginToken
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   */
  async magicLogin(params = {}) {
    const {
      loginToken,
      ip,
      ua,
    } = await validateAsync(Joi.object({
      loginToken: Joi.string().trim().required(),
      ip: userEventFields.ip,
      ua: userEventFields.ua,
    }).required(), params);

    try {
      const { doc } = await this.tokenRepo.verify({ token: loginToken, subject: 'login-link' });
      const invalidateToken = get(doc, 'data.scope') !== 'invite';
      const user = await this.findByObjectId({
        id: doc.audience,
        options: { projection: { _id: 1 }, strict: true },
      });
      const {
        signed: authToken,
        doc: authDoc,
      } = await this.tokenRepo.getOrCreateAuthToken({ userId: user._id });
      const now = new Date();
      const $set = { verified: true, lastLoggedInAt: now, lastSeenAt: now };

      const session = await this.client.startSession();
      await session.withTransaction(async () => {
        const event = {
          userId: user._id,
          action: 'magic-login',
          date: now,
          ip,
          ua,
          data: {
            loginToken: { doc, value: loginToken },
            authToken: { doc: authDoc, value: authToken },
          },
        };
        await Promise.all([
          ...(invalidateToken ? [
            this.tokenRepo.invalidate({ id: doc._id, options: { session } }),
          ] : []),
          this.userEventRepo.create({ payload: event, options: { session } }),
          this.updateOne({
            query: { _id: user._id },
            update: { $set, $inc: { loginCount: 1 } },
            options: { session },
          }),
        ]);
      });

      session.endSession();
      return { authToken, userId: user._id };
    } catch (e) {
      e.message = `Unable to login: ${e.message}`;
      throw e;
    }
  }

  /**
   * @param {object} params
   * @param {string} params.token
   * @param {object} [params.options]
   */
  async verifyBearerAuth(params = {}) {
    const { token, options } = await validateAsync(Joi.object({
      token: Joi.string().trim().required(),
      options: Joi.object().default({}),
    }).required(), params);
    try {
      const { doc } = await this.tokenRepo.verify({ token, subject: 'auth' });
      const { audience: userId } = doc;
      await this.updateOne({
        query: { _id: userId },
        update: { $set: { lastSeenAt: new Date() } },
      });
      const user = await this.findByObjectId({
        id: userId,
        options: { ...options, strict: true },
      });
      return user;
    } catch (e) {
      throw PaginableRepo.createError(401, `Authentication failed: ${e.message}`);
    }
  }
}

module.exports = UserRepo;
