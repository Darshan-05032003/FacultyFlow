# FacultyFlow Demo Mode

## Why Demo Mode Exists
FacultyFlow contains a robust backend with actual database-driven metrics, but setting up populated historical activity to properly demonstrate Forecasts, Trends, and HOD Rollups can be time-consuming. Demo Mode intercepts API calls that return empty/missing data and gracefully injects a comprehensive, deterministic dataset. This allows users to experience the application in a fully populated state without running complex data seeding.

## Configuration
Demo Mode is enabled via an environment variable in the frontend. 

In `client/.env`:
\`\`\`env
VITE_DEMO_MODE=true
\`\`\`

To disable demo mode and use the real APIs exclusively:
\`\`\`env
VITE_DEMO_MODE=false
\`\`\`

## Demo Data Location
All demo data is centrally managed. The primary logic is located in:
- `client/src/demo/demoDataService.ts`
- `client/src/demo/demoData.ts`

This data is securely injected via API interceptors that fallback to `DemoService` when the API responds with empty data. 

## Demo Users
We have created dedicated deterministic profiles for demo use. Ensure the PostgreSQL backend is running, as authentication still uses the real database. (The demo mode applies ONLY to the analytics/activities API responses, not to the login process.)

### 1. HOD Login
- **Email:** `hod.demo@facultyflow.local`
- **Password:** `FacultyFlow@123`
- **Role:** HOD

### 2. Faculty Login
- **Email:** `faculty.demo@facultyflow.local`
- **Password:** `FacultyFlow@123`
- **Role:** FACULTY

## How to Run
1. Start the backend (`npm run dev` in `/server`).
2. Verify PostgreSQL is running.
3. Ensure `VITE_DEMO_MODE=true` is set in `client/.env`.
4. Start the frontend (`npm run dev` in `/client`).
5. Log in using one of the demo accounts above.
6. The dashboards, activities, forecast, and prioritization screens will seamlessly populate with the demo data!

## How Real API Mode Works
When `VITE_DEMO_MODE=false`, the API interceptors completely bypass the `demoDataService.ts` layer and throw errors or display empty state UI elements whenever the backend database lacks actual data.
