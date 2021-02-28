module.exports = {
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
