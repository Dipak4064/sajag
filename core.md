# 🚨 SAJAG // PRAKOP (सजग)
### Disaster Early Warning, Community Response & Virtual-IoT Emergency Platform
**Master End-to-End System Architecture & Lifecycle Flow Documentation**

---

## 📌 1. Executive Summary

**SAJAG (सजग)** is a mission-critical disaster early-warning and community response platform built specifically for the geographical hazards of Nepal (Kathmandu Valley basin, Bagmati river corridor, steep landslide slopes, and seismic faultlines). 

The platform is split into three decoupled applications:
1. **`sajag_backend`**: Node.js + Express API server, Prisma ORM, Socket.IO gateway, Dual-Transport Ingestion (MQTT + LoRa simulation), and Virtual ESP32 Hardware Simulator.
2. **`sajag_admin`**: Municipal Command Center for disaster management authorities (tactical GIS map, IoT sensor matrix, SOS rescue dispatch, Twilio IVR logs).
3. **`sajag_public`**: Citizen Emergency Portal & Mobile-first PWA (0-100 community risk gauge, 1-tap SOS distress button, shelter evacuation routing, field hazard reports).

---

## 🏛️ 2. High-Level System Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│               VIRTUAL ESP32 SIMULATOR (apps/device-sim)                │
│    8 Kathmandu Stations (Balkhu, Sundarijal, Kirtipur, Thamel, etc.)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                      Dynamic Failover Network Mode
                                    │
                     ┌──────────────┴──────────────┐
                     ▼                             ▼
           PRIMARY (WiFi Online)         FALLBACK (WiFi Blackout)
              MQTT Broker 1883             Firebase RTDB / LoRa
                     │                             │
                     └──────────────┬──────────────┘
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      SAJAG BACKEND API (apps/api)                      │
│  • Dual-Transport Ingestion Service (MQTT + LoRa Radio)                │
│  • Deterministic Risk Engine (0-100 Multi-hazard Composite Index)      │
│  • Haversine Geofencing (5 km Danger Radius around Epicenter)         │
│  • Alert State Machine (DETECTED ➔ NOTIFYING ➔ RESOLVED)              │
│  • Automated Twilio IVR Voice Outbound Calls & DTMF Response Logging   │
│  • Whisper AI Audio Transcription & Emergency Urgency Triage           │
│  • Real-time Socket.IO WebSocket Gateway Server                        │
│  • PostgreSQL / SQLite Storage via Prisma ORM                          │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
          Socket.IO & REST APIs            Socket.IO & REST APIs
                    │                                │
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│  SAJAG ADMIN COMMAND CENTER (3001)   │  │   SAJAG CITIZEN PWA (3000)   │
│  • Tactical GIS Map (8 IoT Stations) │  │  • 0-100 Local Risk Meter    │
│  • Real-time LoRa Failover Switch    │  │  • 1-Tap SOS (3s abort)      │
│  • 1-Click Disaster Simulator Modal  │  │  • Evacuation Shelters & Map │
│  • SOS Triage & Rescue Unit Dispatch │  │  • Field Incident Reporting  │
│  • Citizen Reports Verification      │  │  • Safe/Unsafe Self Check-in │
│  • Resident Safety Census & Whisper  │  │  • Nepal Emergency Hotlines  │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

---

## 🔄 3. The 10-Step Emergency Lifecycle Flow

```text
1. DETECT       Virtual ESP32 sensors capture river water level, tremors, rain & soil saturation.
   │
   ▼
2. INGEST       Telemetry transmits via WiFi MQTT (1883) or LoRa Radio Fallback (Firebase).
   │
   ▼
3. ANALYZE      Deterministic Risk Engine computes multi-hazard risk score (0-100).
   │
   ▼
4. PREDICT      Thresholds breached (Water > 80cm, Accel > 1.2g) ➔ Trigger Alert State Machine.
   │
   ▼
5. ALERT        Real-time Socket.IO broadcast to web clients + Automated Twilio IVR phone calls.
   │
   ▼
6. LOCATE       Haversine geofence identifies residents & shelters within 5km danger ring.
   │
   ▼
7. REPORT       Citizens submit ground photos and verify rising waters via Citizen Portal.
   │
   ▼
8. SOS          Trapped citizen presses 1-Tap SOS with GPS coordinates & trapped count.
   │
   ▼
9. DISPATCH     Command Center triages urgency & dispatches Nepal Army / Police / APF units.
   │
   ▼
10. RESOLVE     Responders secure citizens in safe shelters; system returns to Normal baseline.
```

---

## 🌐 4. Network Topology & Port Mapping

| Service | Directory | Port | Protocol | Description |
| :--- | :--- | :--- | :--- | :--- |
| **Citizen Portal** | `sajag_public` | `3000` | HTTP / WebSocket | Citizen-facing responsive Next.js 14 PWA |
| **Command Center** | `sajag_admin` | `3001` | HTTP / WebSocket | Authority disaster operations console |
| **Backend API** | `sajag_backend/apps/api` | `4000` | HTTP / REST / WS | Express server, Prisma, Socket.IO gateway |
| **Device Simulator**| `sajag_backend/apps/device-sim`| `4001`| HTTP / MQTT | Virtual ESP32 telemetry generator |
| **MQTT Broker** | `sajag_backend/infrastructure` | `1883` | TCP / MQTT | Embedded Aedes broker for IoT telemetry |

---

## ⚡ 5. Unified 1-Command Startup

You can launch all 5 services simultaneously using tmux:

```bash
run-sajag
```
*(or `./run-sajag.sh` from the repository root).*

### What happens when running `run-sajag`:
1. Checks and cleans ports `1883`, `4000`, `4001`, `3000`, and `3001`.
2. Creates a dedicated tmux session named `sajag` with 4 tiled panes.
3. Runs the Citizen Portal in Pane 1 (`http://localhost:3000`).
4. Runs the Command Center in Pane 2 (`http://localhost:3001`).
5. Runs the Backend API & Embedded MQTT Broker in Pane 3 (`http://localhost:4000`).
6. Runs the Virtual ESP32 Simulator in Pane 4 (`http://localhost:4001`).

---

## 📖 6. Repository-Specific Documentation

For detailed component architecture and user flow guides:
- 📱 [**sajag_public Documentation**](./sajag_public/README.md)
- 🏢 [**sajag_admin Documentation**](./sajag_admin/README.md)
- ⚙️ [**sajag_backend Documentation**](./sajag_backend/BACKEND_STRUCTURE_FLOW.md)
