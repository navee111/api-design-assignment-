const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

const CSV_FILE_PATH = path.join(__dirname, 'vgsales.csv');
const BATCH_SIZE = 500;

/**
 * Remove all existing game records.
 *
 * @returns {Promise<void>} Resolves after records are deleted.
 */
async function clearGames() {
  console.log('Clearing existing games...');
  await prisma.game.deleteMany({});
  console.log('Games cleared.');
}

/**
 * Convert a CSV row into a Prisma-compatible game payload.
 *
 * @param {{ Rank?: string, Name?: string, Platform?: string, Year?: string, Genre?: string, Publisher?: string, NA_Sales?: string, EU_Sales?: string, JP_Sales?: string, Other_Sales?: string, Global_Sales?: string }} row - Raw CSV row.
 * @returns {{ rank: number|null, name: string, platform: string|null, year: number|null, genre: string|null, publisher: string|null, naSales: number, euSales: number, jpSales: number, otherSales: number, globalSales: number }} Parsed game object.
 */
function mapRowToGame(row) {
  return {
    rank: row.Rank ? parseInt(row.Rank) : null,
    name: row.Name || 'Unknown',
    platform: row.Platform || null,
    year: row.Year && row.Year !== 'N/A' ? parseInt(row.Year) : null,
    genre: row.Genre || null,
    publisher: row.Publisher || null,
    naSales: row.NA_Sales ? parseFloat(row.NA_Sales) : 0,
    euSales: row.EU_Sales ? parseFloat(row.EU_Sales) : 0,
    jpSales: row.JP_Sales ? parseFloat(row.JP_Sales) : 0,
    otherSales: row.Other_Sales ? parseFloat(row.Other_Sales) : 0,
    globalSales: row.Global_Sales ? parseFloat(row.Global_Sales) : 0,
  };
}

/**
 * Read and parse all games from the CSV source file.
 *
 * @returns {Promise<Array<{ rank: number|null, name: string, platform: string|null, year: number|null, genre: string|null, publisher: string|null, naSales: number, euSales: number, jpSales: number, otherSales: number, globalSales: number }>>} Parsed game records.
 */
async function readGamesFromCSV() {
  return new Promise((resolve, reject) => {
    const games = [];

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        games.push(mapRowToGame(row));
      })
      .on('end', () => {
        console.log(`Parsed ${games.length} games from CSV`);
        resolve(games);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Insert game records into the database in fixed-size batches.
 *
 * @param {Array<{ rank: number|null, name: string, platform: string|null, year: number|null, genre: string|null, publisher: string|null, naSales: number, euSales: number, jpSales: number, otherSales: number, globalSales: number }>} games - Parsed game records.
 * @returns {Promise<void>} Resolves when all batches are inserted.
 */
async function insertGamesInBatches(games) {
  let insertedCount = 0;

  for (let i = 0; i < games.length; i += BATCH_SIZE) {
    const batch = games.slice(i, i + BATCH_SIZE);

    await prisma.game.createMany({
      data: batch,
      skipDuplicates: true,
    });

    insertedCount += batch.length;
    console.log(`Inserted ${insertedCount}/${games.length} games...`);
  }
}

/**
 * Seed the database from the CSV source.
 *
 * @returns {Promise<void>} Resolves when seeding completes.
 */
async function main() {
  console.log('🚀 Starting database seed...');

  await clearGames();

  const games = await readGamesFromCSV();

  await insertGamesInBatches(games);

  const total = await prisma.game.count();

  console.log('✅ Database seeded successfully!');
  console.log(`Total games in database: ${total}`);
}

/**
 * Execute seed workflow with error handling and Prisma disconnect.
 */
main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  