const Joi = require('../../joi');
const userFields = require('../user/fields');
const weddingFields = require('../wedding/fields');

module.exports = {
  id: Joi.mongoId(),
  weddingId: weddingFields.id,
  userId: userFields.id,
  role: Joi.string().trim().valid('Owner', 'Member', 'Restricted'),
  status: Joi.string().trim().valid('Active', 'Invited'),
};
