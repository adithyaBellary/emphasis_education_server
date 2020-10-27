import { ApolloServer } from 'apollo-server';
import express from 'express';
import * as dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { Integrations } from "@sentry/tracing";
// import { ApolloServer } from 'apollo-server-express';
dotenv.config();

import typeDefs from './schema';
import resolvers from './resolvers';
import dataSrc from './datasource';


const server = new ApolloServer({
  typeDefs,
  resolvers,
  subscriptions: {
    onConnect: (connectionParams, webSocket) => {
      console.log('connectionParams', connectionParams)
      console.log('webSocket', !!webSocket)
      return true
    }
  },
  dataSources: () => ({
    f: new dataSrc()
  })
});

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

// const app = express();
// server.applyMiddleware({ app });
// app.use('/', (req, res) => 'hi')
// app.listen({port: process.env.PORT || 4000}, () => console.log(`server on ${server.graphqlPath}`))

server.listen(process.env.PORT).then(({ url, subscriptionsUrl }) => {
  console.log('the port is', process.env.PORT)
  console.log(`🚀 Server ready at ${url}`);
  console.log(`🚀 Sub Server ready at ${subscriptionsUrl}`);
});
