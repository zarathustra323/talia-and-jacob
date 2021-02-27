const { dateToUnix } = require('@parameter1/utils');
const Joi = require('../../joi');
const fields = require('./fields');

module.exports = Joi.object({
  subject: fields.subject.required(),
  audience: fields.audience.required(),
  issuer: fields.issuer,
  issuedAt: fields.issuedAt,
  ttl: fields.ttl,
  data: fields.data,
}).required().external((obj) => {
  const { ttl, issuedAt } = obj;
  let expiresAt;
  if (ttl) expiresAt = new Date((dateToUnix(issuedAt) + ttl) * 1000);
  return { ...obj, expiresAt };
});
