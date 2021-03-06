const { validateAsync } = require('@parameter1/joi/utils');
const { isFunction: isFn } = require('@parameter1/utils');
const Joi = require('../joi');
const PaginableRepo = require('./-paginable');
const UserRepo = require('./user');
const WeddingRepo = require('./wedding');
const fields = require('../schema/wedding-manager/fields');
const userFields = require('../schema/user/fields');
const userEventFields = require('../schema/user-event/fields');

class WeddingManagerRepo extends PaginableRepo {
  /**
   *
   */
  constructor({
    client,
    dbName,
    userRepo,
    weddingRepo,
  } = {}) {
    super({
      name: 'wedding-manager',
      collectionName: 'wedding-managers',
      dbName,
      client,
      collatableFields: ['wedding.title', 'user.email'],
    });
    if (!(userRepo instanceof UserRepo)) throw new Error('The `userRepo` must be an instance of UserRepo');
    if (!(weddingRepo instanceof WeddingRepo)) throw new Error('The `weddingRepo` must be an instance of WeddingRepo');
    this.userRepo = userRepo;
    this.weddingRepo = weddingRepo;
  }

  /**
   *
   * @param {object} params
   * @param {string|ObjectId} params.id
   * @param {object} [params.options]
   */
  async acceptInvite(params = {}) {
    const { id, options } = await validateAsync(Joi.object({
      id: fields.id.required(),
      options: Joi.object().default({}),
    }).required(), params);
    const session = await this.client.startSession();

    let manager;
    await session.withTransaction(async () => {
      const man = await this.findByObjectId({
        id,
        options: { strict: true, projection: { 'user._id': 1, 'wedding.title': 1, status: 1 }, session },
      });
      if (man.status !== 'Invited') throw PaginableRepo.createError(400, `This user is already a manager of "${man.wedding.title}"`);
      const now = new Date();
      // update the invite
      await this.updateOne({
        query: { _id: id },
        update: {
          $set: { status: 'Active', updatedAt: now, 'invite.acceptedAt': now },
        },
        options: { session },
      });
      manager = await this.findByObjectId({ id, options: { ...options, session } });
    });
    session.endSession();
    return manager;
  }

  /**
   * @param {object} params
   * @param {string|ObjectId} params.weddingId
   * @param {string|ObjectId} params.userId
   * @param {string[]} [params.roles]
   * @param {object} [params.options]
   */
  async checkRole(params = {}) {
    const {
      weddingId,
      userId,
      roles,
      options,
    } = await validateAsync(Joi.object({
      weddingId: fields.weddingId.required(),
      userId: fields.userId.required(),
      roles: Joi.array().items(fields.role).default([]),
      options: Joi.object().default({}),
    }).required(), params);

    const manager = await this.findOneFor({
      weddingId,
      userId,
      options: { ...options, projection: { role: 1 } },
    });
    if (!manager) return false;
    if (!roles.length) return true; // when no roles specified, allow
    return roles.includes(manager.role);
  }

  /**
   * @param {object} params
   * @param {object} params.weddingId The wedding to become a manager of.
   * @param {string|ObjectId} params.userId The user id.
   * @param {string} params.role The wedding manager role.
   * @param {string} params.status The wedding manager status.
   * @param {string|ObjectId} [params.invitedById] The user ID who invited the user.
   * @param {Date} [params.inviteDate] The date the user was invited to be a manager.
   * @param {object} [params.options]
   */
  async create(params = {}) {
    const {
      weddingId,
      userId,
      role,
      status,
      invitedById,
      invitedDate,
      options,
    } = await validateAsync(Joi.object({
      weddingId: fields.weddingId.required(),
      userId: fields.userId.required(),
      role: fields.role.required(),
      status: fields.status.default('Active'),
      invitedById: userFields.id,
      invitedDate: Joi.date(),
      options: Joi.object().default({}),
    }).required(), params);
    const { session } = options;

    const findOps = [
      this.weddingRepo.findByObjectId({
        id: weddingId,
        options: {
          strict: true,
          projection: {
            slug: 1,
            title: 1,
            updatedAt: 1,
            createdAt: 1,
          },
          session,
        },
      }),
      this.userRepo.findByObjectId({
        id: userId,
        options: { strict: true, projection: { email: 1 }, session },
      }),
    ];
    if (invitedById) {
      findOps.push(this.userRepo.findByObjectId({
        id: invitedById,
        options: { strict: true, projection: { email: 1, givenName: 1, familyName: 1 }, session },
      }));
    }

    const [wedding, user, invitedBy] = await Promise.all(findOps);
    const doc = {
      wedding,
      user,
      role,
      status,
      ...(invitedById && { invite: { sentBy: invitedBy, sentAt: invitedDate || new Date() } }),
    };
    return this.insertOne({ doc, options: { ...options, withDates: true } });
  }

