const Joi = require('../../joi');
const { slug, createdAt, updatedAt } = require('../fields');

module.exports = {
  id: Joi.mongoId(),
  title: Joi.string().trim(),
  slug,
  createdAt,
  updatedAt,
};
