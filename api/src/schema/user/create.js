const Joi = require('../../joi');
const fields = require('./fields');

module.exports = Joi.object({
  email: fields.email.required(),
  givenName: fields.givenName,
  familyName: fields.familyName,
}).required();
