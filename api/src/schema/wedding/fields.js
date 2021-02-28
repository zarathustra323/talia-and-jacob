const Joi = require('../../joi');
const {
  slug,
  day,
  createdAt,
  updatedAt,
} = require('../fields');

module.exports = {
  id: Joi.mongoId(),
  title: Joi.string().trim(),
  day,
  slug,
  createdAt,
  updatedAt,
};
