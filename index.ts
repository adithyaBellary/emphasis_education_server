import { ApolloServer } from 'apollo-server';
import express from 'express';
import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { Integrations } from "@sentry/tracing";
// import { ApolloServer } from 'apollo-server-express';
// import http from 'http';

dotenv.config();

import typeDefs from './schema';
import resolvers from './resolvers';
import dataSrc from './datasource';

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: (connectionParams, webSocket) => {
      console.log('connectionParams', connectionParams)
      console.log('webSocket', !!webSocket)
      return true
    },
    onDisconnect: (websocket, context) => {
      console.log('the subscription has disconnected', !!websocket)
    },
    path: 'ws://emphasis-education-server.herokuapp.com/graphql',
    keepAlive: 1000
  },
  dataSources: () => ({
    f: new dataSrc()
  })
});

// const app = express();
// server.applyMiddleware({ app });

// const httpServer = http.createServer(app);
// app.use('/', (req, res) => 'hi')
// app.listen({port: process.env.PORT || 4000}, () => console.log(`server on ${server.graphqlPath}`))

// httpServer.listen(process.env.PORT, () => {
//   console.log(`🚀 Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`)
//   console.log(`🚀 Subscriptions ready at ws://localhost:${process.env.PORT}${server.subscriptionsPath}`)
// })

server.listen(process.env.PORT).then(({ url, subscriptionsUrl }) => {
  console.log('the port is', process.env.PORT)
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🚀 Sub Server ready at ${subscriptionsUrl}`);
});
