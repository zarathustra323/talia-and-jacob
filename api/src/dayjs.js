const dayjs = require('dayjs');
const customParseFormat = require('dayjs/plugin/customParseFormat');
const timezone = require('dayjs/plugin/timezone');
const utc = require('dayjs/plugin/utc');

module.exports = dayjs
  .extend(customParseFormat)
  .extend(utc)
  .extend(timezone);
