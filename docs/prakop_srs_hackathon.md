# Prakop — Software Requirements Specification
### 24-Hour Hackathon Edition — No Physical Hardware, 100% Free-Tier Stack, AI-Agent Buildable

**Version:** 1.0 (Hackathon)  
**Platform:** SAJAG / Prakop (Disaster Alert, Community Response & Virtual-IoT Emergency Platform)  
**Core Constraint:** No physical ESP32/LoRa hardware required. Software Device Simulator (`apps/device-sim`) generates realistic Kathmandu sensor telemetry, with dual transport: MQTT (Mosquitto) primary + Firebase RTDB (simulating LoRa fallback).

## Key Systems:
1. **Virtual ESP32 Simulator (`apps/device-sim`)**: 8 Kathmandu stations (`ESP32-KTM-001` to `008`).
2. **Dual Transport Ingestion**: MQTT primary (WiFi) + Firebase RTDB (`/lora/{deviceId}/latest`) fallback.
3. **Risk & Detection Engine**: Multi-hazard formula:
   `RiskScore = 0.30*earthquakeScore + 0.25*rainfallScore + 0.20*soilScore + 0.25*waterScore`
4. **Alert State Machine**: `DETECTED → ANALYZING → CONFIRMED → NOTIFYING → WAITING_RESPONSE → {SAFE | UNSAFE | NO_RESPONSE}`.
5. **Geo-Fencing**: Haversine radius matching nearby residents.
6. **Twilio IVR**: Automated phone calls with DTMF (Press 1: Safe, Press 2: Record situation).
7. **Whisper STT + Critical NLP**: Transcribes victim audio, detects keywords (`trapped`, `debris`, `injured`, `collapsed`, `stuck`, `help`), flags urgency.
8. **Real-time Municipal Command Center**: Next.js + Leaflet + Socket.IO + shadcn/ui.
