const Joi = require('@parameter1/joi');
const { mongoId } = require('@parameter1/joi/types');
const { ObjectId } = require('@parameter1/mongodb');

module.exports = Joi.extend(mongoId(ObjectId));
