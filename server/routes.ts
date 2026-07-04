import { Router, Request, Response, NextFunction } from 'express';
import db from './db.js';
import { GoogleGenAI, Type } from '@google/genai';
import crypto from 'crypto';

const router = Router();

// ==========================================
// PASSWORD & AUTHENTICATION HELPERS
// ==========================================

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(':');
  if (parts.length !== 2) return false;
  const [salt, hash] = parts;
  const verifyHash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
}

export interface AuthenticatedRequest extends Request {
  user?: { id: number; username: string };
}

function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No session token provided' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const session = db.prepare(`
      SELECT s.*, u.username 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token) as any;

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized: Session has expired or is invalid' });
    }

    req.user = { id: session.user_id, username: session.username };
    next();
  } catch (err) {
    console.error('Authentication error:', err);
    res.status(500).json({ error: 'Authentication internal error' });
  }
}

// ==========================================
// AUTHENTICATION ENDPOINTS
// ==========================================

// POST /api/auth/register
router.post('/auth/register', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const trimmedUsername = username.trim();
  if (trimmedUsername.length < 3) {
    return res.status(400).json({ error: 'Username must be at least 3 characters long' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
  }

  try {
    const existing = db.prepare('SELECT 1 FROM users WHERE username = ?').get(trimmedUsername);
    if (existing) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const password_hash = hashPassword(password);
    const result = db.prepare(`
      INSERT INTO users (username, password_hash)
      VALUES (?, ?)
    `).run(trimmedUsername, password_hash);

    const userId = result.lastInsertRowid;
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(token, userId, expiresAt);

    res.status(201).json({
      token,
      user: {
        id: userId,
        username: trimmedUsername
      }
    });
  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// POST /api/auth/login
router.post('/auth/login', (req: Request, res: Response) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username.trim()) as any;
    if (!user || !verifyPassword(password, user.password_hash)) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    
    db.prepare(`
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `).run(token, user.id, expiresAt);

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username
      }
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/auth/me - Check current token session
router.get('/auth/me', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const session = db.prepare(`
      SELECT s.*, u.username 
      FROM sessions s 
      JOIN users u ON s.user_id = u.id 
      WHERE s.token = ? AND s.expires_at > datetime('now')
    `).get(token) as any;

    if (!session) {
      return res.status(401).json({ error: 'Session expired or invalid' });
    }

    res.json({
      user: {
        id: session.user_id,
        username: session.username
      }
    });
  } catch (err) {
    console.error('Error in /auth/me:', err);
    res.status(500).json({ error: 'Failed to verify session' });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    } catch (err) {
      console.error('Error deleting session during logout:', err);
    }
  }
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// THEME & HISTORICAL DATA HELPERS
// ==========================================

function getFallbackTheme(destination: string) {
  const dest = destination.toLowerCase().trim();
  if (dest.includes('paris')) {
    return {
      historical_site: "Notre-Dame Cathedral",
      headline: "La Belle Époque",
      tagline: "Stroll through tree-lined boulevards and centuries of romance.",
      color_bg: "#F5F3FF",
      color_accent: "#6D28D9",
      trivia: "Notre-Dame Cathedral stands on the Île de la Cité, the historic heart of Paris since Roman times."
    };
  }
  if (dest.includes('rome')) {
    return {
      historical_site: "The Colosseum",
      headline: "Imperial Echoes",
      tagline: "Step into the arena where history was carved in stone.",
      color_bg: "#FFFBEB",
      color_accent: "#B45309",
      trivia: "The Colosseum could hold an estimated 50,000 to 80,000 spectators during its imperial heyday."
    };
  }
  if (dest.includes('tokyo')) {
    return {
      historical_site: "Senso-ji Temple",
      headline: "Edo Heritage",
      tagline: "Discover ancient crimson gates nestled in neon modernism.",
      color_bg: "#FFF5F5",
      color_accent: "#DC2626",
      trivia: "Founded in 645 AD, Senso-ji is Tokyo's oldest temple, dedicated to the Bodhisattva Kannon."
    };
  }
  if (dest.includes('cairo') || dest.includes('egypt') || dest.includes('giza')) {
    return {
      historical_site: "The Pyramids of Giza",
      headline: "Desert Dynasty",
      tagline: "Unearth the monumental stone legacies of ancient pharaohs.",
      color_bg: "#FEF3C7",
      color_accent: "#D97706",
      trivia: "The Great Pyramid of Giza was the tallest man-made structure in the world for over 3,800 years."
    };
  }
  if (dest.includes('london')) {
    return {
      historical_site: "The Tower of London",
      headline: "Crown & Citadel",
      tagline: "Cross the drawbridges of medieval kings and legendary prisoners.",
      color_bg: "#F0F9FF",
      color_accent: "#0369A1",
      trivia: "The Tower of London has served as a royal palace, political prison, and home of the Crown Jewels since 1066."
    };
  }
  if (dest.includes('kyoto')) {
    return {
      historical_site: "Kinkaku-ji (Golden Pavilion)",
      headline: "Zen Pavilion",
      tagline: "Walk among mossy gardens reflecting gold on still waters.",
      color_bg: "#F0DF4",
      color_accent: "#15803D",
      trivia: "The top two floors of Kinkaku-ji are completely covered in gold leaf."
    };
  }
  if (dest.includes('new york') || dest.includes('nyc')) {
    return {
      historical_site: "The Statue of Liberty",
      headline: "Harbor of Hope",
      tagline: "Gaze upon the colossal green beacon that welcomed generations.",
      color_bg: "#ECFDF5",
      color_accent: "#047857",
      trivia: "The Statue of Liberty's copper exterior has naturally oxidized into its signature green patina."
    };
  }
  if (dest.includes('istanbul') || dest.includes('turkey') || dest.includes('constantinople')) {
    return {
      historical_site: "Hagia Sophia",
      headline: "Byzantine Sunrise",
      tagline: "Gaze upon the massive dome bridging empires and faiths across oceans.",
      color_bg: "#FAF5F0",
      color_accent: "#8C3B3B",
      trivia: "Hagia Sophia was the world's largest cathedral for nearly a thousand years until 1520."
    };
  }

  // General fallback for all other parts of the world
  return {
    historical_site: `${destination} Landmark`,
    headline: "Wanderlust Quest",
    tagline: `Unlocking the local stories and timeless legends of ${destination}.`,
    color_bg: "#FAF9F6",
    color_accent: "#4A5568",
    trivia: `Every corner of ${destination} holds rich architectural and cultural histories waiting to be discovered.`
  };
}

async function generateTripTheme(tripId: number, destination: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  let themeData;

  if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
    try {
      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Identify a famous, beautiful, specific historical site or landmark in "${destination}". Generate a stunning visual theme styling config for a travel planner app, based on that site's materials, history, or surroundings.
        
Provide the response in the specified JSON format.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              historical_site: { type: Type.STRING, description: "Name of the prominent historical site or landmark." },
              headline: { type: Type.STRING, description: "A poetic, creative 2-4 word theme headline, e.g. 'Desert Dynasty' or 'Imperial Echoes'." },
              tagline: { type: Type.STRING, description: "An elegant, descriptive subtitle highlighting the site's unique historical ambiance." },
              color_bg: { type: Type.STRING, description: "A highly readable, very light pastel background hex color (e.g. #FAF5F0, #F3F9F6) that fits the aesthetic of the landmark." },
              color_accent: { type: Type.STRING, description: "A rich, deep, high-contrast matching text/accent hex color (e.g. #7E3E28, #1E5033) for headers and interactive elements." },
              trivia: { type: Type.STRING, description: "An interesting, single-sentence historical fact or trivia about this specific landmark." }
            },
            required: ["historical_site", "headline", "tagline", "color_bg", "color_accent", "trivia"]
          }
        }
      });

      if (response && response.text) {
        const parsed = JSON.parse(response.text.trim());
        themeData = {
          historical_site: parsed.historical_site || `${destination} Landmark`,
          headline: parsed.headline || "Wanderlust Quest",
          tagline: parsed.tagline || `Unlocking the local stories of ${destination}.`,
          color_bg: parsed.color_bg || "#FAF9F6",
          color_accent: parsed.color_accent || "#4A5568",
          trivia: parsed.trivia || `Discover the architectural and cultural legacies of ${destination}.`
        };
      }
    } catch (err) {
      console.error('Error calling Gemini for theme generation:', err);
    }
  }

  if (!themeData) {
    themeData = getFallbackTheme(destination);
  }

  // Update SQLite database with the theme info
  db.prepare(`
    UPDATE trips 
    SET theme_headline = ?, 
        theme_tagline = ?, 
        theme_color_bg = ?, 
        theme_color_accent = ?, 
        theme_site_name = ?, 
        theme_trivia = ?
    WHERE id = ?
  `).run(
    themeData.headline,
    themeData.tagline,
    themeData.color_bg,
    themeData.color_accent,
    themeData.historical_site,
    themeData.trivia,
    tripId
  );

  return themeData;
}

