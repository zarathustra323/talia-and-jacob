const express = require('express');
const helmet = require('helmet');
const http = require('http');
const graphql = require('./graphql/server');

const app = express();
app.set('trust proxy', ['loopback', 'linklocal', 'uniquelocal']);
app.use(helmet({ contentSecurityPolicy: false }));

const graphqlPath = '/graphql';

app.get('/', (req, res) => {
  res.redirect(301, graphqlPath);
});

graphql({ app, path: graphqlPath });

module.exports = http.createServer(app);
