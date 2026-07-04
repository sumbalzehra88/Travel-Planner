import Database from 'better-sqlite3';
import path from 'path';

// Resolve database path in the current working directory
const dbPath = path.resolve(process.cwd(), 'database.sqlite');
const db = new Database(dbPath, { verbose: console.log });

// Enable foreign key support in SQLite
db.pragma('foreign_keys = ON');

// Initialize database schema
export function initDb() {
  // Create users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // Create trips table
  db.exec(`
    CREATE TABLE IF NOT EXISTS trips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      destination TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      user_id INTEGER DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  // Migrate trips table schema safely to support historical dynamic themes and user associations
  const columnsToMigrate = [
    { name: 'theme_headline', type: 'TEXT' },
    { name: 'theme_tagline', type: 'TEXT' },
    { name: 'theme_color_bg', type: 'TEXT' },
    { name: 'theme_color_accent', type: 'TEXT' },
    { name: 'theme_site_name', type: 'TEXT' },
    { name: 'theme_trivia', type: 'TEXT' },
    { name: 'user_id', type: 'INTEGER' }
  ];

  for (const col of columnsToMigrate) {
    try {
      db.exec(`ALTER TABLE trips ADD COLUMN ${col.name} ${col.type} DEFAULT NULL;`);
    } catch (e) {
      // Ignore if column already exists
    }
  }

  // Create itineraries table
  db.exec(`
    CREATE TABLE IF NOT EXISTS itineraries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      day_index INTEGER NOT NULL, -- 0 for Day 1, 1 for Day 2, etc.
      time TEXT NOT NULL,         -- e.g., "10:00 AM", "14:30"
      activity TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
    );
  `);

  // Create expenses table
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      trip_id INTEGER NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      category TEXT NOT NULL,     -- e.g., "Transportation", "Food", "Lodging", "Activities", "Shopping", "Other"
      date TEXT NOT NULL,         -- Date of expense
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE
    );
  `);

  console.log('Database initialized successfully at:', dbPath);
}

export default db;
