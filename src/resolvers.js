const { PrismaClient } = require("@prisma/client");
const { GraphQLError } = require("graphql");
const {
  generateToken,
  hashPassword,
  comparePassword,
  getUserFromContext,
} = require("./auth");

const prisma = new PrismaClient();

/**
 * Create a GraphQL error that also controls HTTP status code.
 *
 * @param {number} status - HTTP status code.
 * @param {string} message - Error message.
 * @param {string} code - Application error code.
 * @returns {GraphQLError} GraphQL error with HTTP metadata.
 */
function createHttpError(status, message, code) {
  return new GraphQLError(message, {
    extensions: {
      code,
      http: { status },
    },
  });
}

/**
 * Parse and validate integer id values.
 *
 * @param {string|number} id - Incoming id value.
 * @param {string} fieldName - Logical field name for error messages.
 * @returns {number} Parsed integer id.
 * @throws {GraphQLError} When id is invalid.
 */
function parseRequiredInt(id, fieldName) {
  const parsed = Number.parseInt(id, 10);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw createHttpError(
      400,
      `${fieldName} must be a positive integer`,
      "BAD_USER_INPUT",
    );
  }
  return parsed;
}

/**
 * Resolve and validate the authenticated user id from GraphQL context.
 *
 * @param {{ req?: { headers?: { authorization?: string } } }} context - Resolver context.
 * @returns {string|number} Authenticated user id.
 * @throws {Error} When the request is unauthenticated.
 */
function requireAuth(context) {
  const userId = getUserFromContext(context);
  if (!userId) {
    throw createHttpError(401, "Not authenticated", "UNAUTHENTICATED");
  }
  return userId;
}

/**
 * Calculate total global sales from regional sales fields.
 *
 * @param {{ naSales?: number, euSales?: number, jpSales?: number, otherSales?: number }} input - Game sales input.
 * @returns {number} Total global sales.
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
 * Build a Prisma `where` filter from optional game query arguments.
 *
 * @param {{ platform?: string, genre?: string, publisher?: string, yearMin?: number, yearMax?: number }} args - Query filters.
 * @returns {Record<string, unknown>} Prisma-compatible filter object.
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

/**
 * GraphQL resolvers for queries and mutations.
 *
 * @type {{ Query: Record<string, Function>, Mutation: Record<string, Function> }}
 */
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
      const gameId = parseRequiredInt(id, "id");
      const game = await prisma.game.findUnique({
        where: { id: gameId },
      });

      if (!game) {
        throw createHttpError(404, "Game not found", "NOT_FOUND");
      }

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

      if (!games.length) {
        throw createHttpError(404, "Publisher not found", "NOT_FOUND");
      }

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

      if (!games.length) {
        throw createHttpError(404, "Genre not found", "NOT_FOUND");
      }

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

      if (existingUser) {
        throw createHttpError(400, "User already exists", "BAD_USER_INPUT");
      }

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

      if (!user) {
        throw createHttpError(401, "Invalid credentials", "UNAUTHENTICATED");
      }

      const valid = await comparePassword(password, user.password);
      if (!valid) {
        throw createHttpError(401, "Invalid credentials", "UNAUTHENTICATED");
      }

      return {
        token: generateToken(user.id),
        user,
      };
    },
    deleteTestUsers: async (_, { email }) => {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw createHttpError(404, "User not found", "NOT_FOUND");
      }
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
      const gameId = parseRequiredInt(id, "id");

      const globalSales = calculateGlobalSales(input);

      try {
        return prisma.game.update({
          where: { id: gameId },
          data: {
            ...input,
            globalSales: globalSales > 0 ? globalSales : undefined,
          },
        });
      } catch (error) {
        if (error && error.code === "P2025") {
          throw createHttpError(404, "Game not found", "NOT_FOUND");
        }
        throw error;
      }
    },

    deleteGame: async (_, { id }, context) => {
      requireAuth(context);
      const gameId = parseRequiredInt(id, "id");

      try {
        return prisma.game.delete({
          where: { id: gameId },
        });
      } catch (error) {
        if (error && error.code === "P2025") {
          throw createHttpError(404, "Game not found", "NOT_FOUND");
        }
        throw error;
      }
    },
  },
};

module.exports = resolvers;
