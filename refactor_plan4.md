# Phase 4: End-to-End Backend ↔ Frontend Integration Plan

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│                          FRONTEND (Next.js 16)                   │
│  app/(auth)/ ─ login, register, forgot-password, terms           │
│  app/(dashboard)/ ─ dashboard, penyakit, log, grafik, chat, etc  │
│  app/api/ ─ chat (Groq), test-email (Resend)                     │
│  next.config.ts rewrites → proxy to backend services             │
└───────────────┬──────────────────────────────────────────────────┘
                │  HTTP (rewrites)
    ┌───────────┴───────────────────────────────┐
    │                                           │
    ▼                                           ▼
┌──────────────┐  ┌───────────────┐  ┌─────────────────┐
│ auth-service │  │analytic-svc   │  │intelligent-svc  │
│ (Hono+       │  │(Go/Fiber)     │  │(FastAPI/Python) │
│  BetterAuth) │  │ :3002         │  │ :3003           │
│ :3001        │  └──────┬────────┘  └────────┬────────┘
└──────┬───────┘         │                     │ MCP
       │                 │                     ▼
       ▼                 ▼              ┌──────────────┐
┌──────────────────────────────────┐    │knowledge-svc │
│    Neon PostgreSQL/TimescaleDB   │    │(Hono + MCP)  │
│  user, session, account,         │    │ :3004        │
│  verification                    │    └──────────────┘
│  env_telemetry, soil_telemetry   │
│  disease_log, command_log,       │
│  insight_log                     │
└──────────────┬───────────────────┘
               ▲
               │ MQTT → insert
    ┌──────────┴───────┐
    │ ingestion-service│
    │ (Bun/MQTT)       │
    └──────────────────┘
