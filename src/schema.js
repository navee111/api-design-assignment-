const typeDefs = `#graphql
  type User {
    id: ID!
    email: String!
    name: String
    createdAt: String!
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type Game {
    id: ID!
    rank: Int
    name: String!
    platform: String
    year: Int
    genre: String
    publisher: String
    naSales: Float
    euSales: Float
    jpSales: Float
    otherSales: Float
    globalSales: Float
    createdAt: String!
    updatedAt: String!
  }

  type Publisher {
    name: String!
    totalGames: Int!
    totalSales: Float!
    games: [Game!]!
  }

  type Genre {
    name: String!
    totalGames: Int!
    averageSales: Float!
    games: [Game!]!
  }

  input GameInput {
    name: String!
    platform: String
    year: Int
    genre: String
    publisher: String
    naSales: Float
    euSales: Float
    jpSales: Float
    otherSales: Float
    globalSales: Float
  }

  type Query {
    me: User
    games(
      platform: String
      genre: String
      publisher: String
      yearMin: Int
      yearMax: Int
      limit: Int
      offset: Int
    ): [Game!]!
    game(id: ID!): Game
    publishers(limit: Int): [Publisher!]!
    publisher(name: String!): Publisher
    genres: [Genre!]!
    genre(name: String!): Genre
  }

  type Mutation {
    register(email: String!, password: String!, name: String): AuthPayload!
    login(email: String!, password: String!): AuthPayload!
    createGame(input: GameInput!): Game!
    updateGame(id: ID!, input: GameInput!): Game!
    deleteGame(id: ID!): Game!
  }
`;

module.exports = typeDefs;
