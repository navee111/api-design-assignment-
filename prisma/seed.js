const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const prisma = new PrismaClient();

const CSV_FILE_PATH = path.join(__dirname, 'vgsales.csv');
const BATCH_SIZE = 500;

/**
 * Clears all games from the database
 */
async function clearGames() {
  console.log('Clearing existing games...');
  await prisma.game.deleteMany({});
  console.log('Games cleared.');
}

/**
 * Maps a CSV row to a Game object
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
 * Reads and parses the CSV file
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
 * Inserts games into database in batches
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
 * Main execution function
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
 * Run script safely
 */
main()
  .catch((error) => {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
  