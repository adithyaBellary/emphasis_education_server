import { ApolloServer } from 'apollo-server';

import typeDefs from './schema';
import resolvers from './resolvers';
// import firebaseSvc from './firebaseSvc';
import dataSrc from './datasource';


const server = new ApolloServer({
  typeDefs,
  resolvers,
  dataSources: () => ({
    f: new dataSrc()
  })
});

// 'http://10.0.2.2:8081'

server.listen(process.env.PORT || 4000).then(({ url }) => {
  console.log(`🚀 Server ready at ${url}`);
});