```

---

## 2. Gap Analysis

### 2.1 Frontend → Backend Connection Gaps

| Frontend Page | Current State | Backend Service | Status |
|---|---|---|---|
| **Login** (`LoginForm.tsx`) | ❌ Fake — `setTimeout → router.push("/")` | `auth-service` (BetterAuth) | **NOT CONNECTED** |
| **Register** (`RegisterForm.tsx`) | ❌ Fake — client-side validation only, no API call | `auth-service` | **NOT CONNECTED** |
| **Forgot Password** | ❌ Fake — step UI only, no actual email/OTP | `auth-service` + Resend | **NOT CONNECTED** |
| **Dashboard** (sensors) | ✅ Fetches `/api/sensor?device_id=node1` | `analytic-service` `/api/v1/telemetry/latest` | **CONNECTED** |
| **Grafik** (charts) | ✅ Fetches `/api/history` | `analytic-service` `/api/v1/telemetry/history` | **CONNECTED** |
| **Penyakit** (disease) | ❌ Fake — `URL.createObjectURL`, hardcoded result | `intelligent-service` `/predict` + `/predictions` | **NOT CONNECTED** |
| **Log Aktivitas** | ❌ Fake — hardcoded `logsData` object | `command_log` table (no read API exists) | **NOT CONNECTED** |
| **Chat AI** | ⚠️ Partial — uses `/api/chat` (Groq) | Should use `intelligent-service` `/api/v1/insights` | **WRONG BACKEND** |
| **Control Menu** | ❌ Fake — toggles local state only | `ingestion-service` (MQTT command topic) | **NOT CONNECTED** |
| **Profile / UserContext** | ❌ Fake — hardcoded "Hailey Williams", localStorage | `auth-service` (Better Auth session/user) | **NOT CONNECTED** |
| **DetailRekomendasi** | ❌ Fake — hardcoded sensor values | `analytic-service` latest readings | **NOT CONNECTED** |
| **WeatherCard** | ❌ Unknown source | OpenWeatherMap or knowledge-service MCP tool | **NOT CONNECTED** |
| **EnvironmentCard** | ✅ Receives data from Dashboard fetch | `analytic-service` | **CONNECTED** (via parent) |

### 2.2 Backend Gaps (missing APIs)

| Missing API | Service | Purpose |
|---|---|---|
| `GET /api/v1/command-log` | `analytic-service` (new endpoint) | Serve actuator activity logs to the Log Aktivitas page |
| `POST /api/v1/command` | New endpoint or MQTT HTTP bridge | Allow frontend to publish MQTT commands for actuator control |
| `GET /api/v1/disease-log` | `intelligent-service` | Already exists at `/predictions` — frontend just doesn't call it |
| `POST /api/v1/predict` | `intelligent-service` | Already exists at `/predict` — frontend just doesn't call it |
| Auth client SDK | `auth-service` | Better Auth provides `@better-auth/client` but it's not installed in frontend |

### 2.3 Frontend Gaps (missing infrastructure)

| Missing Piece | Description |
|---|---|
| **Auth Client** | No `better-auth` client integration. No session management, no protected routes. |
| **Auth Middleware** | No `middleware.ts` to redirect unauthenticated users from `/(dashboard)/*` routes. |
| **Proper UserContext** | `UserContext` uses localStorage with hardcoded defaults. Should hydrate from Better Auth session. |
| **API Client Layer** | No centralized fetch utility with error handling or auth headers. |
| **Environment Variables** | Frontend `.env.local` likely missing service URLs. |
| **MQTT/HTTP bridge** | No real-time actuator control. ControlMenu toggles do nothing. |

---

## 3. Implementation Plan

### Phase 4.1: Authentication Integration (auth-service ↔ frontend)

> **Priority: CRITICAL** — Everything else depends on knowing who the user is.

#### 4.1.1 Install Better Auth Client
```bash
cd frontend
bun add better-auth
```

#### 4.1.2 Create Auth Client (`lib/auth-client.ts`)
```ts
import { createAuthClient } from "better-auth/react";

export const { signIn, signUp, signOut, useSession } = createAuthClient({
    baseURL: "/api/auth",  // proxied via next.config.ts rewrite → :3001
});
```

#### 4.1.3 Wire Login Page
- Replace fake `setTimeout → router.push("/")` in `LoginForm.tsx` with:
  ```ts
  const { error } = await signIn.email({ email, password });
  ```
- Show server-returned errors (wrong password, etc.).

#### 4.1.4 Wire Register Page
- Replace fake validation-only flow in `RegisterForm.tsx` with:
  ```ts
  const { error } = await signUp.email({ name, email, password });
  ```

#### 4.1.5 Create Auth Middleware (`middleware.ts`)
- Protect all `/(dashboard)/*` routes.
- Redirect unauthenticated users to `/login`.
- Allow `/login`, `/register`, `/forgot-password`, `/terms` without auth.

#### 4.1.6 Refactor UserContext
- Replace localStorage-based `UserProvider` with Better Auth `useSession()`.
- Hydrate `username` and `profileImage` from the session's `user` object.
- Remove all `localStorage.getItem("username")` / `localStorage.getItem("profileImage")` patterns.

#### 4.1.7 Wire Logout
- Replace `window.location.href = "/login"` in Sidebar and mobile-profile with:
  ```ts
  await signOut();
  router.push("/login");
  ```

#### 4.1.8 Wire Forgot Password
- Implement actual OTP/reset flow using Better Auth's `forgetPassword` plugin or custom Resend integration.

---

### Phase 4.2: Disease Classification Integration (intelligent-service ↔ Penyakit page)

> **Priority: HIGH** — Core feature, currently 100% mocked.

#### 4.2.1 Add Rewrites for intelligent-service
In `next.config.ts`:
```ts
{ source: "/api/predict",     destination: "http://localhost:3003/predict" },
{ source: "/api/predictions",  destination: "http://localhost:3003/predictions" },
```

#### 4.2.2 Refactor `penyakit/page.tsx`
- **On page load**: Fetch `GET /api/predictions` to populate the table with historical disease logs from the database.
- **On file upload**: Send the image via `POST /api/predict` as `multipart/form-data`, then:
  - Show the real prediction result (disease name, confidence, probabilities).
  - Prepend the new result to the table.
- Replace the hardcoded `"Busuk Daun"` / `"98,83%"` with actual API response values.
- Display `imgUrl` from the intelligent-service's stored path.

#### 4.2.3 Add image proxy rewrite
The intelligent-service stores images in `uploads/`. Add a rewrite:
```ts
{ source: "/uploads/:path*", destination: "http://localhost:3003/uploads/:path*" },
```
And ensure FastAPI serves static files from the `uploads` directory.

---

### Phase 4.3: Activity Log Integration (command_log → Log Aktivitas page)

> **Priority: HIGH** — Currently hardcoded dummy data.

#### 4.3.1 Backend: Add `GET /api/v1/command-log` endpoint
In `analytic-service` (Go), add a new handler:
```go
// internal/handlers/command_log.go
func (h *CommandLogHandler) GetLogs(c *fiber.Ctx) error {
    deviceID := c.Query("device_id")
    // SELECT id, timestamp, device_id, actuator, command_value, source
    // FROM command_log WHERE device_id = $1 ORDER BY timestamp DESC LIMIT 100
}
```

#### 4.3.2 Register route in `main.go`
```go
commandLogHandler := handlers.NewCommandLogHandler(pool)
v1.Get("/command-log", commandLogHandler.GetLogs)
```

#### 4.3.3 Add Frontend Rewrite
```ts
{ source: "/api/command-log", destination: "http://localhost:3002/api/v1/command-log" },
```

#### 4.3.4 Refactor `log/page.tsx`
- Replace hardcoded `logsData` object with `useEffect` fetch to `/api/command-log?device_id=node1`.
- Map API response fields (`actuator`, `command_value`, `source`, `timestamp`) to the existing table columns.
- Replace `selectedId` dropdown with a `device_id` selector.

---

### Phase 4.4: Chat AI Migration (Groq → intelligent-service insights)

> **Priority: MEDIUM** — Currently works via Groq, but the insight orchestrator is far more capable (has MCP tools for live sensor data, disease logs, weather).

#### 4.4.1 Replace `/api/chat` with insights endpoint
- Remove `app/api/chat/route.ts` (Groq-based).
- Add rewrite:
  ```ts
  { source: "/api/insights", destination: "http://localhost:3003/api/v1/insights" },
  ```
- Refactor `chat/page.tsx` to `POST /api/insights` with `{ query: userMessage }`.
- Parse `InsightResponse.answer` as markdown (the orchestrator returns markdown-formatted text).

#### Why replace Groq?
The insight orchestrator already uses OpenAI with MCP tools that can query live sensor data, disease logs, and weather via the knowledge-service. It is strictly superior to a generic Groq LLM endpoint that has zero context about the greenhouse.

---

### Phase 4.5: Actuator Control Integration (ControlMenu → MQTT)

> **Priority: MEDIUM** — ControlMenu currently toggles local state only.

#### 4.5.1 Backend: Add HTTP → MQTT bridge
Create a new HTTP endpoint (in `ingestion-service` or a dedicated small service):
```
POST /api/v1/command
Body: { device_id: "node1", actuator_kind: "watering", actuator_id: "valve1", value: 1 }
```
This endpoint publishes to MQTT topic `orchid/{device_id}/command/{actuator_kind}/{actuator_id}`.

#### 4.5.2 Add Frontend Rewrite
```ts
{ source: "/api/command", destination: "http://localhost:3005/api/v1/command" },
```

#### 4.5.3 Refactor `ControlMenu.tsx`
- On toggle, `POST /api/command` with the actuator ID and desired state (0 or 1).
- Show loading spinner during the request.
- Optimistically update UI, revert on error.
- Fetch current actuator states on mount (derive from latest `command_log` entries).

---

### Phase 4.6: Real-time Data & Polish

> **Priority: LOW** — Enhancements after core integration is complete.

#### 4.6.1 DetailRekomendasi: Use Live Data
- Replace hardcoded `temp = 35, moist = 75, ph = 6.7, ec = 1.8` with actual latest telemetry.
- Either pass data from Dashboard's existing fetch, or fetch `/api/sensor` independently.

#### 4.6.2 WeatherCard: Connect to API
- Create a Next.js API route (`app/api/weather/route.ts`) that calls OpenWeatherMap server-side.
- Or use the knowledge-service's `weather_forecast` MCP tool via the insights endpoint.

#### 4.6.3 Dashboard Actuator Status: Use Live Data
- The hardcoded "Misting ON / Watering OFF" section in dashboard `page.tsx` should query the latest command state.
- Derive from the most recent `command_log` entries per actuator.

---

## 4. Final Rewrite Map (`next.config.ts`)

After all phases, the rewrite configuration should be:

```ts
async rewrites() {
  return [
    // Analytic Service (Go/Fiber) — :3002
    { source: "/api/sensor",        destination: "http://localhost:3002/api/v1/telemetry/latest" },
    { source: "/api/history",       destination: "http://localhost:3002/api/v1/telemetry/history" },
    { source: "/api/command-log",   destination: "http://localhost:3002/api/v1/command-log" },

    // Auth Service (Hono/BetterAuth) — :3001
    { source: "/api/auth/:path*",   destination: "http://localhost:3001/api/auth/:path*" },

    // Intelligent Service (FastAPI) — :3003
    { source: "/api/predict",       destination: "http://localhost:3003/predict" },
    { source: "/api/predictions",   destination: "http://localhost:3003/predictions" },
    { source: "/api/insights",      destination: "http://localhost:3003/api/v1/insights" },
    { source: "/uploads/:path*",    destination: "http://localhost:3003/uploads/:path*" },

    // Knowledge Service (Hono/MCP) — :3004
    { source: "/api/knowledge/:path*", destination: "http://localhost:3004/:path*" },

    // Command Bridge — :3005 (or same as ingestion)
    { source: "/api/command",       destination: "http://localhost:3005/api/v1/command" },
  ];
},
```

---

## 5. Environment Variables Needed

### Frontend (`.env.local`)
```env
# Existing (keep)
GROQ_API_KEY=...           # Remove after Phase 4.4
RESEND_API_KEY=...
ALERT_EMAIL_TO=...
ALERT_EMAIL_FROM=...

# New
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Backend Services (`.env` per service)
```env
# Shared
DATABASE_URL=postgresql://...@neon.tech/siapgrek

# auth-service
AUTH_PORT=3001
TRUSTED_ORIGINS=http://localhost:3000
REDIS_URL=redis://...

# analytic-service
ANALYTIC_PORT=3002

# intelligent-service
INTELLIGENT_PORT=3003
OPENAI_API_KEY=...
MCP_ENDPOINT=http://localhost:3004/mcp

# knowledge-service
KNOWLEDGE_PORT=3004
```

---

## 6. Execution Order

| Order | Phase | Effort | Blocked By |
|---|---|---|---|
| 1 | **4.1** Auth Integration | ~4 hrs | Nothing |
| 2 | **4.2** Disease Classification | ~2 hrs | Nothing |
| 3 | **4.3** Activity Log | ~2 hrs | Backend endpoint needed |
| 4 | **4.4** Chat AI Migration | ~1 hr | Nothing |
| 5 | **4.5** Actuator Control | ~3 hrs | Backend endpoint needed |
| 6 | **4.6** Real-time Polish | ~2 hrs | Phases 1-5 |

**Total estimated effort: ~14 hours**

---

## 7. Files to Create / Modify

### New Files
| File | Purpose |
|---|---|
| `frontend/lib/auth-client.ts` | Better Auth client SDK initialization |
| `frontend/middleware.ts` | Auth route protection |
| `frontend/app/api/weather/route.ts` | OpenWeatherMap server-side proxy |
| `analytic-service/internal/handlers/command_log.go` | New handler for activity log reads |

### Modified Files
| File | Changes |
|---|---|
| `frontend/next.config.ts` | Add all missing rewrites |
| `frontend/package.json` | Add `better-auth` dependency |
| `frontend/context/UserContext.tsx` | Replace localStorage with Better Auth session |
| `frontend/components/LoginForm.tsx` | Wire to `signIn.email()` |
| `frontend/components/RegisterForm.tsx` | Wire to `signUp.email()` |
| `frontend/app/(dashboard)/penyakit/page.tsx` | Real predict + predictions API |
| `frontend/app/(dashboard)/log/page.tsx` | Replace hardcoded data with API fetch |
| `frontend/app/(dashboard)/chat/page.tsx` | Switch from Groq to insights endpoint |
| `frontend/components/ControlMenu.tsx` | Add MQTT command POST |
| `frontend/components/DetailRekomendasi.tsx` | Use live sensor data |
| `frontend/components/Sidebar.tsx` | Wire logout to `signOut()` |
| `frontend/app/mobile-profile/page.tsx` | Wire logout to `signOut()` |
| `analytic-service/main.go` | Register new command-log route |
