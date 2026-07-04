# WanderSync - Smart Travel Planner & Companion

A highly polished, interactive, and full-stack travel planning application. It features customized smart design themes based on your destination, comprehensive itinerary planners, real-time weather forecasts, and advanced budget calculators with expense category metrics.

---

## 🚀 Features

- **Smart Design Themes**: Automatically generates visual accents, custom color palettes, and header taglines tailored to your destination.
- **Itinerary Planner**: Schedule and view structured daily plans.
- **Budget & Expense Tracker**: Interactive category breakdown, percentage meters, and budget limits.
- **Real-Time Weather Forecasts**: Integrates coordinates and live weather conditions based on your destination city.
- **Smooth Sidebar & Transitions**: Elegant client-side interactions and responsive modals.

---

## 📁 Project Structure

```text
├── server/                 # Express Backend Server
│   ├── db.ts               # SQLite Database Initializer
│   └── routes.ts           # REST API Routes (Trips, Itineraries, Expenses, Themes)
├── src/                    # React + Vite Frontend
│   ├── components/         # Modular React Components (Sidebar, Forecast, Details, Budget, etc.)
│   ├── lib/                # API client helper functions
│   └── types.ts            # Shared TypeScript Interfaces
├── server.ts               # Full-Stack Server Entry Point
├── package.json            # Build Scripts & Dependencies Configuration
├── vercel.json             # Vercel SPA Routing Configuration
└── README.md               # Setup & Deployment Manual
```

---

## 🛠️ Local Development Setup

To run this application locally, ensure you have **Node.js** (v18 or higher) installed on your system.

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env` file in the root of your project:
```env
# Backend Secret for AI theme stylings (Optional but recommended)
GEMINI_API_KEY="your-gemini-api-key"

# Client Configuration (Leave blank for local dev to auto-fallback to /api)
VITE_API_URL=""
```

### 3. Start Development Server
```bash
npm run dev
```
The application will run locally at `http://localhost:3000`.

---

## 🌐 Production Deployment

For optimal production performance and hosting flexibility, this application is configured to be deployed as a **decoupled full-stack app**: the **Express backend on Render** and the **React frontend on Vercel**.

---


---

## 🔒 CORS & Secure Communication

When the frontend and backend are hosted on separate domains, browsers require permission to perform cross-origin requests.

- **Automated Handshake**: The Express backend in `server.ts` has built-in, lightweight CORS middleware. It dynamically reads incoming `Origin` headers and returns the correct `Access-Control-Allow-Origin`, `Methods`, and `Credentials` headers.
- **Preflight Support**: It supports preflight `OPTIONS` requests seamlessly, guaranteeing zero-config cross-origin requests.
