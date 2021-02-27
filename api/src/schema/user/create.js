const Joi = require('../../joi');
const fields = require('./fields');

module.exports = Joi.object({
  email: fields.email.required(),
  givenName: fields.givenName.required(),
  familyName: fields.familyName.required(),
}).required();
