const { validateAsync } = require('@parameter1/joi/utils');
const { isFunction: isFn } = require('@parameter1/utils');
const Joi = require('../joi');
const PaginableRepo = require('./-paginable');
const UserRepo = require('./user');
const WeddingRepo = require('./wedding');
const fields = require('../schema/wedding-user/fields');
const userFields = require('../schema/user/fields');
const userEventFields = require('../schema/user-event/fields');

class WeddingUserRepo extends PaginableRepo {
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
      name: 'wedding-user',
      collectionName: 'wedding-users',
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

    let member;
    await session.withTransaction(async () => {
      const mem = await this.findByObjectId({
        id,
        options: { strict: true, projection: { 'user._id': 1, 'org.name': 1, status: 1 }, session },
      });
      if (mem.status !== 'Invited') throw PaginableRepo.createError(400, `This user is already a member of the ${mem.org.name} organization.`);
      const now = new Date();
      // update the invite
      await this.updateOne({
        query: { _id: id },
        update: {
          $set: { status: 'Active', updatedAt: now, 'invite.acceptedAt': now },
        },
        options: { session },
      });
      member = await this.findByObjectId({ id, options: { ...options, session } });
    });
    session.endSession();
    return member;
  }

  /**
   * @param {object} params
   * @param {string|ObjectId} params.orgId
   * @param {string|ObjectId} params.userId
   * @param {string[]} [params.roles]
   * @param {object} [params.options]
   */
  async checkRole(params = {}) {
    const {
      orgId,
      userId,
      roles,
      options,
    } = await validateAsync(Joi.object({
      orgId: fields.orgId.required(),
      userId: fields.userId.required(),
      roles: Joi.array().items(fields.role).default([]),
      options: Joi.object().default({}),
    }).required(), params);

    const member = await this.findOneFor({
      orgId,
      userId,
      options: { ...options, projection: { role: 1 } },
    });
    if (!member) return false;
    if (!roles.length) return true; // when no roles specified, allow
    return roles.includes(member.role);
  }

  /**
   * @param {object} params
   * @param {object} params.weddingId The wedding to become a user of.
   * @param {string|ObjectId} params.userId The user id.
   * @param {string} params.role The wedding user role.
   * @param {string} params.status The wedding user status.
   * @param {string|ObjectId} [params.invitedById] The user ID who invited the user.
   * @param {Date} [params.inviteDate] The date the user was invited.
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
        options: { strict: true, projection: { email: 1, name: 1 }, session },
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
   * @param {string|ObjectId} params.orgId
   * @param {string} params.email
   * @param {string} params.role
   * @param {string|ObjectId} params.invitedById
   * @param {string} [ip]
   * @param {string} [ua]
   * @param {function} [inTransaction]
   */
  async createInvite(params = {}) {
    const {
      orgId,
      email,
      role,
      invitedById,
      ip,
      ua,
      inTransaction,
    } = await validateAsync(Joi.object({
      orgId: fields.orgId.required(),
      email: userFields.email.required(),
      role: fields.role.required(),
      invitedById: userFields.id.required(),
      ip: userEventFields.ip,
      ua: userEventFields.ua,
      inTransaction: Joi.function(),
    }).required(), params);

    const session = await this.client.startSession();

    let member;
    let loginToken;
    await session.withTransaction(async () => {
      const user = await this.userRepo.upsertOne({
        payload: { email },
        findOptions: { session, projection: { _id: 1, email: 1 } },
        updateOptions: { session },
      });

      const invitedDate = new Date();
      member = await this.create({
        orgId,
        userId: user._id,
        role,
        status: 'Invited',
        invitedById,
        invitedDate,
        options: { session },
      });
      // ensure the member is successfully created before creating the token.
      loginToken = await this.userRepo.createOrgMemberInviteToken({
        email: user.email,
        ip,
        ua,
        options: { session },
      });
      if (isFn(inTransaction)) await inTransaction({ member, loginToken, session });
    });
    session.endSession();
    return { member, loginToken };
  }

  /**
   *
   * @param {object} params
   * @param {string|ObjectId} params.orgId
   * @param {string|ObjectId} params.userId
   * @param {string} [params.status=Active]
   * @param {object} params.options
   */
  async findOneFor(params = {}) {
    const {
      orgId,
      userId,
      status,
      options,
    } = await validateAsync(Joi.object({
      orgId: fields.orgId.required(),
      userId: fields.userId.required(),
      status: fields.status.default('Active'),
      options: Joi.object().default({}),
    }).required(), params);

    const query = {
      'user._id': userId,
      'org._id': orgId,
      status,
    };
    return this.findOne({ query, options });
  }

  /**
   *
   * @param {object} params
   * @param {ObjectID} params.orgId
   * @param {string[]} [params.status]
   * @param {object} [params.options]
   */
  async paginateForOrg(params = {}) {
    const { orgId, status, options } = await validateAsync(Joi.object({
      orgId: fields.orgId.required(),
      status: Joi.array().items(fields.status).default([]),
      options: Joi.object().default({}),
    }).required(), params);
    const query = {
      'org._id': orgId,
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
   * @param {object} [parans.object]
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

    let member;
    let loginToken;
    await session.withTransaction(async () => {
      const [mem, invitedBy] = await Promise.all([
        this.findByObjectId({
          id,
          options: { session, strict: true, projection: { user: 1, status: 1 } },
        }),
        this.userRepo.findByObjectId({
          id: invitedById, options: { session, strict: true, projection: { email: 1, name: 1 } },
        }),
      ]);
      if (mem.status !== 'Invited') throw PaginableRepo.createError(400, 'This member cannot be reinvited.');
      // update the member invite details.
      const now = new Date();
      await this.updateOne({
        query: { _id: id },
        update: {
          $set: { updatedAt: now, 'invite.sentBy': invitedBy, 'invite.sentAt': now },
        },
      });
      // create token
      loginToken = await this.userRepo.createOrgMemberInviteToken({
        email: mem.user.email,
        ip,
        ua,
        options: { session },
      });
      member = await this.findByObjectId({ id, options });
      if (isFn(inTransaction)) await inTransaction({ member, loginToken, session });
    });
    session.endSession();
    return { member, loginToken };
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

module.exports = WeddingUserRepo;
