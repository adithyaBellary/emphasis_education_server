import { ApolloServer } from 'apollo-server';
import express from 'express';
import * as dotenv from 'dotenv';
import * as Sentry from "@sentry/browser";
import { Integrations } from "@sentry/tracing";
// import { ApolloServer } from 'apollo-server-express';
dotenv.config();

import typeDefs from './schema';
import resolvers from './resolvers';
import dataSrc from './datasource';


const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    f: new dataSrc()
  })
});

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  release: "emphasis-education-server@" + process.env.npm_package_version, // To set your release version
  integrations: [new Integrations.BrowserTracing()],
  tracesSampleRate: 1.0, // We recommend adjusting this in production
});

// const app = express();
// server.applyMiddleware({ app });
// app.use('/', (req, res) => 'hi')
// app.listen({port: process.env.PORT || 4000}, () => console.log(`server on ${server.graphqlPath}`))

server.listen(process.env.PORT).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
