# 🚨 SAJAG // PRAKOP (सजग)
### Disaster Alert, Community Response & Virtual-IoT Emergency Platform
**24-Hour Hackathon Edition • 100% Free-Tier Stack • No Physical Hardware Required**

---

## 📌 1. Project Overview

**SAJAG (Prakop)** is a mission-critical disaster early-warning and community response platform built specifically for the geographical hazards of Nepal (Kathmandu Valley, Bagmati river basin, steep landslide corridors, and seismic faultlines), engineered to scale globally.

Because physical ESP32 and LoRa radio hardware are often unavailable during rapid hackathon builds, **SAJAG solves the hardware barrier with a software Virtual ESP32 Simulator (`apps/device-sim`)**. The simulator publishes identical telemetry on the same topics and can dynamically fail over between WiFi (MQTT) and LoRa fallback (Firebase Realtime Database) on demand.

### The 10-Step Emergency Lifecycle:
```text
DETECT ──> ANALYZE ──> PREDICT ──> ALERT ──> LOCATE ──> REPORT ──> SOS ──> ASSIGN RESCUE ──> EVACUATE ──> RESOLVE
```

---

## 🏛️ 2. High-Level Architecture

```text
┌────────────────────────────────────────────────────────┐
│       VIRTUAL ESP32 SIMULATOR (apps/device-sim)        │
│  8 Kathmandu Stations (Water, Rain, Accel, Soil)       │
└──────────────────────────┬─────────────────────────────┘
                           │
             Dynamic Network Mode Toggle
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
   PRIMARY (WiFi Present)      FALLBACK (WiFi Outage)
      MQTT (Mosquitto)           Firebase RTDB (LoRa Sim)
             │                           │
             └─────────────┬─────────────┘
                           ▼
┌────────────────────────────────────────────────────────┐
│             NODE.JS BACKEND (apps/api)                 │
│  • Dual Transport Ingestion (MQTT + Firebase)          │
│  • Deterministic Risk Engine (0-100 Multi-hazard)      │
│  • Alert State Machine (DETECTED ──> RESOLVED)         │
│  • Haversine Geofencing (5km Danger Radius)            │
│  • Automated Twilio IVR Outbound Calling (DTMF 1 / 2)  │
│  • Whisper Audio Transcription & NLP Urgency Triage    │
│  • Rescue Team Proximity Matching & Shelter Routing    │
│  • Real-time Socket.IO WebSocket Gateway               │
└──────────────────────────┬─────────────────────────────┘
                           │
             ┌─────────────┼─────────────┐
             ▼             ▼             ▼
       PostgreSQL      Socket.IO     Twilio IVR
       (Prisma ORM)   (Live Push)   (Voice Call)
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│         NEXT.JS 14 DASHBOARD (apps/web)                │
│  📱 Citizen PWA (1-Tap SOS, Risk Meter, Shelters)      │
│  🏢 Municipal Command Center (Tactical Leaflet Map,    │
│     IoT Telemetry, LoRa Failover Switch, SOS Triage)   │
└────────────────────────────────────────────────────────┘
```

---

## 📁 3. Monorepo Structure

```text
sajag_project/
├── package.json                   # Root npm workspaces config (apps/*, packages/*)
├── tsconfig.base.json             # Shared TypeScript configuration
├── .gitignore
├── .env.example                   # Master environment template
├── README.md                      # Complete system guide
│
├── apps/
│   ├── web/                       # Next.js 14 (App Router) Dashboard & Citizen PWA
│   │   ├── app/
│   │   │   ├── page.tsx           # Landing portal
│   │   │   ├── (auth)/login/      # Authentication & role portal
│   │   │   ├── citizen/           # Citizen mobile-first interface
│   │   │   │   ├── page.tsx       # Local Risk Gauge & Nearest Shelter
│   │   │   │   ├── sos/page.tsx   # Distress SOS button with 3s cancel countdown
│   │   │   │   ├── report/        # Field hazard photo & GPS submission
│   │   │   │   └── shelters/      # Safe haven evacuation list
│   │   │   └── dashboard/         # Municipal Command Center
│   │   │       ├── page.tsx       # Live map & stream split-screen
│   │   │       ├── devices/       # IoT Telemetry & LoRa Failover Matrix
│   │   │       ├── alerts/        # Alert state machine & Twilio IVR logs
│   │   │       ├── sos/           # Real-time SOS Triage & Rescue Dispatch
│   │   │       ├── reports/       # Citizen incident reports verification
│   │   │       └── users/         # Resident safety status & Whisper voice transcripts
│   │   ├── components/
│   │   │   ├── map/live-map.tsx   # Interactive Leaflet map (custom sensor & SOS markers)
│   │   │   └── simulation/        # Hackathon 1-Click Disaster & Outage Modal
│   │   ├── stores/                # Zustand client state (auth, map layers)
│   │   └── lib/                   # Axios client & Socket.IO singleton
│   │
│   ├── api/                       # Express + TypeScript Modular Emergency Backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma      # Unified database schema
│   │   │   └── seed.ts            # Kathmandu Valley seed data (8 devices, 30 residents, 4 shelters, 4 rescue teams)
│   │   └── src/
│   │       ├── services/
│   │       │   ├── risk.service.ts     # Multi-hazard Risk Engine formula
│   │       │   ├── alert.service.ts    # Alert State Machine
│   │       │   ├── geofence.service.ts # Haversine danger zone user matching
│   │       │   ├── twilio.service.ts   # Automated IVR phone calling & TwiML
│   │       │   ├── whisper.service.ts  # Speech-to-text & NLP urgency classifier
│   │       │   ├── rescue.service.ts   # Nearest rescue team proximity dispatch
│   │       │   └── shelter.service.ts  # Safe shelter capacity search
│   │       ├── transports/
│   │       │   ├── mqtt.subscriber.ts  # Mosquitto MQTT subscriber (WiFi path)
│   │       │   └── firebase.listener.ts# Firebase RTDB listener (LoRa fallback path)
│   │       └── websocket/              # Socket.IO rooms & real-time broadcasts
│   │
│   └── device-sim/                # Virtual ESP32 Hardware Simulator
│       └── src/
│           ├── devices.ts         # 8 Kathmandu stations (Balkhu, Sundarijal, Patan, etc.)
│           ├── generator.ts       # Physics engine (water, rainfall, acceleration, soil)
│           ├── mqtt.client.ts     # MQTT publisher
│           ├── firebase.client.ts # Firebase RTDB writer (simulating LoRa uplink)
│           └── scenarios/         # Scripted disaster curves (Flood, Quake, Landslide)
│
├── packages/
│   ├── types/                     # Shared TypeScript interfaces across all apps
│   └── validation/                # Shared Zod schemas (telemetry, alerts, SOS, auth)
│
└── infrastructure/
    ├── docker-compose.yml         # Local Mosquitto MQTT, PostgreSQL (PostGIS), Redis
    └── mosquitto/
        └── mosquitto.conf
```

