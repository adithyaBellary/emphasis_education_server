import { ApolloServer } from 'apollo-server';
import express from 'express';
import { ApolloServer as ExpressApolloServer } from 'apollo-server-express';

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

const expressServer = new ExpressApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    f: new dataSrc()
  })
 })

const app = express();
expressServer.applyMiddleware({ app });
// app.use('/', (req, res) => 'hi')
app.listen({port: process.env.PORT || 4000}, () => console.log(`server on ${expressServer.graphqlPath}`))

// server.listen(process.env.PORT || 4000).then(({ url }) => {
//   console.log(`🚀 Server ready at ${url}`);
// });