  /**
   *
   * @param {object} params
   * @param {string|ObjectId} params.weddingId
   * @param {string} params.email
   * @param {string} params.role
   * @param {string|ObjectId} params.invitedById
   * @param {string} [ip]
   * @param {string} [ua]
   * @param {function} [inTransaction]
   */
  async createInvite(params = {}) {
    const {
      weddingId,
      email,
      role,
      invitedById,
      ip,
      ua,
      inTransaction,
    } = await validateAsync(Joi.object({
      weddingId: fields.weddingId.required(),
      email: userFields.email.required(),
      role: fields.role.required(),
      invitedById: userFields.id.required(),
      ip: userEventFields.ip,
      ua: userEventFields.ua,
      inTransaction: Joi.function(),
    }).required(), params);

    const session = await this.client.startSession();

    let manager;
    let loginToken;
    await session.withTransaction(async () => {
      const user = await this.userRepo.upsertOne({
        payload: { email },
        findOptions: { session, projection: { _id: 1, email: 1 } },
        updateOptions: { session },
      });

      const invitedDate = new Date();
      manager = await this.create({
        weddingId,
        userId: user._id,
        role,
        status: 'Invited',
        invitedById,
        invitedDate,
        options: { session },
      });
      // ensure the manager is successfully created before creating the token.
      loginToken = await this.userRepo.createWeddingManagerInviteToken({
        email: user.email,
        ip,
        ua,
        options: { session },
      });
      if (isFn(inTransaction)) await inTransaction({ manager, loginToken, session });
    });
    session.endSession();
    return { manager, loginToken };
  }

  /**
   *
   * @param {object} params
   * @param {string|ObjectId} params.weddingId
   * @param {string|ObjectId} params.userId
   * @param {string} [params.status=Active]
   * @param {object} params.options
   */
  async findOneFor(params = {}) {
    const {
      weddingId,
      userId,
      status,
      options,
    } = await validateAsync(Joi.object({
      weddingId: fields.weddingId.required(),
      userId: fields.userId.required(),
      status: fields.status.default('Active'),
      options: Joi.object().default({}),
    }).required(), params);

    const query = {
      'user._id': userId,
      'wedding._id': weddingId,
      status,
    };
    return this.findOne({ query, options });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectID} params.weddingId
   * @param {string[]} [params.status]
   * @param {object} [params.options]
   */
  async paginateForWedding(params = {}) {
    const { weddingId, status, options } = await validateAsync(Joi.object({
      weddingId: fields.weddingId.required(),
      status: Joi.array().items(fields.status).default([]),
      options: Joi.object().default({}),
    }).required(), params);
    const query = {
      'wedding._id': weddingId,
      ...(status.length && { status: { $in: status } }),
    };
    return this.paginate({ ...options, query });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectID} params.userId
   * @param {string[]} [params.status]
   * @param {object} [params.options]
   */
  async paginateForUser(params = {}) {
    const { userId, status, options } = await validateAsync(Joi.object({
      userId: fields.userId.required(),
      status: Joi.array().items(fields.status).default([]),
      options: Joi.object().default({}),
    }).required(), params);
    const query = {
      'user._id': userId,
      ...(status.length && { status: { $in: status } }),
    };
    return this.paginate({ ...options, query });
  }

