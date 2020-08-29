import { ApolloServer } from 'apollo-server';
import express from 'express';
import * as dotenv from 'dotenv';
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

// const app = express();
// server.applyMiddleware({ app });
// app.use('/', (req, res) => 'hi')
// app.listen({port: process.env.PORT || 4000}, () => console.log(`server on ${server.graphqlPath}`))

server.listen(process.env.PORT).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
