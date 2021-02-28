const { typeProjection } = require('@parameter1/graphql-directive-project/utils');

module.exports = {
  /**
   *
   */
  EventSortFieldEnum: {
    ID: '_id',
    NAME: 'name',
    STARTS_AT: 'startsAt',
  },

  /**
   *
   */
  Event: {
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
    async createEvent(_, { input }, { repos, auth }) {
      const {
        weddingId,
        placeId,
        name,
        description,
        startsAt,
        endsAt,
        inviteByDefault,
      } = input;
      await auth.checkCan('event:create', { weddingId });
      return repos.event.create({
        weddingId,
        placeId,
        name,
        description,
        startsAt,
        endsAt,
        inviteByDefault,
      });
    },
  },
};