  /**
   *
   * @param {object} params
   * @param {string|ObjectId} params.id
   * @param {object} [params.options]
   */
  async rejectInvite(params = {}) {
    const { id, options } = await validateAsync(Joi.object({
      id: fields.id.required(),
      options: Joi.object().default({}),
    }).required(), params);

    await this.deleteOne({
      query: { _id: id, status: 'Invited' },
      options: { ...options, strict: true },
    });
    return 'ok';
  }

  /**
   * @param {object} params
   * @param {object} params.payload
   * @param {string|ObjectId} params.userId
   * @param {string} params.role
   */
  async registerNewWedding(params = {}) {
    const {
      payload,
      userId,
      role,
    } = await validateAsync(Joi.object({
      payload: Joi.object().required(),
      userId: fields.userId.required(),
      role: fields.role.required(),
    }).required(), params);

    const session = await this.client.startSession();

    let wedding;
    let weddingUser;
    await session.withTransaction(async () => {
      wedding = await this.weddingRepo.create({ payload, options: { session } });
      weddingUser = await this.create({
        weddingId: wedding._id,
        userId,
        role,
        options: { session },
      });
    });
    session.endSession();
    return { wedding, weddingUser };
  }

  /**
   *
   * @param {object} params
   * @param {string|ObjectId} params.id
   * @param {string} params.invitedById
   * @param {string} [params.ip]
   * @param {string} [params.ua]
   * @param {object} [params.options]
   */
  async resendInvite(params = {}) {
    const {
      id,
      invitedById,
      ip,
      ua,
      options,
      inTransaction,
    } = await validateAsync(Joi.object({
      id: fields.id.required(),
      invitedById: userFields.id.required(),
      ip: userEventFields.ip,
      ua: userEventFields.ua,
      options: Joi.object().default({}),
      inTransaction: Joi.function(),
    }).required(), params);

    const session = await this.client.startSession();

    let manager;
    let loginToken;
    await session.withTransaction(async () => {
      const [man, invitedBy] = await Promise.all([
        this.findByObjectId({
          id,
          options: { session, strict: true, projection: { user: 1, status: 1 } },
        }),
        this.userRepo.findByObjectId({
          id: invitedById,
          options: {
            session,
            strict: true,
            projection: { email: 1, givenName: 1, familyName: 1 },
          },
        }),
      ]);
      if (man.status !== 'Invited') throw PaginableRepo.createError(400, 'This manager cannot be reinvited.');
      // update the manager invite details.
      const now = new Date();
      await this.updateOne({
        query: { _id: id },
        update: {
          $set: { updatedAt: now, 'invite.sentBy': invitedBy, 'invite.sentAt': now },
        },
      });
      // create token
      loginToken = await this.userRepo.createWeddingManagerInviteToken({
        email: man.user.email,
        ip,
        ua,
        options: { session },
      });
      manager = await this.findByObjectId({ id, options });
      if (isFn(inTransaction)) await inTransaction({ manager, loginToken, session });
    });
    session.endSession();
    return { manager, loginToken };
  }

  /**
   *
   * @param {object} params
   * @param {string|ObjectId} params.id
   * @param {string} params.role
   * @param {object} [params.options]
   */
  async setRole(params = {}) {
    const { id, role, options } = await validateAsync(Joi.object({
      id: fields.id.required(),
      role: fields.role.required(),
      options: Joi.object().default({}),
    }).required(), params);

    await this.updateOne({
      query: { _id: id },
      update: { $set: { role, updatedAt: new Date() } },
      options: { strict: true },
    });
    return this.findByObjectId({ id, options });
  }
}

module.exports = WeddingManagerRepo;
