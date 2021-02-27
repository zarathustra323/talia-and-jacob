const Joi = require('../../joi');

module.exports = {
  id: Joi.mongoId(),
  subject: Joi.string().trim(),
  audience: Joi.mongoId(),
  issuer: Joi.string().trim(),
  issuedAt: Joi.date().default(() => new Date()),
  ttl: Joi.number().min(0).default(0),
  data: Joi.object(),
};
