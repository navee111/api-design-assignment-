const { PrismaClient } = require("@prisma/client");
const {
  generateToken,
  hashPassword,
  comparePassword,
  getUserFromContext,
} = require("./auth");

const prisma = new PrismaClient();

/**
 * Utility: Require authentication
 */
function requireAuth(context) {
  const userId = getUserFromContext(context);
  if (!userId) throw new Error("Not authenticated");
  return userId;
}

/**
 * Utility: Calculate global sales
 */
function calculateGlobalSales(input) {
  return (
    (input.naSales || 0) +
    (input.euSales || 0) +
    (input.jpSales || 0) +
    (input.otherSales || 0)
  );
}

/**
 * Utility: Build dynamic where filter for games
 */
function buildGameFilters(args) {
  const { platform, genre, publisher, yearMin, yearMax } = args;

  const where = {};

  if (platform) where.platform = platform;
  if (genre) where.genre = genre;

  if (publisher) {
    where.publisher = { contains: publisher, mode: "insensitive" };
  }

  if (yearMin || yearMax) {
    where.year = {};
    if (yearMin) where.year.gte = yearMin;
    if (yearMax) where.year.lte = yearMax;
  }

  return where;
}

const resolvers = {
  Query: {
    me: async (_, __, context) => {
      const userId = requireAuth(context);

      return prisma.user.findUnique({
        where: { id: userId },
      });
    },

    games: async (_, args) => {
      const { limit = 50, offset = 0 } = args;
      const where = buildGameFilters(args);

      return prisma.game.findMany({
        where,
        take: Math.min(limit, 100),
        skip: offset,
        orderBy: { globalSales: "desc" },
      });
    },

    game: async (_, { id }) => {
      const game = await prisma.game.findUnique({
        where: { id: parseInt(id) },
      });

      if (!game) throw new Error("Game not found");

      return game;
    },

    publishers: async (_, { limit = 50 }) => {
      const games = await prisma.game.findMany({
        where: { publisher: { not: null } },
      });

      const map = {};

      games.forEach((g) => {
        if (!map[g.publisher]) {
          map[g.publisher] = {
            name: g.publisher,
            totalGames: 0,
            totalSales: 0,
            games: [],
          };
        }

        map[g.publisher].totalGames++;
        map[g.publisher].totalSales += g.globalSales || 0;
        map[g.publisher].games.push(g);
      });

      return Object.values(map)
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, limit);
    },

    publisher: async (_, { name }) => {
      const games = await prisma.game.findMany({
        where: { publisher: { equals: name, mode: "insensitive" } },
      });

      if (!games.length) throw new Error("Publisher not found");

      const totalSales = games.reduce(
        (sum, g) => sum + (g.globalSales || 0),
        0,
      );

      return {
        name: games[0].publisher,
        totalGames: games.length,
        totalSales,
        games,
      };
    },

    genres: async () => {
      const games = await prisma.game.findMany({
        where: { genre: { not: null } },
      });

      const map = {};

      games.forEach((g) => {
        if (!map[g.genre]) {
          map[g.genre] = {
            name: g.genre,
            totalGames: 0,
            totalSales: 0,
            games: [],
          };
        }

        map[g.genre].totalGames++;
        map[g.genre].totalSales += g.globalSales || 0;
        map[g.genre].games.push(g);
      });

      return Object.values(map).map((genre) => ({
        ...genre,
        averageSales: genre.totalSales / genre.totalGames,
      }));
    },

    genre: async (_, { name }) => {
      const games = await prisma.game.findMany({
        where: { genre: { equals: name, mode: "insensitive" } },
      });

      if (!games.length) throw new Error("Genre not found");

      const totalSales = games.reduce(
        (sum, g) => sum + (g.globalSales || 0),
        0,
      );

      return {
        name: games[0].genre,
        totalGames: games.length,
        averageSales: totalSales / games.length,
        games, // return all games.
      };
    },
  },

  Mutation: {
    register: async (_, { email, password, name }) => {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) throw new Error("User already exists");

      const hashedPassword = await hashPassword(password);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
        },
      });

      return {
        token: generateToken(user.id),
        user,
      };
    },

    login: async (_, { email, password }) => {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) throw new Error("Invalid credentials");

      const valid = await comparePassword(password, user.password);
      if (!valid) throw new Error("Invalid credentials");

      return {
        token: generateToken(user.id),
        user,
      };
    },
    deleteTestUsers: async (_, { email }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;
      return prisma.user.delete({ where: { email } });
    },
    
    createGame: async (_, { input }, context) => {
      requireAuth(context);

      return prisma.game.create({
        data: {
          ...input,
          globalSales: calculateGlobalSales(input),
        },
      });
    },

    updateGame: async (_, { id, input }, context) => {
      requireAuth(context);

      const globalSales = calculateGlobalSales(input);

      return prisma.game.update({
        where: { id: parseInt(id) },
        data: {
          ...input,
          globalSales: globalSales > 0 ? globalSales : undefined,
        },
      });
    },

    deleteGame: async (_, { id }, context) => {
      requireAuth(context);

      return prisma.game.delete({
        where: { id: parseInt(id) },
      });
    },
  },
};

module.exports = resolvers;
