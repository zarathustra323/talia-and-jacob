const { Client } = require('@googlemaps/google-maps-services-js');
const { GOOGLE_MAPS_API_KEY } = require('./env');

const client = new Client({});

module.exports = {
  placeDetails: ({ params, ...rest } = {}) => client.placeDetails({
    params: { ...params, key: GOOGLE_MAPS_API_KEY },
    ...rest,
  }),
};