// ==========================================
// TRIP ENDPOINTS
// ==========================================

// GET /api/trips - Retrieve all trips with summarized expenses (authenticated user)
router.get('/trips', authenticate, (req: AuthenticatedRequest, res: Response) => {
  try {
    const trips = db.prepare(`
      SELECT t.*, 
             COALESCE((SELECT SUM(amount) FROM expenses WHERE trip_id = t.id), 0) as total_expenses
      FROM trips t
      WHERE t.user_id = ?
      ORDER BY t.start_date ASC
    `).all(req.user!.id);
    res.json(trips);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET /api/trips/:id - Retrieve a single trip with its itineraries and expenses (authenticated user)
router.get('/trips/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const itineraries = db.prepare(`
      SELECT * FROM itineraries 
      WHERE trip_id = ? 
      ORDER BY day_index ASC, time ASC
    `).all(id);

    const expenses = db.prepare(`
      SELECT * FROM expenses 
      WHERE trip_id = ? 
      ORDER BY date ASC, created_at ASC
    `).all(id);

    res.json({
      ...trip,
      itineraries,
      expenses
    });
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
});

// POST /api/trips - Create a new trip (authenticated user)
router.post('/trips', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { name, destination, start_date, end_date } = req.body;

  if (!name || !destination || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required fields: name, destination, start_date, end_date' });
  }

  try {
    const info = db.prepare(`
      INSERT INTO trips (name, destination, start_date, end_date, user_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(name, destination, start_date, end_date, req.user!.id);

    const tripId = info.lastInsertRowid;

    // Generate theme for the newly created trip!
    try {
      await generateTripTheme(Number(tripId), destination);
    } catch (themeErr) {
      console.error('Failed to generate initial theme:', themeErr);
    }

    const newTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(tripId) as any;
    res.status(201).json({ ...newTrip, total_expenses: 0, itineraries: [], expenses: [] });
  } catch (error) {
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  }
});

// PUT /api/trips/:id - Update an existing trip (authenticated user)
router.put('/trips/:id', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { name, destination, start_date, end_date } = req.body;

  if (!name || !destination || !start_date || !end_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Get existing trip first to see if destination changed and verify ownership
    const existingTrip = db.prepare('SELECT destination FROM trips WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!existingTrip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const result = db.prepare(`
      UPDATE trips 
      SET name = ?, destination = ?, start_date = ?, end_date = ? 
      WHERE id = ? AND user_id = ?
    `).run(name, destination, start_date, end_date, id, req.user!.id);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // If destination changed, regenerate the theme!
    if (existingTrip.destination !== destination) {
      try {
        await generateTripTheme(Number(id), destination);
      } catch (themeErr) {
        console.error('Failed to regenerate theme on destination change:', themeErr);
      }
    }

    const updatedTrip = db.prepare('SELECT * FROM trips WHERE id = ?').get(id);
    res.json(updatedTrip);
  } catch (error) {
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  }
});

// POST /api/trips/:id/theme - Regenerate/force generate theme from Gemini (authenticated user)
router.post('/trips/:id/theme', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const trip = db.prepare('SELECT * FROM trips WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const theme = await generateTripTheme(Number(id), trip.destination);
    res.json(theme);
  } catch (error) {
    console.error('Error regenerating theme:', error);
    res.status(500).json({ error: 'Failed to generate theme' });
  }
});

// DELETE /api/trips/:id - Delete a trip (authenticated user)
router.delete('/trips/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  try {
    const trip = db.prepare('SELECT 1 FROM trips WHERE id = ? AND user_id = ?').get(id, req.user!.id);
    if (!trip) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    // Manually delete dependent records to guarantee cascade works
    db.prepare('DELETE FROM itineraries WHERE trip_id = ?').run(id);
    db.prepare('DELETE FROM expenses WHERE trip_id = ?').run(id);

    const result = db.prepare('DELETE FROM trips WHERE id = ? AND user_id = ?').run(id, req.user!.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }
    res.json({ success: true, message: 'Trip and associated plan data deleted successfully' });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});


// ==========================================
// ITINERARY ENDPOINTS
// ==========================================

// POST /api/trips/:tripId/itinerary - Add an itinerary item (authenticated user)
router.post('/trips/:tripId/itinerary', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { tripId } = req.params;
  const { day_index, time, activity, notes } = req.body;

  if (day_index === undefined || !time || !activity) {
    return res.status(400).json({ error: 'Missing required fields: day_index, time, activity' });
  }

  try {
    const tripExists = db.prepare('SELECT 1 FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user!.id);
    if (!tripExists) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const info = db.prepare(`
      INSERT INTO itineraries (trip_id, day_index, time, activity, notes)
      VALUES (?, ?, ?, ?, ?)
    `).run(tripId, day_index, time, activity, notes || '');

    const newItem = db.prepare('SELECT * FROM itineraries WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating itinerary item:', error);
    res.status(500).json({ error: 'Failed to create itinerary item' });
  }
});

// PUT /api/trips/:tripId/itinerary/:id - Update an itinerary item (authenticated user)
router.put('/trips/:tripId/itinerary/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { tripId, id } = req.params;
  const { day_index, time, activity, notes } = req.body;

  if (day_index === undefined || !time || !activity) {
    return res.status(400).json({ error: 'Missing required fields: day_index, time, activity' });
  }

  try {
    const tripExists = db.prepare('SELECT 1 FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user!.id);
    if (!tripExists) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const result = db.prepare(`
      UPDATE itineraries 
      SET day_index = ?, time = ?, activity = ?, notes = ? 
      WHERE id = ? AND trip_id = ?
    `).run(day_index, time, activity, notes || '', id, tripId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Itinerary item not found or unauthorized' });
    }

    const updatedItem = db.prepare('SELECT * FROM itineraries WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating itinerary item:', error);
    res.status(500).json({ error: 'Failed to update itinerary item' });
  }
});

// DELETE /api/trips/:tripId/itinerary/:id - Delete an itinerary item (authenticated user)
router.delete('/trips/:tripId/itinerary/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { tripId, id } = req.params;
  try {
    const tripExists = db.prepare('SELECT 1 FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user!.id);
    if (!tripExists) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const result = db.prepare('DELETE FROM itineraries WHERE id = ? AND trip_id = ?').run(id, tripId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Itinerary item not found or unauthorized' });
    }
    res.json({ success: true, message: 'Itinerary item deleted' });
  } catch (error) {
    console.error('Error deleting itinerary item:', error);
    res.status(500).json({ error: 'Failed to delete itinerary item' });
  }
});


// ==========================================
// EXPENSE ENDPOINTS
// ==========================================

// POST /api/trips/:tripId/expenses - Add an expense (authenticated user)
router.post('/trips/:tripId/expenses', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { tripId } = req.params;
  const { description, amount, category, date } = req.body;

  if (!description || amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'Missing required fields: description, amount, category, date' });
  }

  try {
    const tripExists = db.prepare('SELECT 1 FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user!.id);
    if (!tripExists) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const info = db.prepare(`
      INSERT INTO expenses (trip_id, description, amount, category, date)
      VALUES (?, ?, ?, ?, ?)
    `).run(tripId, description, Number(amount), category, date);

    const newItem = db.prepare('SELECT * FROM expenses WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newItem);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/trips/:tripId/expenses/:id - Update an expense (authenticated user)
router.put('/api/trips/:tripId/expenses/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { tripId, id } = req.params;
  const { description, amount, category, date } = req.body;

  if (!description || amount === undefined || !category || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const tripExists = db.prepare('SELECT 1 FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user!.id);
    if (!tripExists) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const result = db.prepare(`
      UPDATE expenses 
      SET description = ?, amount = ?, category = ?, date = ? 
      WHERE id = ? AND trip_id = ?
    `).run(description, Number(amount), category, date, id, tripId);

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found or unauthorized' });
    }

    const updatedItem = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/trips/:tripId/expenses/:id - Delete an expense (authenticated user)
router.delete('/api/trips/:tripId/expenses/:id', authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { tripId, id } = req.params;
  try {
    const tripExists = db.prepare('SELECT 1 FROM trips WHERE id = ? AND user_id = ?').get(tripId, req.user!.id);
    if (!tripExists) {
      return res.status(404).json({ error: 'Trip not found or unauthorized' });
    }

    const result = db.prepare('DELETE FROM expenses WHERE id = ? AND trip_id = ?').run(id, tripId);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Expense not found or unauthorized' });
    }
    res.json({ success: true, message: 'Expense deleted' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;
