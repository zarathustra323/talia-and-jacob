const slug = require('slug');
const Joi = require('../joi');

module.exports = {
  slug: Joi.string().trim().min(2).max(50)
    .external((v) => slug(v, {
      replacement: '-',
      lower: true,
      charmap: {},
      multicharmap: {},
    })),
  createdAt: Joi.date(),
  updatedAt: Joi.date(),
};
