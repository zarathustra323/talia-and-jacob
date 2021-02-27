const Joi = require('@parameter1/joi');
const { validateAsync } = require('@parameter1/joi/utils');
const sgMail = require('@sendgrid/mail');
const { SENDGRID_API_KEY } = require('./env');

sgMail.setApiKey(SENDGRID_API_KEY);

/**
 * @param {object} params
 * @param {string} params.to
 * @param {string} params.from
 * @param {string} params.subject
 * @param {string} params.html
 * @param {string} params.text
 */
module.exports = async (params = {}) => {
  const {
    to,
    from,
    subject,
    html,
    text,
  } = await validateAsync(Joi.object({
    to: Joi.string().trim().required(),
    from: Joi.string().trim().required(),
    subject: Joi.string().trim().required(),
    html: Joi.string().trim().required(),
    text: Joi.string().trim().required(),
  }).required(), params);

  try {
    const r = await sgMail.send({
      to,
      from,
      subject,
      html,
      text,
    });
    return r;
  } catch (e) {
    throw new Error(`Unable to send email: ${e.message}`);
  }
};
