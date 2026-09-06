# 🚨 Prakop (SAJAG) — Software Requirements Specification (SRS)

### Disaster Alert, Community Response & Virtual-IoT Emergency Platform
**24-Hour Hackathon Edition — No Physical Hardware Required · 100% Free-Tier Stack · AI-Agent Buildable**

---

**Version:** 2.0 (Modular Refactor)  
**Platform:** SAJAG / Prakop — Disaster Early-Warning, Community Response & Virtual-IoT Emergency Platform  
**Core Constraint:** No physical ESP32/LoRa hardware required. A software Device Simulator (`apps/device-sim`) generates realistic Kathmandu sensor telemetry over **dual transport**:
- **MQTT (Mosquitto)** — primary WiFi path (port 1883)
- **SimPy LoRa Gateway** — simulated LoRa fallback path (port 4002)

---

## Table of Contents
1. [Introduction](#1-introduction)
2. [System Overview & Architecture](#2-system-overview--architecture)
3. [Software Requirements](#3-software-requirements)
4. [Functional Requirements — By Module](#4-functional-requirements--by-module)
   - [4.1 Auth](#41-auth-module)
   - [4.2 Devices](#42-devices-module)
   - [4.3 Telemetry & Risk Engine](#43-telemetry--risk-engine-module)
   - [4.4 Alerts & Geofencing](#44-alerts--geofencing-module)
   - [4.5 Rescue & SOS](#45-rescue--sos-module)
   - [4.6 Shelters](#46-shelters-module)
   - [4.7 Reports](#47-reports-module)
   - [4.8 Users](#48-users-module)
   - [4.9 Files (RustFS / S3)](#49-files-rustfs--s3-module)
   - [4.10 Ads / Announcements](#410-ads--announcements-module)
   - [4.11 Simulator Proxy](#411-simulator-proxy-module)
   - [4.12 External (Twilio + Whisper)](#412-external-twilio--whisper-module)
5. [Backend Service Function Reference](#5-backend-service-function-reference)
6. [Database Schema (Prisma / Neon PostgreSQL)](#6-database-schema-prisma--neon-postgresql)
7. [Transport Layer — MQTT & LoRa](#7-transport-layer--mqtt--lora)
8. [Real-Time WebSocket Events](#8-real-time-websocket-events)
9. [REST API Endpoint Reference](#9-rest-api-endpoint-reference)
10. [Docker & Container Orchestration](#10-docker--container-orchestration)
11. [Neon.tech Serverless PostgreSQL](#11-neontech-serverless-postgresql)
12. [Environment Configuration](#12-environment-configuration)
13. [Non-Functional Requirements](#13-non-functional-requirements)
14. [Verification & Testing](#14-verification--testing)
15. [Appendix: Full Directory Tree](#15-appendix-full-directory-tree)

---

## 1. Introduction

### 1.1 Purpose
This Software Requirements Specification (SRS) defines the complete behaviour, architecture, data model, service functions, transport contracts and container orchestration for the **SAJAG / Prakop backend**, a mission-critical disaster early-warning and community response platform for the hazards of Nepal (Kathmandu Valley — Bagmati river basin, landslide corridors, seismic faultlines).

### 1.2 Scope
- **In scope:** Express API (port 4000), Virtual ESP32 simulator (port 4001), SimPy LoRa gateway (port 4002), Mosquitto MQTT broker (port 1883), Neon PostgreSQL persistence, Socket.IO real-time push, Twilio IVR, Whisper NLP, RustFS/S3 file storage, Docker orchestration.
- **Out of scope:** The two frontend applications (`sajag_admin` port 3001, `sajag_public` port 3000) which live in sibling repositories and are coordinated by `run-sajag.sh`.

### 1.3 The 10-Step Emergency Lifecycle
```
DETECT ──> ANALYZE ──> PREDICT ──> ALERT ──> LOCATE ──> REPORT ──> SOS ──> ASSIGN RESCUE ──> EVACUATE ──> RESOLVE
```

### 1.4 Key Systems (High-Level)
1. **Virtual ESP32 Simulator** — 8 Kathmandu stations (`ESP32-KTM-001` … `008`), physics-driven telemetry.
2. **Dual Transport Ingestion** — MQTT primary (WiFi) + SimPy LoRa gateway fallback.
3. **Risk & Detection Engine** — deterministic 0–100 multi-hazard scoring.
4. **Alert State Machine** — `DETECTED → CONFIRMED → NOTIFYING → WAITING_RESPONSE → {SAFE | UNSAFE | NO_RESPONSE}`.
5. **Geo-Fencing** — Haversine 5 km radius resident matching.
6. **Twilio IVR** — automated calls with DTMF (Press 1: Safe, Press 2: Record situation).
7. **Whisper STT + NLP** — transcribes victim audio, detects urgency keywords, flags severity.
8. **Real-time Command Center** — Next.js + Leaflet + Socket.IO (sibling repo).

---

## 2. System Overview & Architecture

### 2.1 Layered (Relaxed Hexagonal) Architecture
The backend is organised into **feature modules** (`modules/`) that each encapsulate a **controller (HTTP boundary)** → **service (use-case logic)** → **repository (data access / DAL)**. Cross-cutting concerns live in `shared/`. Transport adapters live in `infrastructure/transports/`. Legacy import paths are preserved via thin re-export shims.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           HTTP / WebSocket Clients                         │
│            (sajag_admin :3001, sajag_public :3000, curl, Mobile)           │
└───────────────┬──────────────────────────────┬─────────────────────────────┘
                │ HTTP REST (4000)             │ Socket.IO (4000)
                ▼                              ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                     EXPRESS APP  (apps/api/src/app.ts)                     │
│           helmet · cors · json · routing · global error handler            │
│   /api/auth · /api/devices · /api/alerts · /api/sos · /api/rescue ·        │
│   /api/shelters · /api/reports · /api/users · /api/transports ·            │
│   /api/sim · /api/files · /api/ads · /health · /docs (Swagger)             │
└───────────┬──────────────────────────────────────────────┬─────────────────┘
            │                                              │
            ▼                                              ▼
┌──────────────────────────┐              ┌──────────────────────────────────┐
│ FEATURE MODULES           │              │  TRANSPORT ADAPTERS              │
│ modules/*                 │              │  infrastructure/transports/      │
│  · controller (HTTP)      │              │  · mqtt/mqtt.subscriber.ts       │
│  · service (use-case)     │┌────────────►│    prakop/device/+/telemetry     │
│  · repository (DAL→Prisma)││             │  · lora/lora.handler.ts          │
└───────────┬───────────────┘│             │    POST /api/transports/lora     │
            ▼                │             └──────────────────────────────────┘
┌──────────────────────────┐ │
│ SHARED CROSS-CUTTING     │ │
│ shared/                  │ │
│  · database/prisma.ts    │ │
│  · websocket/socket.server.ts
│  · errors/, logging/     │ │
│  · utils/                │ │
└───────────┬──────────────┘ │
            ▼                ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                      PERSISTENCE & INTEGRATIONS                             │
│   Neon PostgreSQL (Prisma ORM)  ·  Mosquitto  ·  SimPy LoRa  ·  Twilio      │
│   Whisper  ·  RustFS/S3 Object Store  ·  device-sim simulator               │
└────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow — Telemetry Ingestion (Shared Use-Case)
Every transport funnels into a single application use-case `SensorIngestionService.ingestReading(payload, transport)`:

```text
MQTT prakop/device/{id}/telemetry ─┐
                                  ├─ transport parser ─> SensorIngestionService.ingestReading
SimPy POST /api/transports/lora ───┘                         │
                                                           ├─ Prisma Device (upsert) + SensorReading (create)
                                                           ├─ RiskEngineService.evaluate
                                                           ├─ AlertStateMachineService (if score ≥ 60, 30 s debounce)
                                                           └─ Socket.IO events (reading:new, device:status, alert:new)
```

Adapters only decode their external envelope — they never duplicate validation, persistence, risk or broadcasting.

### 2.3 Architecture Design Decisions
| Decision | Rationale |
| --- | --- |
| Feature modules w/ controller-service-repository | Satisfies SRP; HTTP, domain logic, and data access are separated (DAL). |
| Independent transport adapters | MQTT / LoRa decode envelopes only; domain evaluates pure DTOs. |
| Singleton `prisma`, `logger`, `WebSocketService` | One connection / config per process. |
| Centralised `config/env.config.ts` | Single source of truth for env + fallbacks (kills duplication in 15+ files). |
| Event-driven Socket.IO emit | decouples producers from subscribers (frontends). |

---

## 3. Software Requirements

### 3.1 AI-Agent Buildability (Buildability Requirements)
- **BR-1:** 100% free-tier stack — no paid services required to run the full simulation.
- **BR-2:** No physical ESP32/LoRa hardware — the simulated `device-sim` publishes identical telemetry so the API treats it as real.
- **BR-3:** Deterministic, side-effect-free risk calculations (`risk`, `haversine`, validation).
- **BR-4:** Backward-compatible legacy import paths — existing imports keep working after refactor.
- **BR-5:** Single-command startup via `run-sajag.sh` or `npm run sim:up`.

### 3.2 Functional Requirements (FR)
| ID | Requirement |
| --- | --- |
| FR-1 | System shall ingest telemetry over MQTT topic `prakop/device/{id}/telemetry` (QoS 1) and over HTTP LoRa ingress `POST /api/transports/lora`. |
| FR-2 | System shall compute a deterministic 0–100 multi-hazard risk score from sensor values. |
| FR-3 | System shall trigger an alert state machine automatically when risk score ≥ 60. |
| FR-4 | System shall geo-fence residents within a 5 km Haversine radius of the hazard epicentre. |
| FR-5 | System shall place automated Twilio IVR calls to geo-fenced residents (or log a mock call). |
| FR-6 | System shall capture DTMF responses (1 = SAFE, 2 = UNSAFE) and store them. |
| FR-7 | System shall transcribe recorded voice messages (Whisper) and classify urgency. |
| FR-8 | System shall maintain an SOS distress queue and assign the nearest available rescue team. |
| FR-9 | System shall expose nearest-shelter lookup with available-bed capacity. |
| FR-10 | System shall let citizens submit incident reports with up to 5 photos (RustFS). |
| FR-11 | System shall manage public announcements/ads with impression & click analytics. |
| FR-12 | System shall proxy control commands to the virtual simulator (scenario & network-mode). |
| FR-13 | System shall authenticate users with JWT (bcrypt hashing). |
| FR-14 | System shall broadcast all real-time events over Socket.IO. |
| FR-15 | System shall expose Swagger at `/docs` and machine-readable OpenAPI at `/openapi.json`. |

### 3.3 Non-Functional Requirements (NFR)
| ID | Requirement |
| --- | --- |
| NFR-1 | **Availability:** loco-standalone; every service runs as a Docker container. |
| NFR-2 | **Security:** helmet headers, CORS allow-list, JWT auth, masked passwords, secrets only via env. |
| NFR-3 | **Performance:** risk evaluation is O(1); geofencing is O(users); local simulation under 2 s detection. |
| NFR-4 | **Maintainability:** layered modules, single source of truth for config & DB client. |
| NFR-5 | **Testability:** pure functions (risk, haversine, parsers) side-effect-free and unit-testable. |
| NFR-6 | **Observability:** Pino structured logs; `/health`; `/api/transports/status`. |

---

## 4. Functional Requirements — By Module

Feature modules live under `apps/api/src/modules/<feature>/`. Each has up to four files:
- `<feature>.routes.ts` — Express `Router` (HTTP boundary)
- `<feature>.controller.ts` — translates HTTP ⇄ service
- `<feature>.service.ts` — application use-case business logic
- `<feature>.repository.ts` — Prisma data-access layer (DAL)

### 4.1 Auth Module
**Path:** `modules/auth/`
**Files:** `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`

**Responsibilities:** registration, login, bcrypt hashing, JWT signing, role/municipality attribution.

| Concern | Detail |
| --- | --- |
| Registration | Validates email uniqueness, finds default municipality, bcrypt-hashes password (cost 10), creates user, issues JWT. |
| Login | Verifies credentials, returns JWT + user profile. |
| Token | Signed with config `jwtSecret`, expiry `jwtExpiresIn` (default 7d); payload `{id, email, role, municipalityId}`. |
| Roles | `CITIZEN \| RESPONDER \| RESCUE_TEAM \| AUTHORITY \| ADMIN`. |

### 4.2 Devices Module
**Path:** `modules/devices/`
**Files:** `devices.routes.ts`, `devices.controller.ts`, `devices.service.ts`, `devices.repository.ts`

**Responsibilities:** station list, station details, live/latest sensor readings.

| Service function | Behaviour |
| --- | --- |
| `getAllDevices()` | Returns all stations, each with its latest reading. |
| `getDeviceById(id)` | Returns station + latest 20 readings; 404 if missing. |
| `getDeviceReadings(id, limit=50)` | Returns latest N sensor readings for a device. |

### 4.3 Telemetry & Risk Engine Module
**Path:** `modules/telemetry/`
**Files:** `telemetry.routes.ts`, `telemetry.controller.ts`, `ingestion.service.ts`, `risk.service.ts`

**Responsibilities:** unified sensor ingestion pipeline; deterministic risk engine.

#### `SensorIngestionService.ingestReading(payload, transport)`
The single telemetry application use-case shared by MQTT and LoRa:
1. Validate payload via Zod (`telemetryPayloadSchema`).
2. Upsert municipality (auto-created in simulation mode).
3. Upsert `Device` (sets status ONLINE, transport, lastHeartbeat).
4. Create append-only `SensorReading`.
5. Emit `reading:new` + `device:status` over Socket.IO.
6. Evaluate risk via `RiskEngineService`.
7. If alert required (score ≥ 60) and outside the 30 s debounce, trigger `alertStateMachine.triggerDisasterAlert(...)`.

#### `RiskEngineService.evaluate(sensors)` — the 0–100 engine
Per-sensor sub-scores clamped to [0,100]:
```
earthquakeScore = clamp( ((accel - 0.15) / 1.85) * 100 )
waterScore      = clamp( ((waterLevel - 20) / 70)   * 100 )
soilScore       = clamp( ((soilMoisture - 30) / 60) * 100 )
rainfallScore   = clamp( (rainfall / 75) * 100 )
```
Weighted composite baseline (per SRS):
```
weightedBaseline = 0.30*quake + 0.25*rainfall + 0.20*soil + 0.25*water
```
An **acute dominant-hazard floor** ensures one dangerous sensor isn't diluted:
```
dominant = max( quake,
                water*0.7 + rainfall*0.3,
                soil*0.6  + rainfall*0.4 )
overall  = max(weightedBaseline, dominant)
```
Severity mapping & disaster-type inference:
| Overall score | Severity | Alert |
| --- | --- | --- |
| ≥ 80 | CRITICAL | triggers |
| 60–79 | HIGH | triggers |
| 30–59 | MODERATE | no |
| < 30 | LOW | no |

Primary disaster type: `EARTHQUAKE`/`FLOOD`/`LANDSLIDE` from max sub-score ≥ 40, else `STORM` if rainfall ≥ 50, else `OTHER`.

### 4.4 Alerts & Geofencing Module
**Path:** `modules/alerts/`
**Files:** `alerts.routes.ts`, `alerts.controller.ts`, `alert.service.ts`, `alerts.repository.ts`, `geofence.service.ts`

#### `AlertStateMachineService.triggerDisasterAlert(...)`
1. Create `DisasterEvent` with status `DETECTED`.
2. Emit `alert:new`.
3. Mark event `CONFIRMED`.
4. `geofenceService.findUsersInRadius(lat, lon, 5000)` finds nearby citizens (role CITIZEN).
5. For each citizen: create `Alert` (status `NOTIFYING`, attempts 1), call Twilio, set `WAITING_RESPONSE`, emit `alert:update`.

#### `AlertStateMachineService.handleUserResponse({alertId, response, voiceTranscript?})`
1. Look up the alert (incl. user + event).
2. If response is `UNSAFE` with a voice transcript, run `whisperNlpService.classifyUrgency` → `urgency`.
3. Create `UserResponse` (`SAFE`/`UNSAFE`, message, urgency).
4. Update `Alert.status` → SAFE/UNSAFE; update `User.status`.
5. Emit `response:new` + `alert:update`.

#### `GeofenceService.findUsersInRadius(lat, lng, radiusMeters=5000)`
- Iterates all CITIZEN users, computes Haversine distance, keeps those ≤ radius, sorts ascending, returns with `distanceMeters`.

### 4.5 Rescue & SOS Module
**Path:** `modules/rescue/`
**Files:** `sos.routes.ts`, `sos.controller.ts`, `rescue.routes.ts`, `rescue.controller.ts`, `rescue.service.ts`, `rescue.repository.ts`

#### `RescueService.findNearestAvailableTeams(lat, lng, limit=5)`
- Fetches `AVAILABLE` teams, computes Haversine distance, returns nearest N with `distanceMeters`.

#### `RescueService.assignTeamToSOS(sosId, teamId)`
- Sets SOS status `ASSIGNED` with `assignedTeamId`; marks team `DISPATCHED`.

SOS statuses: `PENDING | ACKNOWLEDGED | ASSIGNED | IN_PROGRESS | RESOLVED | CANCELLED`.
Team types: `ARMY | POLICE | RED_CROSS | FIRE_DEPARTMENT | LOCAL_VOLUNTEER`.

### 4.6 Shelters Module
**Path:** `modules/shelters/`
**Files:** `shelters.routes.ts`, `shelters.controller.ts`, `shelter.service.ts`, `shelters.repository.ts`

#### `ShelterService.findNearestShelters(lat, lng, limit=5)`
- Fetches active shelters, computes Haversine distance and `availableBeds = totalCapacity - currentOccupancy`, filters beds > 0, sorts by distance, returns nearest N.

### 4.7 Reports Module
**Path:** `modules/reports/`
**Files:** `reports.routes.ts`, `reports.controller.ts`, `reports.repository.ts`

**Responsibilities:** citizen field observations with up to 5 photos (stored RustFS), verification workflow.

Report statuses: `SUBMITTED | UNDER_REVIEW | VERIFIED | REJECTED | RESOLVED`.

### 4.8 Users Module
**Path:** `modules/users/`
**Files:** `users.routes.ts`, `users.controller.ts`, `users.service.ts`, `users.repository.ts`

#### `UsersService.getUserRosterAndTally()`
- Returns all users and a status tally: counts of `SAFE`, `UNSAFE`, `NO_RESPONSE`, `UNKNOWN`, and `total`.

### 4.9 Files (RustFS / S3) Module
**Path:** `modules/files/`
**Files:** `files.routes.ts`, `files.controller.ts`, `storage.service.ts`

#### `StorageService` (S3-compatible, `forcePathStyle`)
| Method | Behaviour |
| --- | --- |
| `uploadFile(file, folder)` | Uploads a multer file, returns `{key,url,originalName,size,mimeType}`; auto-creates bucket. |
| `uploadBuffer(buffer, key, mime)` | Uploads a raw buffer. |
| `getFileStream(key)` | Streams an object for download. |
| `getPresignedDownloadUrl(key, expires=3600)` | Generates a time-limited AWS SigV4 pre-signed GET URL. |
| `deleteFile(key)` | Deletes an object. |
| `listFiles(prefix?)` | Lists objects. |

Endpoint is `RUSTFS_ENDPOINT` (default `http://rustfs:9000`), bucket `RUSTFS_BUCKET` (default `sajag-files`), fallback creds `rustfsadmin`.

### 4.10 Ads / Announcements Module
**Path:** `modules/ads/`
**Files:** `ads.routes.ts`, `ads.controller.ts`, `ads.repository.ts`

**Responsibilities:** public announcements/banners, impression & click analytics.

| Service / Repository method | Behaviour |
| --- | --- |
| `findActiveAds(where)` | Active ads ordered by priority desc then createdAt desc. |
| `incrementImpressions(ids)` | Increments `impressions` (fire-and-forget). |
| `findAllAds()` + CTR | Admin view computes `ctr = clicks/impressions*100`. |
| `createAd(...)` | Requires an image (file → RustFS, or `imageUrl`). |
| `incrementClicks(id)` | Increments `clicks`, returns updated count + targetUrl. |
| `updateAd / deleteAd` | Edit / remove; delete also removes RustFS asset when stored via `/api/files/`. |

Categories: `PSA | EMERGENCY_NOTICE | SPONSOR | AWARENESS`. Placements: `CITIZEN_BANNER | DASHBOARD_TOP | POPUP_ALERT`.

### 4.11 Simulator Proxy Module
**Path:** `modules/sim/`
**Files:** `sim.routes.ts`, `sim.controller.ts`, `sim.service.ts`

**Responsibilities:** `SimProxyService` forwards control commands to the virtual ESP32 simulator (`SIMULATOR_URL`, default `http://device-sim:4001`).

| Method | Forwards to |
| --- | --- |
| `triggerScenario(body)` | `POST {sim}/simulate/scenario` — inject a disaster curve. |
| `setNetworkMode(body)` | `POST {sim}/simulate/network-mode` — toggle WiFi/LoRa. |
| `getDevices()` | `GET {sim}/devices` — list simulated stations. |

### 4.12 External (Twilio + Whisper) Module
**Path:** `modules/external/`
**Files:** `twilio.service.ts`, `whisper.service.ts`

#### Twilio IVR — `TwilioCallService`
Initialises the Twilio client **only** when `TWILIO_ACCOUNT_SID` starts with `AC` **and** a token is present; otherwise operates in **mock IVR mode** (logs `[MOCK-TWILIO-IVR]` and returns a `mock-call-{ts}` SID).

| Method | Behaviour |
| --- | --- |
| `placeEmergencyCall(alertId, phone, name)` | `client.calls.create({to, from, url})` where `url = {PUBLIC_API_URL}/api/alerts/{alertId}/twiml`. Returns call SID. |
| `generateGatherTwiml(alertId)` | `<Gather numDigits="1">` — "Press 1 safe, press 2 assistance"; posts to `/api/alerts/{id}/response`. |
| `generateRecordTwiml(alertId)` | `<Record maxLength="5">` — records a 5 s voice distress message; posts to `/api/alerts/{id}/voice-upload`. |

#### Whisper STT + NLP — `WhisperNlpService`
| Method | Behaviour |
| --- | --- |
| `classifyUrgency(text)` | Keyword scoring. Weights: `trapped/debris/collapsed/bleeding=4`, `injured/stuck/fire=3`, `help/water/rising/smoke/emergency=2`. Score ≥6 → CRITICAL, ≥4 → HIGH, ≥2 → MEDIUM, else LOW. |
| `transcribeAudio(audio)` | Current implementation is a **stub** returning a canned transcript (`"I'm trapped under debris..."`) so the flow works without a local Whisper binary; `WHISPER_MODEL`/`WHISPER_BINARY_PATH` kept in env for later integration. |

**Whisper flow (end-to-end):** Twilio DTMF press 2 → `generateRecordTwiml` records → Twilio POSTs `RecordingUrl` to `/api/alerts/{id}/voice-upload` → `handleVoiceUpload` calls `transcribeAudio` → `handleUserResponse(response='UNSAFE', voiceTranscript)` → `classifyUrgency` assigns urgency → persisted to `UserResponse` and pushed live to the command center.

---

## 5. Backend Service Function Reference

Each entry: **class.method → purpose** → **file:line**.

### 5.1 `modules/auth/auth.service.ts`
| Function | Purpose |
| --- | --- |
| `AuthService.register(data)` | bcrypt-hash password, create user, sign JWT. |
| `AuthService.login({email,password})` | verify credentials, sign JWT. |

### 5.2 `modules/devices/devices.service.ts`
| Function | Purpose |
| --- | --- |
| `DevicesService.getAllDevices()` | stations + latest reading. |
| `DevicesService.getDeviceById(id)` | station + 20 readings (404 if absent). |
| `DevicesService.getDeviceReadings(id, limit)` | latest readings. |

### 5.3 `modules/telemetry/`
| Function | Purpose |
| --- | --- |
| `SensorIngestionService.ingestReading(payload, transport)` | unified ingestion use-case (validation, device/reading persistence, risk, alert, websocket). |
| `RiskEngineService.evaluate(sensors)` | pure 0–100 multi-hazard score, severity, disaster type. |
| `TelemetryController.getStatus()` | reports transport status (MQTT topics, LoRa ingress, simulation). |
| `TelemetryController.handleLoRaIngress(req,res)` | delegates to `LoRaTransportHandler`. |

### 5.4 `modules/alerts/`
| Function | Purpose |
| --- | --- |
| `AlertStateMachineService.triggerDisasterAlert(params)` | create event, geo-fence, IVR, alert per citizen. |
| `AlertStateMachineService.handleUserResponse(params)` | persist response, Whisper urgency, update statuses, emit. |
| `GeofenceService.findUsersInRadius(lat,lng,radius)` | Haversine resident match. |
| `AlertsController.getTwiml / handleUserResponse / handleVoiceUpload` | Twilio TwiML + DTMF + recording endpoints. |

### 5.5 `modules/rescue/`
| Function | Purpose |
| --- | --- |
| `RescueService.findNearestAvailableTeams(lat,lng,limit)` | nearest available teams by distance. |
| `RescueService.assignTeamToSOS(sosId,teamId)` | assign team + mark dispatched. |
| `SosController.createSOS / getAllSOS / getActiveSOS / updateSOSStatus / assignTeam` | SOS queue operations. |

### 5.6 `modules/shelters/`
| Function | Purpose |
| --- | --- |
| `ShelterService.findNearestShelters(lat,lng,limit)` | nearest shelters with available beds. |

### 5.7 `modules/users/`
| Function | Purpose |
| --- | --- |
| `UsersService.getUserRosterAndTally()` | roster + SAFE/UNSAFE/NO_RESPONSE/UNKNOWN tally. |

### 5.8 `modules/files/`
| Function | Purpose |
| --- | --- |
| `StorageService.uploadFile / uploadBuffer / getFileStream / getPresignedDownloadUrl / deleteFile / listFiles` | RustFS/S3 CRUD + pre-signed URLs. |

### 5.9 `modules/ads/`
| Function | Purpose |
| --- | --- |
| `AdsController.getPublicAds / getAdminAds / getAdById / createAd / recordClick / updateAd / deleteAd` | announcement CRUD + analytics. |

### 5.10 `modules/sim/`
| Function | Purpose |
| --- | --- |
| `SimProxyService.triggerScenario / setNetworkMode / getDevices` | proxy to virtual simulator. |

### 5.11 `modules/external/`
| Function | Purpose |
| --- | --- |
| `TwilioCallService.placeEmergencyCall / generateGatherTwiml / generateRecordTwiml` | IVR call + DTMF + recording. |
| `WhisperNlpService.transcribeAudio / classifyUrgency` | STT + urgency NLP. |

### 5.12 `shared/` cross-cutting
| Function | Purpose |
| --- | --- |
| `WebSocketService.getInstance().init(server, origins)` | boots Socket.IO with CORS & room support. |
| `WebSocketService.emit(event,payload,room?)` | broadcast to room or all. |
| `calculateHaversineDistance(a,b,c,d)` | great-circle distance in metres. |
| `logger` (Pino singleton), `prisma` (Prisma singleton) | logging + DB. |

---

## 6. Database Schema (Prisma / Neon PostgreSQL)

PostgreSQL provider via `apps/api/prisma/schema.prisma`. **12 models.** All ID fields use `cuid()`.

| Model | Purpose | Key fields |
| --- | --- | --- |
| `Municipality` | Geographic tenant | name; owns users/devices/shelters/rescueTeams |
| `User` | Resident/authority | name, email (unique), passwordHash, phone, role, lat/lng, status |
| `Device` | Long-lived station identity | deviceId (unique), name, lat/lng, status, transport, lastHeartbeat |
| `SensorReading` | Append-only telemetry | accel, waterLevel, soilMoisture, rainfall, transport, timestamp |
| `DisasterEvent` | Risk incident | type, riskScore, severity, lat/lng, radiusMeters, status, isSimulation |
| `Alert` | Per-resident notification | status, attempts |
| `UserResponse` | SAFE/UNSAFE + voice triage | response, message, urgency |
| `SOSRequest` | Distress case | lat/lng, description, numberOfPeople, medicalEmergency, status, contactNumber, assignedTeam |
| `RescueTeam` | Responder unit | teamType, status, lat/lng, capacity, leadOfficerName |
| `Shelter` | Evacuation destination | totalCapacity, currentOccupancy, amenities flags |
| `CitizenReport` | Field observation | disasterType, lat/lng, description, mediaUrls, status |
| `Advertisement` | Announcement/banner | category, placement, priority, impressions, clicks |

> **Note:** State fields are stored as strings for migration compatibility. Canonical values live in `packages/types`; production hardening should migrate to Prisma enums in one migration.

The `schema.sqlite.prisma` variant exists for offline SQLite development (minus `Advertisement`).

---

## 7. Transport Layer — MQTT & LoRa

### 7.1 MQTT (WiFi primary path)
File: `infrastructure/transports/mqtt/mqtt.subscriber.ts` (+ parser `mqtt.telemetry.parser.ts`).

| Topic | QoS | Direction | Purpose |
| --- | --- | --- | --- |
| `prakop/device/{id}/telemetry` | 1 | device → API | primary telemetry |
| `prakop/device/{id}/heartbeat` | 0 | device → API | legacy alias |
| `prakop/device/{id}/status` | 0 | device → API | device status/heartbeat |

The parser validates the 4-part topic, JSON-decodes, runs `telemetryPayloadSchema`, and enforces **topic deviceId === payload deviceId**.

### 7.2 LoRa (fallback path)
Files: `infrastructure/transports/lora/lora.handler.ts`, `lora.telemetry.parser.ts`.

- Ingress endpoint: `POST /api/transports/lora` (simulation-only → 404 otherwise).
- Requires header `x-gateway-token` matching `LORA_GATEWAY_TOKEN` (else 401).
- Accepts either a raw telemetry object or a `{payload: {...}}` envelope.
- The SimPy gateway (`infrastructure/lora-sim/gateway.py`) models a single radio channel (SF7/BW125, 32-byte frames, airtime + collision/loss) and forwards received frames to the API with the gateway token.
- Configurable `LORA_LOSS_RATE` (0–1).

### 7.3 Device Simulator (`apps/device-sim`, port 4001)
- 8 Kathmandu stations (`ESP32-KTM-001`…`008`).
- `mqtt.client.ts`: publishes to `prakop/device/{id}/telemetry`.
- `lora.client.ts`: POSTs to `{LORA_SIM_URL}/transmit`.
- `scenario.manager.ts` & `generator.ts`: scripted disaster curves + physics.
- Exposes `/health`, `/devices`, `/simulate/scenario`, `/simulate/network-mode`.

---

## 8. Real-Time WebSocket Events

`WebSocketService.emit(event, payload, room?)` broadcasts to all (or a room). Client-side room control: emit `join:room` / `leave:room`.

| Event | Emitted when |
| --- | --- |
| `reading:new` | a new sensor reading is persisted |
| `device:status` | a device status/transport changes |
| `alert:new` | a disaster event is created |
| `alert:update` | an alert status changes (NOTIFYING → WAITING_RESPONSE → SAFE/UNSAFE) |
| `response:new` | a citizen responds (SAFE/UNSAFE + urgency) |
| `sos:new`, `sos:update` | SOS created / status or assignment changed |
| `report:new` | a citizen report is submitted |

---

## 9. REST API Endpoint Reference

All HTTP endpoints are mounted in `apps/api/src/app.ts`. Response envelope: `{ success: boolean, data?, message? }`.

| Method | Path | Module | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | — | health check |
| GET | `/openapi.json` | — | machine-readable OpenAPI |
| GET | `/docs` | — | Swagger UI |
| POST | `/api/auth/register` | auth | register + JWT |
| POST | `/api/auth/login` | auth | login + JWT |
| GET | `/api/devices` | devices | all stations + latest reading |
| GET | `/api/devices/:id` | devices | station + latest 20 readings |
| GET | `/api/devices/:id/readings` | devices | recent readings (limit) |
| GET | `/api/alerts` | alerts | recent disaster events (20) |
| GET | `/api/alerts/active` | alerts | active events |
| GET | `/api/alerts/:id/twiml` | alerts | Twilio gather TwiML |
| POST | `/api/alerts/:id/response` | alerts | citizen DTMF/JSON response |
| POST | `/api/alerts/:id/voice-upload` | alerts | recording → Whisper → UNSAFE |
| GET | `/api/sos` | rescue | all SOS |
| POST | `/api/sos` | rescue | create SOS |
| GET | `/api/sos/active` | rescue | active SOS |
| PATCH | `/api/sos/:id/status` | rescue | update SOS status |
| POST | `/api/sos/:id/assign` | rescue | assign rescue team |
| GET | `/api/rescue/teams` | rescue | list rescue teams |
| GET | `/api/rescue/nearest` | rescue | nearest available teams |
| GET | `/api/shelters` | shelters | all shelters |
| GET | `/api/shelters/nearest` | shelters | nearest shelters (beds>0) |
| POST | `/api/reports` | reports | submit report (≤5 photos) |
| GET | `/api/reports` | reports | list reports |
| PATCH | `/api/reports/:id/verify` | reports | verify/reject report |
| GET | `/api/users` | users | roster + status tally |
| GET | `/api/transports/status` | telemetry | transport status |
| POST | `/api/transports/lora` | telemetry | LoRa ingress |
| POST | `/api/sim/scenario` | sim | trigger disaster scenario |
| POST | `/api/sim/network-mode` | sim | toggle WiFi/LoRa |
| GET | `/api/sim/devices` | sim | simulator device list |
| POST | `/api/files/upload` | files | upload single file |
| POST | `/api/files/upload-multiple` | files | upload up to 10 files |
| GET | `/api/files/:folder/:filename` | files | download file |
| GET | `/api/files/signed-url/:folder/:filename` | files | pre-signed URL |
| DELETE | `/api/files/:folder/:filename` | files | delete file |
| GET | `/api/ads` | ads | active ads (increments impressions) |
| GET | `/api/ads/admin` | ads | all ads + CTR |
| GET | `/api/ads/:id` | ads | ad by id |
| POST | `/api/ads` | ads | create ad (+ optional image upload) |
| POST | `/api/ads/:id/click` | ads | record click |
| PATCH | `/api/ads/:id` | ads | update ad |
| DELETE | `/api/ads/:id` | ads | delete ad |

---

## 10. Docker & Container Orchestration

### 10.1 Concepts
The backend ships as a **single multi-service image** (`sajag-backend:production`) built from `infrastructure/Dockerfile` (also duplicated at `infrastructure/docker/Dockerfile` — identical). The same image is reused for the `api`, `lora-sim`, and `device-sim` services (each with a different `command`). Mosquitto and PostgreSQL pull their own official images.

### 10.2 Dockerfile (`infrastructure/Dockerfile`)
```dockerfile
FROM node:22-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl python3 python3-venv \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package.json package-lock.json ./
COPY infrastructure/lora-sim/requirements.txt ./infrastructure/lora-sim/requirements.txt
RUN npm ci && python3 -m venv /opt/lora-venv \
    && /opt/lora-venv/bin/pip install --no-cache-dir -r infrastructure/lora-sim/requirements.txt
COPY tsconfig.base.json ./
COPY packages ./packages
COPY apps/api ./apps/api
COPY apps/device-sim ./apps/device-sim
COPY tests ./tests
COPY infrastructure/lora-sim ./infrastructure/lora-sim
RUN npm run build && npm run db:generate
ENV PATH="/opt/lora-venv/bin:${PATH}"
EXPOSE 4000 4001 4002
USER node
CMD ["node", "apps/api/dist/index.js"]
```
- Multi-stage build compiles the whole monorepo via `npm run build`.
- Installs a Python venv with `simpy==4.1.1` so the LoRa gateway can run inside the same image.
- `npm run db:generate` produces the Prisma client.
- The build produces `apps/api/dist/index.js`, `apps/device-sim/dist/index.js`, and the venv `gateway.py`.

### 10.3 Compose File (`infrastructure/compose.simulation.yml`, project `sajag-simulation`)
Also duplicated identically at `infrastructure/compose/compose.simulation.yml`. Five services:

| Service | Image | Ports | Command | Health / Depends |
| --- | --- | --- | --- | --- |
| `postgres` | `postgres:16-alpine` | internal only | default | `pg_isready` health; volume `simulation_db` |
| `mosquitto` | `eclipse-mosquitto:2.0` | `${MQTT_PORT:-1883}:1883` | default | `mosquitto_pub` health; mounts `./mosquitto/mosquitto.conf` |
| `api` | `sajag-backend:production` | `${API_PORT:-4000}:4000` | `sh -c "npm run db:push && exec node apps/api/dist/index.js"` | depends on postgres+mosquitto healthy; HTTP `/health` health |
| `lora-sim` | `sajag-backend:production` | `${LORA_PORT:-4002}:4002` | `python3 -u infrastructure/lora-sim/gateway.py` | depends on api healthy; `/health` health |
| `device-sim` | `sajag-backend:production` | `${SIMULATOR_PORT:-4001}:4001` | `node apps/device-sim/dist/index.js` | depends on lora-sim healthy; `/health` health |

**Environment overrides in compose:**
- `api`: `DATABASE_URL=postgresql://sajag:simulation@postgres:5432/sajag_simulation`, `MQTT_URL=mqtt://mosquitto:1883`, `SIMULATOR_URL=http://device-sim:4001`, `SIMULATION_MODE=true`, `LORA_GATEWAY_TOKEN`.
- `lora-sim`: `API_URL=http://api:4000`, `LORA_GATEWAY_TOKEN`, `LORA_LOSS_RATE` (default 0).
- `device-sim`: `MQTT_URL=mqtt://mosquitto:1883`, `LORA_SIM_URL=http://lora-sim:4002`.

All services read `env_file: ../.env` as a base, with targeted overrides.

### 10.4 `infrastructure/mosquitto/mosquitto.conf`
```
listener 1883 0.0.0.0
allow_anonymous true
persistence true
persistence_location /mosquitto/data/
log_dest stdout
```

### 10.5 Port Map
| Port | Service | Purpose |
| --- | --- | --- |
| 1883 | mosquitto | MQTT broker (WiFi telemetry) |
| 4000 | api | REST + Socket.IO + Swagger |
| 4001 | device-sim | virtual ESP32 simulator control |
| 4002 | lora-sim | SimPy LoRa gateway ingress |
| 3001 | sajag_admin (sibling) | municipal command center |
| 3000 | sajag_public (sibling) | citizen PWA |

### 10.6 Starting the stack
```bash
# Option A — entire platform (frontends + backend docker services)
cd /home/udesh/Hackathon/LORA_DISASTER
./run-sajag.sh                # add --no-build to reuse an existing image

# Option B — Docker services only
cd sajag_backend
npm run sim:up                # docker compose up -d --build --wait
npm run sim:logs              # tail logs
npm run sim:test              # run the smoke test
npm run sim:down              # stop (DB volume preserved)
```

### 10.7 `.dockerignore`
Excludes `node_modules`, `dist`, `.next`, `.env*`, `*.db`, `__pycache__`, `.git` — keeping the build context lean and avoiding secret leakage.

---

## 11. Neon.tech Serverless PostgreSQL

The platform's canonical production database is **Neon.tech** (serverless, auto-scaling Postgres). Project metadata lives in `.neon` (org `org-misty-resonance-34152520`, project `twilight-wave-23452032`, branch `production`).

- Connection is via Prisma `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }`.
- Set `DATABASE_URL` in `.env` to a Neon pooled connection string, e.g.:
  ```
  DATABASE_URL=postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/sajag_simulation?sslmode=require
  ```
- Run schema sync: `npm run db:push` (or `npx prisma migrate dev` for versioned migrations).
- Seed Kathmandu Valley demo data: `npm run db:seed`.
- **Local Docker fallback:** the compose stack uses a `postgres:16-alpine` container bound to the same `sajag_simulation` DB name so the same code targets either Neon or local Postgres by just changing `DATABASE_URL`.
- The Prisma client is generated with `npm run db:generate`.

---

## 12. Environment Configuration

All variables are centralised and type-safely parsed in `apps/api/src/config/env.config.ts`.

| Variable | Purpose | Default |
| --- | --- | --- |
| `NODE_ENV` | runtime env | `development` |
| `PORT` | API port | `4000` |
| `LOG_LEVEL` | Pino log level | `info` |
| `CORS_ORIGIN` | comma-separated allow-list | `http://localhost:3000,http://localhost:3001` |
| `JWT_SECRET` | JWT signing secret | dev fallback |
| `JWT_EXPIRES_IN` | token expiry | `7d` |
| `MQTT_URL` | broker URL | `mqtt://localhost:1883` |
| `SIMULATOR_URL` | device-sim base | `http://localhost:4001` |
| `SIMULATION_MODE` | enable auto-create municipality & LoRa | `false` |
| `LORA_GATEWAY_TOKEN` | LoRa ingress auth token | local fallback |
| `DATABASE_URL` | Neon/local Postgres DSN | (required) |
| `PUBLIC_API_URL` | externally reachable API URL (Twilio callback) | `http://localhost:4000` |
| `TWILIO_ACCOUNT_SID / AUTH_TOKEN / PHONE_NUMBER` | Twilio IVR credentials | empty → mock mode |
| `WHISPER_MODEL / WHISPER_BINARY_PATH` | Whisper STT config | `tiny` / `whisper` |
| `RUSTFS_ENDPOINT / BUCKET / ACCESS_KEY / SECRET_KEY / REGION` | RustFS/S3 storage | `http://rustfs:9000` / `sajag-files` / `rustfsadmin` / `us-east-1` |

---

## 13. Non-Functional Requirements (expanded)

### 13.1 Security
- `helmet` headers (CSP disabled for Swagger/UI compatibility).
- CORS allow-list from env (`credentials: true`).
- Passwords bcrypt-hashed (cost 10); never logged.
- JWT auth middleware (`authenticateJwt`, `requireRole`) available for route guard.
- LoRa ingress gated by `x-gateway-token` + simulation-mode check.
- Secrets only via env; `.env*` excluded from Docker build.

### 13.2 Reliability
- MQTT subscriber has a 3 s connection fallback (continues in background so the API boots even if the broker is slow).
- 30 s alert debounce prevents storm-spamming during sustained crises.
- Mock Twilio mode guarantees end-to-end demo without paid credentials.

### 13.3 Observability & Debugging
- Pino structured logs (mid-trace transport/device IDs).
- `/health`, `/openapi.json`, `/api/transports/status`.
- Live debugging path: `/health` → `/openapi.json` → `/api/transports/status` → MQTT subscription → latest `SensorReading`.

---

## 14. Verification & Testing

### 14.1 Codebase Integrity
- 92 TypeScript files, 134 relative imports — all resolve; 0 missing paths / type errors.
- Build: `npm run build` (packages → api → sim) with `prisma generate`.

### 14.2 Contract Guarantees (100% preserved across refactor)
- REST API paths and response shapes.
- MQTT topics (`prakop/device/+/telemetry`, `+/status`, `+/heartbeat`).
- Socket.IO event names.
- Prisma database schema.
- Frontend contracts.

### 14.3 Automated Smoke Test
`tests/simulation-smoke.cjs` verifies end-to-end delivery:
```bash
npm run sim:test
```

### 14.4 LoRa Gateway Unit Test
```bash
# from infrastructure/lora-sim
python3 test_radio.py
```

---

## 15. Appendix: Full Directory Tree

```
sajag_backend/
├── .dockerignore
├── .env                          # master env contract (DATABASE_URL, Twilio, RustFS, JWT)
├── .gitignore
├── .neon                         # Neon.tech project config (org/project/branch)
├── .vscode/settings.json
├── BACKEND_STRUCTURE_FLOW.md
├── README.md
├── package.json                  # npm workspaces root (apps/*, packages/*) + scripts
├── package-lock.json
├── tsconfig.base.json            # shared compiler options
│
├── apps/
│   ├── api/
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # PostgreSQL schema (12 models)
│   │   │   ├── schema.sqlite.prisma  # offline SQLite variant
│   │   │   └── seed.ts               # Kathmandu Valley seeder (8 devices, 30 residents, 4 shelters, 4 teams)
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── app.ts                # Express composition: helmet, cors, routers, socket, error handler
│   │       ├── index.ts              # entrypoint: MQTT subscriber + HTTP/WS listen
│   │       ├── openapi.ts            # Swagger/OpenAPI contract (x-mqtt, x-lora extensions)
│   │       ├── config/
│   │       │   └── env.config.ts     # type-safe env parsing (single source of truth)
│   │       ├── db/prisma.ts          # shim → shared/database/prisma
│   │       ├── middleware/           # auth.middleware, error.middleware (shims)
│   │       ├── modules/              # ★ FEATURE MODULES
│   │       │   ├── auth/             # register/login, bcrypt, JWT
│   │       │   ├── devices/          # station list/detail/readings
│   │       │   ├── telemetry/        # ingestion + risk engine + transports status
│   │       │   ├── alerts/           # state machine + geofence
│   │       │   ├── rescue/           # SOS queue + rescue teams
│   │       │   ├── shelters/         # safe haven lookup
│   │       │   ├── reports/          # citizen field reports
│   │       │   ├── users/            # roster + tally
│   │       │   ├── files/            # RustFS/S3 storage + pre-signed URLs
│   │       │   ├── ads/              # announcements + analytics
│   │       │   ├── sim/              # simulator proxy
│   │       │   └── external/         # twilio + whisper services
│   │       ├── infrastructure/
│   │       │   ├── mqtt/             # shim → transports/mqtt
│   │       │   └── transports/
│   │       │       ├── mqtt/         # MqttSubscriber + parser
│   │       │       └── lora/         # LoRaTransportHandler + parser
│   │       ├── routes/               # legacy re-export shims (backward compat)
│   │       ├── services/             # legacy re-export shims
│   │       ├── shared/               # ★ SHARED CROSS-CUTTING
│   │       │   ├── database/prisma.ts
│   │       │   ├── errors/           # AppError + global error middleware
│   │       │   ├── logging/logger.ts # Pino singleton
│   │       │   ├── utils/            # haversine, request-parsers
│   │       │   └── websocket/socket.server.ts
│   │       ├── transports/           # legacy shims
│   │       ├── utils/                # legacy shims
│   │       └── websocket/            # legacy shim
│   │
│   └── device-sim/                   # Virtual ESP32 Simulator (port 4001)
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts              # HTTP server + scenario injection
│           ├── devices.ts            # 8 Kathmandu stations
│           ├── generator.ts          # physics engine
│           ├── mqtt.client.ts        # MQTT publisher
│           ├── lora.client.ts        # LoRa HTTP gateway client
│           └── scenarios/            # scripted disaster curves
│
├── docs/
│   ├── backend-architecture.md      # SRS traceability + debug index
│   ├── live-simulation.md           # IoT MQTT Panel + LoRa walkthrough
│   ├── prakop_srs_hackathon.md      # ★ THIS SRS
│   └── sajag_system_architecture.md # phase-1 blueprint
│
├── infrastructure/
│   ├── Dockerfile                  # single multi-stage node+python image
│   ├── compose.simulation.yml      # 5-service simulation stack
│   ├── docker/Dockerfile           # identical copy
│   ├── compose/compose.simulation.yml  # identical copy
│   ├── mosquitto/mosquitto.conf    # broker config (1883)
│   └── lora-sim/
│       ├── gateway.py              # SimPy LoRa radio model
│       ├── requirements.txt        # simpy==4.1.1
│       └── test_radio.py           # unit tests
│
├── packages/
│   ├── types/                      # @sajag/types — shared domain types/events
│   └── validation/                 # @sajag/validation — shared Zod schemas
│
└── tests/
    └── simulation-smoke.cjs        # end-to-end integration smoke test
```

---

*End of SRS v2.0 — SAJAG / Prakop Disaster Alert, Community Response & Virtual-IoT Emergency Platform.*
