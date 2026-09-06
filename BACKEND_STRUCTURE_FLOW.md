# ⚙️ SAJAG (सजग) Backend & Virtual-IoT Engine
### Modular Disaster API, Deterministic Risk Engine & Virtual ESP32 Simulator
**Architecture, Telemetry Ingestion, Geofencing & Database Flow Documentation**

---

## 📁 1. Directory & Package Structure

```text
sajag_backend/
├── package.json                      # Workspace root scripts (dev:api, dev:sim, db:*)
├── tsconfig.base.json                # Shared TypeScript compiler options
├── .env                              # Master environment variables (DB, Ports, Twilio, JWT)
│
├── apps/
│   ├── api/                          # Express + TypeScript Emergency Backend (Port 4000)
│   │   ├── prisma/
│   │   │   ├── schema.prisma         # Unified database schema (PostgreSQL / SQLite)
│   │   │   └── seed.ts               # Kathmandu stations, shelters, and mock residents seeder
│   │   └── src/
│   │       ├── index.ts              # HTTP & WebSocket server entrypoint
│   │       ├── db/prisma.ts          # Prisma Client ORM singleton
│   │       ├── websocket/
│   │       │   └── socket.server.ts  # Socket.IO gateway with dual CORS support (3000 & 3001)
│   │       ├── transports/
│   │       │   ├── mqtt.subscriber.ts # WiFi MQTT telemetry listener (Port 1883)
│   │       │   └── firebase.listener.ts # LoRa Radio simulated telemetry listener
│   │       ├── services/
│   │       │   ├── ingestion.service.ts # Unified ingestion router
│   │       │   ├── risk.service.ts      # 0-100 Multi-hazard deterministic risk engine
│   │       │   ├── geofence.service.ts  # Haversine 5km danger ring calculation
│   │       │   ├── alert.service.ts     # Alert state machine controller
│   │       │   ├── twilio.service.ts    # Outbound IVR automated calls & DTMF triage
│   │       │   ├── whisper.service.ts   # OpenAI Whisper audio transcription & NLP
│   │       │   ├── rescue.service.ts    # Proximity matching for rescue team dispatch
│   │       │   └── shelter.service.ts   # Safe haven capacity & distance queries
│   │       └── routes/
│   │           ├── auth.routes.ts       # JWT authentication (Citizen & Authority)
│   │           ├── devices.routes.ts    # IoT station status & reading queries
│   │           ├── alerts.routes.ts     # Active hazard events & citizen responses
│   │           ├── sos.routes.ts        # SOS distress queue & rescue assignment
│   │           ├── shelters.routes.ts   # Nearest shelter queries with GPS distance
│   │           ├── reports.routes.ts    # Citizen incident observations verification
│   │           ├── users.routes.ts      # Resident safety roster & Whisper transcripts
│   │           └── sim.routes.ts        # Forwarding endpoints to Virtual Simulator
│   │
│   └── device-sim/                   # Virtual ESP32 Hardware Simulator (Port 4001)
│       └── src/
│           ├── index.ts              # Simulator HTTP server & scenario injection
│           ├── simulator.ts          # 8 Kathmandu stations physics telemetry generator
│           └── stations.ts           # Kathmandu station coordinates & hazard profiles
│
├── packages/
│   ├── types/                        # @sajag/types: Shared TypeScript entity models
│   └── validation/                   # @sajag/validation: Shared Zod validation schemas
│
└── infrastructure/
    ├── broker.js                     # Embedded lightweight Aedes MQTT broker (Port 1883)
    └── docker-compose.yml            # Optional containerized PostgreSQL & Mosquitto
```

---

## 🌊 2. Telemetry Ingestion & Dual-Transport Architecture

Because hardware infrastructure can fail during natural disasters (e.g. WiFi cell towers collapse), SAJAG implements an automated **Dual-Transport Architecture**:

```text
┌────────────────────────────────────────────────────────┐
│       VIRTUAL ESP32 SIMULATOR (apps/device-sim)        │
│  8 Kathmandu Stations (Water, Accel, Rain, Soil)       │
└──────────────────────────┬─────────────────────────────┘
                           │
             Dynamic Network Mode Toggle
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
   PRIMARY (WiFi Active)       FALLBACK (WiFi Blackout)
    MQTT Broker (Port 1883)     Firebase RTDB (LoRa Radio)
             │                           │
             └─────────────┬─────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             INGESTION SERVICE (apps/api)               │
│  Validates telemetry payload, writes sensor reading to │
│  database, and hands off to Deterministic Risk Engine  │
└────────────────────────────────────────────────────────┘
```

