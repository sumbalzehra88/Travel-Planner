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

### 1. 🅡 Backend Deployment (Render)

Render is an excellent option for hosting the Express backend.

#### Step-by-Step Setup:
1. Log in to your [Render Dashboard](https://dashboard.render.com/) and click **New > Web Service**.
2. Connect your Git repository.
3. Configure the following service settings:
   - **Name**: `wandersync-backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `npm run start`
4. Expand the **Advanced** section and add your **Environment Variables**:
   - `NODE_ENV`: `production`
   - `GEMINI_API_KEY`: *(your API key for smart theme generation)*
   - `PORT`: `3000` *(Render auto-exposes web services, but setting PORT is a best practice)*

> [!NOTE]
> **SQLite Disk Persistence on Render:**
> SQLite uses a local file (`database.sqlite`). By default, Render Web Service containers have ephemeral disks—meaning data is cleared every time the service restarts or spins down.
> - **To persist data permanently on Render:** Go to your Web Service dashboard, click **Disks**, click **Add Disk**, set the mount path to `/data`, and modify the SQLite path in `/server/db.ts` to use `/data/database.sqlite`.
> - **Alternative:** For large production scaling, swap the connection in `/server/db.ts` to a persistent remote SQL database (e.g., PostgreSQL).

---

### 2. 🅥 Frontend Deployment (Vercel)

Vercel is optimized for building and delivering fast, static frontends (Vite, React).

#### Step-by-Step Setup:
1. Go to your [Vercel Dashboard](https://vercel.com/) and click **Add New > Project**.
2. Select your Git repository.
3. Configure the project settings:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `dist`
4. Under **Environment Variables**, add the connection link to your newly deployed Render backend:
   - `VITE_API_URL`: `https://wandersync-backend.onrender.com` *(Replace with your actual Render service URL)*
5. Click **Deploy**. Vercel will build the React assets and make your app live!

> [!IMPORTANT]
> A custom `vercel.json` has been included in the root directory. It automatically configures URL rewriting so that deep client-side routes (like refreshing the page on `/trips/3`) are routed back to Vercel's `index.html` instead of causing a `404 Not Found` error.

---

## 🔒 CORS & Secure Communication

When the frontend and backend are hosted on separate domains, browsers require permission to perform cross-origin requests.

- **Automated Handshake**: The Express backend in `server.ts` has built-in, lightweight CORS middleware. It dynamically reads incoming `Origin` headers and returns the correct `Access-Control-Allow-Origin`, `Methods`, and `Credentials` headers.
- **Preflight Support**: It supports preflight `OPTIONS` requests seamlessly, guaranteeing zero-config cross-origin requests.
