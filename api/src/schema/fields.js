const slug = require('slug');
const Joi = require('../joi');
const dayjs = require('../dayjs');

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
  day: Joi.date().external((date) => {
    if (!date) return date;
    const d = dayjs()
      .year(date.getFullYear())
      .month(date.getMonth())
      .date(date.getDate())
      .startOf('day');
    if (!d.isValid()) throw new Error(`The provided date value "${date}" is invalid.`);
    return d.toDate();
  }),
};
