import { ApolloServer } from 'apollo-server';
import express from 'express';
// import { ApolloServer } from 'apollo-server-express';

import typeDefs from './schema';
import resolvers from './resolvers';
import dataSrc from './datasource';

import {decode, encode} from 'base-64'

// if (!global.btoa) {  global.btoa = encode }

// if (!global.atob) { global.atob = decode }

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

server.listen(process.env.PORT || 4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
