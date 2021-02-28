const Joi = require('../../joi');
const { day } = require('../fields');

module.exports = {
  id: Joi.mongoId(),
  description: Joi.string().trim(),
  roomBlock: Joi.object({
    checkIn: day,
    checkOut: day,
    code: Joi.string().trim(),
    rate: Joi.number().min(0),
  }),
};
