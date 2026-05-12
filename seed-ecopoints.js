/**
 * Reads src/data/seed-ecopoints.json and populates server/db.json
 * with ecopoint_transaction entries whose dates are relative to NOW.
 *
 * Usage:  node seed-ecopoints.js
 *         npm run seed
 *         npm run server   (runs seed automatically before json-server)
 */

const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, 'server', 'db.json');
const seedPath = path.join(__dirname, 'src', 'data', 'seed-ecopoints.json');

// 1. Read source files
const rawSeed = fs.readFileSync(seedPath, 'utf-8');
const seedEntries = JSON.parse(rawSeed);

const rawDb = fs.readFileSync(dbPath, 'utf-8');
const db = JSON.parse(rawDb);

// 2. Delete ALL existing ecopoint_transaction records
delete db.ecopoint_transaction;

// 3. Calculate real dates and build new entries
const now = Date.now();
const DAY_MS = 86400000;

const transactions = seedEntries.map((entry, index) => ({
  id: index + 1,
  user_id: entry.student_id,
  ecopoints: entry.ecopoints,
  created_at: new Date(now - entry.days_ago * DAY_MS).toISOString(),
}));

// 4. Insert fresh entries
db.ecopoint_transaction = transactions;

// 5. Write db.json
fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), 'utf-8');
console.log(`✓ ecopoint_transaction seeded: ${transactions.length} entries`);
