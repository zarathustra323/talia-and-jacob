const { GraphQLScalarType } = require('graphql');
const { Kind } = require('graphql/language');
const dayjs = require('../../dayjs');

const createError = (value) => new TypeError(`The provided value "${value}" is not a valid date.`);

const createDate = (value) => {
  const date = new Date(value);
  if (!date || !date.getTime()) throw createError(value);
  return date;
};

const validateDayJS = (d) => {
  if (!d.isValid()) throw new TypeError(`The provided date value "${d}" is invalid.`);
  return true;
};

const createDayJSFromDate = (date) => {
  const d = dayjs()
    .year(date.getFullYear())
    .month(date.getMonth())
    .date(date.getDate())
    .startOf('day');
  validateDayJS(d);
  return d;
};

const parseDate = (value) => {
  if (value instanceof Date) return createDayJSFromDate(value);

  if (!value || (typeof value !== 'number' && typeof value !== 'string')) {
    throw createError(value);
  }
  // when a number is provided, assume timestamp and attempt to create the date
  if (typeof value === 'number') return createDayJSFromDate(createDate(value));

  // first try to parse the string as a timestamp.
  // the value must be all numbers.
  if (/^\d+$/.test(value)) {
    const timestamp = parseInt(value, 10);
    if (timestamp) return createDayJSFromDate(createDate(timestamp));
  }

  // finally, attempt the parse as a date string.
  const date = dayjs(value, 'YYYY-MM-DD').toDate();
  return createDayJSFromDate(date);
};

module.exports = new GraphQLScalarType({
  name: 'Day',
  description: 'Date custom scalar type formatted as YYYY-MM-DD.',
  parseValue(value) {
    return parseDate(value);
  },
  serialize(value) {
    try {
      return parseDate(value).format('YYYY-MM-DD');
    } catch (e) {
      return null;
    }
  },
  parseLiteral(ast) {
    const value = ast.kind === Kind.INT ? parseInt(ast.value, 10) : ast.value;
    return parseDate(value);
  },
});
