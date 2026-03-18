
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function startServer() {
  const server = new ApolloServer({ typeDefs, resolvers, introspection: true,
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: true,
      }),
    ]
  });
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => ({ req }),
    listen: { port: process.env.PORT || 4000 }
  });
  console.log(`🚀 Server ready at ${url}`);
}

startServer().catch(console.error);