### MQTT Topics:
- Telemetry: `prakop/device/{deviceId}/telemetry`
- Heartbeat: `prakop/device/{deviceId}/status`

---

## 🧮 3. Deterministic 0-100 Multi-Hazard Risk Engine

When telemetry arrives at `apps/api/src/services/risk.service.ts`, it evaluates an anomaly composite curve:

$$\text{Composite Score} = (S_{\text{water}} \times 0.40) + (S_{\text{rain}} \times 0.25) + (S_{\text{soil}} \times 0.20) + (S_{\text{quake}} \times 0.15)$$

### Threshold Classification:
- **0 – 29 (`LOW`)**: Normal basin flow. Green baseline.
- **30 – 59 (`MODERATE`)**: Advisory. Yellow status. Alerts operators to monitor telemetry.
- **60 – 79 (`HIGH`)**: Hazard Warning. Orange status. Advises voluntary relocation.
- **80 – 100 (`CRITICAL`)**: Severe Disaster. Red status. Triggers automatic emergency alert state machine, automated Twilio IVR calls, and siren broadcast.

---

## 📡 4. Haversine 5km Geofencing & Outbound Twilio Calling

When a station reaches `CRITICAL` hazard level:
1. `geofence.service.ts` calculates a 5 km spherical circle around the station coordinates $(lat_1, lng_1)$:
   $$d = 2R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta lat}{2}\right) + \cos(lat_1)\cos(lat_2)\sin^2\left(\frac{\Delta lng}{2}\right)}\right)$$
2. Identifies all residents whose registered home coordinates fall inside $d \le 5\text{ km}$.
3. Dispatches automated **Twilio IVR voice calls** simultaneously:
   - *"This is an emergency flash flood warning from Kathmandu Metropolitan Authority. Press 1 if you are Safe. Press 2 if you need immediate Rescue."*
   - Captures DTMF keypad input and logs response as `SAFE` or `UNSAFE`.
   - If resident leaves a spoken voice distress message, it is transcribed via **OpenAI Whisper AI** and triaged by urgency.

---

## 🗄️ 5. Database Schema (Prisma ORM)

```prisma
model Municipality {
  id          String        @id @default(cuid())
  name        String
  users       User[]
  devices     Device[]
  shelters    Shelter[]
  rescueTeams RescueTeam[]
}

model Device {
  id             String          @id @default(cuid())
  deviceId       String          @unique // e.g. ESP32_BALKHU_01
  name           String
  latitude       Float
  longitude      Float
  status         String          @default("ONLINE") // ONLINE | OFFLINE
  transport      String          @default("MQTT")   // MQTT | LORA_SIM
  lastHeartbeat  DateTime?
  readings       SensorReading[]
  municipalityId String
  municipality   Municipality    @relation(fields: [municipalityId], references: [id])
}

model SensorReading {
  id           String   @id @default(cuid())
  deviceId     String
  device       Device   @relation(fields: [deviceId], references: [id])
  acceleration Float    // g-force (Quake)
  waterLevel   Float    // cm (Flood)
  soilMoisture Float    // % (Landslide)
  rainfall     Float    // mm/h (Precipitation)
  transport    String   // MQTT | LORA_SIM
  timestamp    DateTime @default(now())
}

model DisasterEvent {
  id           String   @id @default(cuid())
  type         String   // FLOOD | EARTHQUAKE | LANDSLIDE | STORM
  riskScore    Float
  severity     String   // LOW | MODERATE | HIGH | CRITICAL
  latitude     Float
  longitude    Float
  radiusMeters Float    @default(5000)
  status       String   @default("DETECTED") // DETECTED -> ANALYZING -> CONFIRMED -> NOTIFYING -> RESOLVED
  title        String?
  description  String?
  alerts       Alert[]
}

model SOSRequest {
  id               String      @id @default(cuid())
  userId           String?
  latitude         Float
  longitude        Float
  addressText      String?
  description      String
  numberOfPeople   Int         @default(1)
  medicalEmergency String      @default("NONE") // NONE | MINOR | SEVERE | CRITICAL
  status           String      @default("PENDING") // PENDING | ASSIGNED | RESOLVED
  contactNumber    String
  assignedTeamId   String?
  assignedTeam     RescueTeam? @relation(fields: [assignedTeamId], references: [id])
  createdAt        DateTime    @default(now())
}
```

---

## 🛠️ 6. Running the Backend & Simulator Standalone

```bash
cd /home/dipak/hacathon/sajag_backend

# 1. Start Embedded MQTT Broker (Port 1883)
node infrastructure/broker.js

# 2. Start Emergency API Server (Port 4000)
npm run dev:api

# 3. Start Virtual ESP32 Simulator (Port 4001)
npm run dev:sim
```
