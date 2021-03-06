module.exports = {
  accomodations: [
    { 'wedding._id': 1 },

    [{ name: 1, _id: 1 }, { collation: { locale: 'en_US' } }],
  ],
  places: [
    { updatedAt: 1, _id: 1 },
  ],
  events: [
    { 'wedding._id': 1 },

    [{ name: 1, _id: 1 }, { collation: { locale: 'en_US' } }],
    { startsAt: 1, _id: 1 },
  ],
  tokens: [
    { audience: 1, subject: 1 },
    [{ expiresAt: 1 }, { expireAfterSeconds: 0 }],
  ],
  'user-events': [
    { 'user._id': 1, action: 1 },
  ],
  users: [
    [{ email: 1 }, { unique: true, collation: { locale: 'en_US' } }],

    { updatedAt: 1, _id: 1 },
  ],
  'wedding-managers': [
    [{ 'user._id': 1, 'wedding._id': 1 }, { unique: true }],
    { 'wedding._id': 1 },

    [{ 'wedding.title': 1, _id: 1 }, { collation: { locale: 'en_US' } }],
    { 'wedding.updatedAt': 1, _id: 1 },
    [{ 'user.email': 1, _id: 1 }, { collation: { locale: 'en_US' } }],
    { 'invite.sentAt': 1, _id: 1 },
  ],
  weddings: [
    [{ slug: 1 }, { unique: true, collation: { locale: 'en_US' } }],

    [{ title: 1, _id: 1 }, { collation: { locale: 'en_US' } }],
    { updatedAt: 1, _id: 1 },
  ],
};
