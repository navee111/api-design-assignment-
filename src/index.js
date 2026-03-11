require('dotenv').config();
const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const cors = require('cors');

const typeDefs = require('./schema');
const resolvers = require('./resolvers');

async function startServer() {
  try {
    const app = express();

    // ✅ 1. Middleware före Apollo
    app.use(cors());
    app.use(express.json()); // important! body-parser ingår i express

    // ✅ 2. Apollo Server
    const server = new ApolloServer({ typeDefs, resolvers });
    await server.start();

    // ✅ 3. Apollo middleware på slutet
    app.use(
      '/graphql',
      expressMiddleware(server, { context: async ({ req }) => ({ req }) })
    );

    // ✅ 4. Lyssna på rätt port
    const PORT = process.env.PORT || 4000;
    app.listen(PORT, () => {
      console.log(`🚀 Server ready at port ${PORT}`);
    });
  } catch (err) {
    console.error('Server failed to start:', err);
  }
}

startServer();