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

  // Seed database with default template trips if they don't exist
  try {
    const hasIstanbul = db.prepare('SELECT id FROM trips WHERE id = 1').get();
    if (!hasIstanbul) {
      db.prepare(`
        INSERT INTO trips (
          id, name, destination, start_date, end_date, 
          theme_headline, theme_tagline, theme_color_bg, 
          theme_color_accent, theme_site_name, theme_trivia, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).run(
        1,
        'Turkey Trip',
        'Istanbul',
        '2026-07-22',
        '2026-07-29',
        'Imperial Dome',
        'Where golden mosaics meet historic whispering domes',
        '#F8F1EA',
        '#8D3B23',
        'Hagia Sophia',
        'Completed in 537 AD under Emperor Justinian I, its revolutionary dome was so massive it was said to be suspended by a golden chain from heaven.'
      );

      // Seed Istanbul Itinerary
      const istanbulItinerary = [
        { day_index: 0, time: '10:00 AM', activity: 'Arrival at Istanbul Airport & Check-in', notes: 'Take the Havaist shuttle to Sultanahmet' },
        { day_index: 0, time: '02:00 PM', activity: 'Explore Hagia Sophia', notes: 'Admire the golden mosaics and historical architecture' },
        { day_index: 0, time: '07:00 PM', activity: 'Dinner at Bosphorus-view Rooftop', notes: 'Try traditional Turkish kebabs and mezze' },
        { day_index: 1, time: '09:30 AM', activity: 'Visit the Blue Mosque & Hippodrome', notes: 'Dress modestly (shoulders and knees covered)' },
        { day_index: 1, time: '01:00 PM', activity: 'Bargain at the Grand Bazaar', notes: 'Enjoy authentic Turkish tea while looking for souvenirs' },
        { day_index: 2, time: '10:30 AM', activity: 'Bosphorus Scenic Cruise', notes: 'Enjoy a beautiful cruise separating Europe and Asia' }
      ];
      for (const item of istanbulItinerary) {
        db.prepare(`
          INSERT INTO itineraries (trip_id, day_index, time, activity, notes)
          VALUES (?, ?, ?, ?, ?)
        `).run(1, item.day_index, item.time, item.activity, item.notes);
      }

      // Seed Istanbul Expenses
      const istanbulExpenses = [
        { description: 'Flight Tickets', amount: 500, category: 'Transportation', date: '2026-07-22' },
        { description: 'Sultanahmet Hotel Stay', amount: 280, category: 'Lodging', date: '2026-07-22' },
        { description: 'Bosphorus Cruise Ticket', amount: 25, category: 'Activities', date: '2026-07-24' },
        { description: 'Grand Bazaar Tea & Spices', amount: 40, category: 'Shopping', date: '2026-07-23' }
      ];
      for (const exp of istanbulExpenses) {
        db.prepare(`
          INSERT INTO expenses (trip_id, description, amount, category, date)
          VALUES (?, ?, ?, ?, ?)
        `).run(1, exp.description, exp.amount, exp.category, exp.date);
      }
      console.log('Seeded Turkey Trip (ID: 1) template.');
    }

    const hasKyoto = db.prepare('SELECT id FROM trips WHERE id = 3').get();
    if (!hasKyoto) {
      db.prepare(`
        INSERT INTO trips (
          id, name, destination, start_date, end_date, 
          theme_headline, theme_tagline, theme_color_bg, 
          theme_color_accent, theme_site_name, theme_trivia, user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).run(
        3,
        'Zen Gardens & Ancient Temples',
        'Kyoto, Japan',
        '2026-07-04',
        '2026-07-06',
        'Golden Reflection',
        'Where gilded majesty meets the tranquil waters of Kyoko-chi.',
        '#FCF9F2',
        '#5C3D17',
        'Kinkaku-ji (The Golden Pavilion)',
        'The top two floors of the pavilion are completely covered in brilliant gold leaf, designed to reflect beautifully over the surrounding Mirror Pond.'
      );

      // Seed Kyoto Itinerary
      const kyotoItinerary = [
        { day_index: 0, time: '11:00 AM', activity: 'Arrival at Kyoto Station', notes: 'Take Haruka Express from Kansai Airport' },
        { day_index: 0, time: '02:00 PM', activity: 'Check-in at Ryokan Sawanoya', notes: 'Enjoy traditional welcome tea' },
        { day_index: 0, time: '06:30 PM', activity: 'Kaiseki Dinner in Gion', notes: 'Multi-course dinner of seasonal delicacies' },
        { day_index: 1, time: '09:00 AM', activity: 'Kinkaku-ji (Golden Pavilion)', notes: 'Arrive early to beat the crowd' },
        { day_index: 1, time: '11:30 AM', activity: 'Ryoan-ji Rock Garden', notes: 'Meditate by the famous zen garden' },
        { day_index: 1, time: '03:00 PM', activity: 'Arashiyama Bamboo Grove', notes: 'Scenic walk through towering stalks' },
        { day_index: 2, time: '08:00 AM', activity: 'Fushimi Inari-Taisha Shrine', notes: 'Hike through thousands of red Torii gates' },
        { day_index: 2, time: '01:00 PM', activity: 'Kiyomizu-dera Temple', notes: 'Iconic panoramic views over Kyoto' },
        { day_index: 2, time: '04:30 PM', activity: 'Tea Ceremony in Higashiyama', notes: 'Learn standard matcha preparation' }
      ];
      for (const item of kyotoItinerary) {
        db.prepare(`
          INSERT INTO itineraries (trip_id, day_index, time, activity, notes)
          VALUES (?, ?, ?, ?, ?)
        `).run(3, item.day_index, item.time, item.activity, item.notes);
      }

      // Seed Kyoto Expenses
      const kyotoExpenses = [
        { description: 'Traditional Ryokan Stay', amount: 320, category: 'Lodging', date: '2026-07-04' },
        { description: 'Gion Kaiseki Feast', amount: 120, category: 'Food', date: '2026-07-04' },
        { description: 'Kyoto Temple Admissions', amount: 35, category: 'Activities', date: '2026-07-05' },
        { description: 'Matcha Tea Ceremony Class', amount: 45, category: 'Activities', date: '2026-07-06' },
        { description: 'Haruka Express & Metro Card', amount: 90, category: 'Transportation', date: '2026-07-04' }
      ];
      for (const exp of kyotoExpenses) {
        db.prepare(`
          INSERT INTO expenses (trip_id, description, amount, category, date)
          VALUES (?, ?, ?, ?, ?)
        `).run(3, exp.description, exp.amount, exp.category, exp.date);
      }
      console.log('Seeded Kyoto Trip (ID: 3) template.');
    }
  } catch (err) {
    console.error('Error seeding default templates in database:', err);
  }

  console.log('Database initialized successfully at:', dbPath);
}

export default db;