---

## ⚡ 4. Quick Start & Setup

### Prerequisites
* **Node.js**: v20+
* **Docker & Docker Compose**: For local Mosquitto MQTT and PostgreSQL (or use Neon.tech free Postgres)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Local Infrastructure
```bash
npm run infra:up
```
*Starts Eclipse Mosquitto (port 1883), PostgreSQL (port 5432), and Redis (port 6379).*

### Step 3: Run Database Migrations & Seed Kathmandu Valley Data
```bash
npm run db:push
npm run db:seed
```
*Seeds Kathmandu Metropolitan City with 8 Virtual ESP32 Stations, 4 Rescue Teams (Nepal Army, APF, Red Cross, Fire Brigade), 4 Shelters, and 30 Residents.*

### Step 4: Start All Services in Parallel
```bash
npm run dev
```
Or start individually in separate terminals:
```bash
npm run dev:sim   # Virtual ESP32 Simulator on http://localhost:4001
npm run dev:api   # Emergency API & Socket.IO on http://localhost:4000
npm run dev:web   # Next.js Command Center on http://localhost:3000
```

---

## 🎯 5. Hackathon Live Demo Walkthrough (5 Exact Scenarios)

### Scenario 1: Baseline Monitoring (Normal)
* Open the Command Center at [http://localhost:3000/dashboard](http://localhost:3000/dashboard).
* Observe 8 Virtual ESP32 stations reporting normal baseline readings (Water ~22cm, Rain ~2mm, Accel ~0.12g).
* Map shows all sensors with blue rings (WiFi/MQTT mode).

### Scenario 2: 🌊 Bagmati River Flood & Emergency Alert
* Click the red **"🔥 SIMULATE DISASTER"** button in the dashboard header.
* Click **"Bagmati Flood"**.
* Watch the simulator ramp water level from 22cm &rarr; 96cm.
* In &lt; 2 seconds:
  1. Risk Engine computes **Score 88/100 (CRITICAL HAZARD)**.
  2. A 5km danger circle illuminates over Kathmandu.
  3. Haversine geofence identifies nearby residents and generates automated IVR calls.
  4. Citizen mobile view ([http://localhost:3000/citizen](http://localhost:3000/citizen)) turns into high-alert siren mode.

### Scenario 3: 📞 Citizen Response & DTMF '1' (Safe)
* On citizen prompt, press **"1"** (or simulated DTMF callback).
* Resident marker instantly turns **Green (SAFE)** on the tactical map without page refresh.

### Scenario 4: 🎙️ Citizen Response & DTMF '2' (Unsafe + Whisper NLP)
* If citizen presses **"2"** and leaves voice message: *"I'm trapped under debris near the collapsed wall"*
* Audio is transcribed via Whisper.
* Critical NLP engine detects `trapped`, `debris`, `collapsed`.
* Resident turns **Red (UNSAFE)** with **CRITICAL** urgency badge on the dashboard.

### Scenario 5: 📡 Network Outage & Failover to LoRa Link (The Hackathon Winner)
* In the dashboard, navigate to **IoT Sensors & LoRa** ([http://localhost:3000/dashboard/devices](http://localhost:3000/dashboard/devices)).
* Click **"Simulate Outage ⚡"** next to `ESP32-KTM-001`.
* Watch the icon instantly change from **WiFi / MQTT 📶** to **LoRa Fallback 📡 (Firebase RTDB)**.
* Telemetry and alerts continue streaming with zero interruption!

---

## 🛡️ 6. Security & Guardrails
1. **Deterministic Risk Calculations**: Telemetry risk scores and hazard levels are 100% computed server-side in `risk.service.ts`. Client/device-provided risk fields are strictly stripped.
2. **LoRa Simulation Honesty**: We clearly identify the secondary channel as a simulated LoRa fallback path powered by Firebase Realtime Database.
3. **No Unsafe Assumptions**: Road routing and evacuation paths are marked as advisory emergency guidelines.

---

## 👥 7. Default Demo Accounts

| Role | Email | Password | Access |
|---|---|---|---|
| Municipal Authority | `admin@kmc.gov.np` | `Prakop123!` | Command Center & SOS Triage |
| Citizen | `citizen@sajag.np` | `Prakop123!` | 1-Tap SOS & Local Alerts |
