import { Pool } from "pg";

// Detect if we are running in a cloud environment with DATABASE_URL
const isCloud = !!process.env.DATABASE_URL;

const db = new Pool(
  isCloud
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }, // required by Render / Heroku
      }
    : {
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        port: parseInt(process.env.DB_PORT) || 5432,
        ssl: { rejectUnauthorized: false },
      }
);

db.connect((err) => {
  if (err) {
    console.error("Database connection failed:", err);
  } else {
    console.log("Connected to the database ✅");
  }
});

// Function to create the players table if it doesn't exist
async function createPlayersTable() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS players (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        ip TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log("Players table is ready ✅");
  } catch (err) {
    console.error("Error creating players table:", err);
  }
}

// Call it once on server start
createPlayersTable();

export default db;
