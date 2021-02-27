const { clean, burners } = require('@parameter1/email-utils');
const Joi = require('../../joi');

module.exports = {
  id: Joi.mongoId(),
  givenName: Joi.string().trim(),
  familyName: Joi.string().trim(),
  email: Joi.string().email().trim()
    .custom((email) => {
      const cleaned = clean(email);
      if (burners.isBurnerEmail(cleaned)) throw new Error('The provided email address is not allowed');
      return cleaned;
    }),
};
