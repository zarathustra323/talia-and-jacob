const Joi = require('../../joi');

module.exports = {
  ip: Joi.string().allow('', null),
  ua: Joi.string().allow('', null),
};
