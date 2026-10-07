# FacultyFlow

Faculty Workload Intelligence & Optimization Platform

## Product Overview
Faculty members manage a complex array of responsibilities, including teaching, research, administrative duties, and mentoring. Tracking where time is spent, forecasting upcoming workload, and maintaining balance is challenging without a dedicated tool, often resulting in burnout and misaligned priorities. FacultyFlow is designed to answer three questions:
1. Where is my time going?
2. What will my workload look like next?
3. Which tasks should I prioritize?

## Core Questions
- Where is my time going? (Workload Analytics)
- What will my workload look like next? (Workload Forecasting & What-If Simulator)
- Which tasks should I prioritize? (Task Prioritization Engine & AI Assistant)

## Features
- **Faculty Workload Dashboard**: Overview of current priorities, upcoming workload, and activity logging.
- **Activity/Task Recording**: Track all academic and administrative activities, estimating and recording actual times.
- **Workload Analytics**: Analyze planned vs actual workload, variance, completion rates, category distributions, and daily/weekly trends.
- **Forecasting**: Deterministic workload projections (7/14/30 days) to anticipate future pressure based on historical baseline and scheduled tasks.
- **Task Prioritization**: Deterministic scoring algorithms based on deadlines, forecast pressure, and importance to rank tasks.
- **AI Workload Assistant**: An AI-powered interactive chat providing intelligent context-aware actionable insights from analytics and forecast data.
- **What-If Simulator**: An interactive playground to preview the workload impact of adding, changing, or moving activities—purely in memory.
- **Reports & Export**: Complete CSV and printable PDF reports covering the selected timeframe for reporting to administration.
- **HOD Dashboard**: Department-level workload aggregation for Heads of Department.

## Architecture
The application is built as a maintainable **Modular Monolith**.
The backend relies on layered abstraction: Route → Controller → Service → Repository → Database.
AI features act as a read-only enhancement layer—the deterministic systems remain the absolute source of truth.

## Technology Stack
- **Frontend**: React, Vite, TypeScript, Tailwind CSS, TanStack Query, React Hook Form, Recharts, React Router
- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (Dockerized)
- **Security**: JWT (HttpOnly Cookies), bcrypt, Helmet, express-rate-limit, cors
- **AI Integration**: @google/generative-ai (Gemini 2.5 Flash)

## Repository Structure
```
facultyflow/
├── client/                 # Frontend React Application
│   ├── src/
│   │   ├── features/       # Feature-based architecture (activities, analytics, aiAssistant, etc.)
│   │   ├── components/     # Reusable UI components
│   │   ├── layouts/        # Application layouts
│   │   ├── pages/          # Generic pages
│   │   └── lib/            # Shared utilities (api, utils)
├── server/                 # Backend Express Application
│   ├── src/
│   │   ├── ai/             # Pluggable AI provider framework
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/         # Express routers
│   │   └── services/       # Core business logic
│   ├── prisma/             # Database schema and migrations
├── docker-compose.yml      # Infrastructure deployment
```

## Authentication & RBAC
- Uses secure **HttpOnly Cookies** for JWT storage, preventing XSS token theft.
- **Role-Based Access Control (RBAC)** defines isolation for `FACULTY`, `HOD`, and `ADMIN`.
- Strict ownership verification ensures a faculty member can only query and mutate their own data.

## Workload Analytics
Aggregates activity data over specified ranges, providing deterministic metrics (total planned, total actual, variance, completion rate, daily overload, and workload status).

## Forecasting
Projects workload 7, 14, or 30 days ahead by combining historical baselines and explicitly scheduled future activities to determine potential overload days.

## Prioritization
Calculates a numeric `priorityScore` dynamically for pending tasks by evaluating deadline proximity, category weight, and upcoming forecast pressure.

## AI Assistant
A chat assistant available throughout the app. It consumes a strictly formatted, read-only deterministic snapshot of your analytics, forecast, and priority data. It *cannot* mutate database records or invent tasks.

## What-If Simulator
An in-memory simulation tool to preview how a new workload (e.g., adding a course, extending a deadline) would impact your workload utilization and overload status—without affecting actual database records.

## Reports & Export
A comprehensive `Reports` page allows faculty to generate CSV exports of their activities and print complete workload summaries across custom date ranges.

## Database
- PostgreSQL 15 via Docker.
- Prisma ORM is used for typesafe database interaction and migrations.

## Environment Variables
Create a `.env` in `server/`:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
DATABASE_URL="postgresql://facultyflow:password@localhost:5433/facultyflow_db?schema=public"
JWT_SECRET=super_secret_jwt_key
AI_PROVIDER=google
AI_MODEL=gemini-2.5-flash
AI_API_KEY=your_gemini_api_key_here
```

## Local Development (Without Docker for Node/React)
If you want to run the database in Docker, but run Node.js and React locally for development:

1. **Install dependencies**:
```bash
npm install
```
2. **Start the Database**:
```bash
docker compose up db -d
```
3. **Run Database Migrations & Seeding** (Applies the schema and loads demo data):
```bash
cd server
npx prisma db push
npm run db:seed
cd ..
```
4. **Start the Application**:
```bash
npm start
```
*This will concurrently start the backend on port `5000` and the frontend on port `5173`.*

## Test Accounts & Demo Data
The application comes with seeded demo data, including past and future activities for testing the dashboards and forecast pages. 
For a full list of available test accounts and their passwords, please refer to [LOGINS.md](file:///home/darshan/Antigravity_projects/Atharva_project/facultyflow/LOGINS.md).

To present a fully populated, pristine environment during presentations without manual data seeding, see the **Demo Mode** guide in [docs/DEMO_MODE.md](file:///home/darshan/Antigravity_projects/Atharva_project/facultyflow/docs/DEMO_MODE.md).
## Full Docker Setup (Production-like)
If you want to run the entire stack (Database, Backend, and Frontend) inside Docker containers:

```bash
# Build and start all services in the background
docker compose up --build -d

# To view logs
docker compose logs -f

# To stop the services
docker compose down
```
*The application will be accessible at `http://localhost:3000`.*

## Database Migrations
If you make changes to `server/prisma/schema.prisma`, you need to create and apply a migration:
```bash
cd server
npx prisma migrate dev --name describe_your_change_here
```
If you just want to push your schema without creating a migration history (useful during early prototyping):
```bash
cd server
npx prisma db push
```

## Testing & Linting
To run basic linting and typechecking across the workspaces:
```bash
npm run lint
npm run typecheck
```

## Production Build (Local)
To build both the React frontend and the Express backend locally:
```bash
npm run build
```

## Security Notes
- Express is secured using **Helmet** and **Rate-Limiting**.
- Error stack traces are hidden in production.
- CORS is configured to only allow the exact `CLIENT_URL`.
- Passwords are encrypted using `bcrypt`.
- Input sizes are capped to prevent DOS attacks.

## Final Implementation Note
**PROMPT 10 COMPLETE.** All core faculty requirements, including Reports, Exports, AI Assistant, What-If Simulator, and extensive security hardening, have been verified and finalized.

FINAL PROMPT — NO NEXT IMPLEMENTATION PROMPT REQUIRED.
