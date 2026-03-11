require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');
const bodyParser = require('body-parser');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function startServer() {

  const app = express();

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  // Starta servern
  await server.start();

  // Lägg till middleware på /graphql
  app.use(
    '/graphql',
    cors(),
    bodyParser.json(),
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }) 
    })
  );

  // Lyssna på rätt port
  const PORT = process.env.PORT || 4000;
  
  app.listen(PORT, () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});