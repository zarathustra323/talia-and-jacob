const Joi = require('../../joi');

module.exports = {
  id: Joi.mongoId(),
  name: Joi.string().trim(),
  description: Joi.string().trim(),
  startsAt: Joi.date(),
  endsAt: Joi.date(),
  inviteByDefault: Joi.boolean(),
};
