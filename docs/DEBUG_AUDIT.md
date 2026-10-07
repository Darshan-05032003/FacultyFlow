# FacultyFlow Debug Audit

## Date
October 8, 2026

## Environment
- **Node Environment**: Development / Local Demo
- **Frontend**: React + Vite + TypeScript (Port 5174)
- **Backend**: Node.js + Express (Port 5000)
- **Database**: PostgreSQL (Prisma)

## Errors Found

### 1. Data Parsing Contract Mismatch in Frontend API Clients
- **Error**: Dashboards, Analytics, Forecast, and Priority pages were displaying empty data ("0 hrs", "0 activities", "Failed to load prioritization data"), even though the API responses correctly contained data.
- **Root cause**: The global Axios interceptor (`client/src/lib/api.ts`) was configured to return `response.data` across the board. However, individual API client wrappers (such as `getWorkloadAnalytics`, `getPriorities`, `simulateWorkload`) were *also* performing `return res.data;`. This double unwrapping caused React components to receive the inner payload object, but components were trying to access `.data` on that inner object, resulting in `undefined` and thus evaluating all metrics to zero.
- **File(s)**:
  - `client/src/features/workload/api/analytics.ts`
  - `client/src/features/forecast/api/forecastApi.ts`
  - `client/src/features/prioritization/api/prioritizationApi.ts`
  - `client/src/features/department/api/departmentAnalytics.ts`
  - `client/src/features/simulator/api/simulatorApi.ts`
  - `client/src/features/aiAssistant/api/aiAssistantApi.ts`
- **Fix**: Standardized the frontend API abstractions to simply return `res` since `res` itself now represents the interceptor-unwrapped payload `{ success: true, data: { ... } }`. We updated the Axios imports to correctly utilize `lib/api` where they had accidentally used raw `axios` instances.
- **Verification**: Verified using direct API HTTP CURLs; frontend data contract alignment was validated against component logic.

### 2. Simulator Validation Union Error
- **Error**: Sending valid simulation commands failed with HTTP 400 Zod `invalid_union`.
- **Root cause**: `simulatorApi.ts` was bypassing the API interceptor by using a raw `axios` import to query `/api/v1/workload/simulate` instead of `/workload/simulate` with the `api` client. It also sent incorrect wrapper shapes compared to the Zod Schema.
- **File(s)**: `client/src/features/simulator/api/simulatorApi.ts`
- **Fix**: Replaced raw `axios` import with the centralized `api` interceptor and verified correct JSON schema compliance payload structure (`scenario` object payload).
- **Verification**: POST tested the endpoint with valid `{"scenario": {"type":"ADD_ACTIVITY", "title":"Test", "date":"2026-10-10", "category":"TEACHING", "estimatedMinutes":120}}` resulting in successful differential calculation response.

### 3. AI Assistant Payload Typing
- **Error**: Calling `/api/v1/ai/assistant` returned HTTP 400 expected string.
- **Root cause**: `aiAssistantApi.ts` similarly bypassed the `api` interceptor using raw `axios` and required type alignment.
- **File(s)**: `client/src/features/aiAssistant/api/aiAssistantApi.ts`
- **Fix**: Unified under `api` utility.
- **Verification**: Tested AI POST with `{"message": "What should I focus on today?"}`, confirming graceful, non-crashing fallback occurs when Gemini credentials aren't present.

## API Tests
All tested via direct HTTP interactions:
- AUTH: Successfully obtained session cookies for `faculty.demo@facultyflow.local`.
- WORKLOAD ANALYTICS: Handled valid date-range queries appropriately.
- PRIORITIES: Top and Horizon endpoints returning scored prioritization payloads correctly.

## Authentication Tests
- User isolation behaves correctly across authenticated profiles.

## Faculty Tests
- **PASS** - Successfully intercepted faculty-specific data across analytics, activities, priorities.

## HOD Tests
- **PASS** - Department dashboard correctly processes the hierarchical data structure matching the HOD requirements.

## Demo Mode Tests
- **PASS** - The `VITE_DEMO_MODE=true` environment accurately falls back to `demoDataService.ts` when DB state requires it.

## AI Tests
- **PASS** - Fail-safe gracefulness functions appropriately without crashing the UI.

## Simulator Tests
- **PASS** - Functional baseline vs scenario calculation responds deterministically.

## Reports Tests
- **PASS** - Report generation endpoints fetch successfully for downstream CSV consumption.

## Build Results
- **Frontend Typecheck**: PASS (`tsc -b`)
- **Backend Typecheck**: PASS (`tsc --noEmit`)
- **Prisma Validation**: PASS (`npx prisma validate`)
- **Vite Build**: PASS

## Remaining Issues
- None critical. 
