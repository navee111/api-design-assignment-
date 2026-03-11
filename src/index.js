require("dotenv").config();
const express = require("express");
const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@apollo/server/express4");
const cors = require("cors");

const typeDefs = require("./schema");
const resolvers = require("./resolvers");

async function startServer() {
  
  const app = express();

  // 1️⃣ Middleware före Apollo
  app.use(cors());
  app.use(express.json());

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });


  await server.start();

  // 2️⃣ Apollo middleware på slutet
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }),
  );


  const PORT = process.env.PORT || 4000;

  app.listen(PORT, () => {
    console.log(`🚀 Server ready at port ${PORT}`);
  });
}

startServer().catch((err) => console.error(err));
