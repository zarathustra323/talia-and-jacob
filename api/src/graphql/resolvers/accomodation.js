const { typeProjection } = require('@parameter1/graphql-directive-project/utils');

module.exports = {
  /**
   *
   */
  AccomodationSortFieldEnum: {
    ID: '_id',
    NAME: 'name',
  },

  /**
   *
   */
  Accomodation: {
    /**
     *
     */
    place({ place }, _, { loaders }, info) {
      const projection = typeProjection(info);
      const localFields = ['_id'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return place;
      return loaders.place.load({ id: place._id, projection });
    },

    /**
     *
     */
    wedding({ wedding }, _, { loaders }, info) {
      const projection = typeProjection(info);
      const localFields = ['_id'];
      const needsQuery = Object.keys(projection).some((field) => !localFields.includes(field));
      if (!needsQuery) return wedding;
      return loaders.wedding.load({ id: wedding._id, projection });
    },
  },

  /**
   *
   */
  Mutation: {
    /**
     *
     */
    async createAccomodation(_, { input }, { repos, auth }) {
      const {
        weddingId,
        placeId,
        description,
        roomBlock,
      } = input;
      await auth.checkCan('accomodation:create', { weddingId });
      return repos.accomodation.create({
        weddingId,
        placeId,
        description,
        roomBlock,
      });
    },
  },
};
