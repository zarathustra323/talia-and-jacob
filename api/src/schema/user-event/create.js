const Joi = require('../../joi');
const fields = require('./fields');
const userFields = require('../user/fields');

const actions = ['magic-login', 'send-login-link', 'logout'];

module.exports = Joi.object({
  userId: userFields.id.required(),
  action: Joi.string().trim().valid(...actions).required(),
  date: Joi.date().default(() => new Date()),
  ip: fields.ip,
  ua: fields.ua,
  data: Joi.object(),
}).required();
