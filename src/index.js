
const { ApolloServer } = require('@apollo/server');
const { startStandaloneServer } = require('@apollo/server/standalone');
const { ApolloServerPluginLandingPageLocalDefault } = require('@apollo/server/plugin/landingPage/default');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

/**
 * Bootstraps and starts the Apollo GraphQL server.
 *
 * @returns {Promise<void>} Resolves when the server has started.
 */
async function startServer() {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: true,
    formatError: (formattedError) => ({
      error: formattedError.message,
      message: formattedError.message,
      code: formattedError.extensions?.code || "INTERNAL_SERVER_ERROR",
      status: formattedError.extensions?.http?.status || 500,
    }),
    plugins: [
      ApolloServerPluginLandingPageLocalDefault({
        embed: true,
        includeCookies: true,
      }),
    ],
  });
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => ({ req }),
    listen: { port: process.env.PORT || 4000 },
  });
  console.log(`🚀 Server ready at ${url}`);
}

startServer().catch(console.error);
