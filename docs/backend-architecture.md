# SAJAG backend map and SRS traceability

This is the debugging index for the backend. The SRS is in
`docs/prakop_srs_hackathon.md`; it defines virtual ESP32 stations, MQTT and LoRa
transport, deterministic risk detection, geofencing, alerts, IVR, Whisper triage,
rescue matching and shelters.

## Request and data flow

```text
MQTT prakop/device/{id}/telemetry ─┐
                                  ├─ transport parser ─> SensorIngestionService
SimPy POST /api/transports/lora ───┘                         │
                                                           ├─ Prisma Device + SensorReading
                                                           ├─ RiskEngineService
                                                           ├─ AlertStateMachineService
                                                           └─ Socket.IO events
```

Every transport uses the same parser boundary and
`SensorIngestionService.ingestReading`. Adapters decode their external envelope
and identify the transport; they do not duplicate validation, persistence, risk,
or broadcasting.

## Folder responsibilities

| Path | Responsibility | Debug first when |
| --- | --- | --- |
| `apps/api/src/index.ts` | Process composition, middleware, route and transport startup | API does not boot |
| `apps/api/src/routes` | HTTP boundary and response formatting | URL or HTTP status is wrong |
| `apps/api/src/transports/telemetry.parser.ts` | Shared MQTT topic and LoRa envelope validation | A packet is rejected before persistence |
| `apps/api/src/transports/mqtt.subscriber.ts` | MQTT connection and subscriptions | Broker delivery fails |
| `apps/api/src/transports/firebase.listener.ts` | Optional legacy Firebase adapter from the original SRS | Firebase is explicitly enabled |
| `apps/api/src/services/ingestion.service.ts` | One telemetry application use case | Device/readings/risk differ by transport |
| `apps/api/src/services/risk.service.ts` | Pure sensor-to-risk calculation | Severity is unexpected |
| `apps/api/src/services/alert.service.ts` | Disaster event and resident notification state machine | Alerts do not progress |
| `apps/api/src/services/geofence.service.ts` | Haversine radius matching | Wrong residents are notified |
| `apps/api/src/services/twilio.service.ts` | Real or mock IVR and TwiML | DTMF or calls are wrong |
| `apps/api/src/services/whisper.service.ts` | Audio transcription and urgency keywords | Voice triage is wrong |
| `apps/api/src/services/rescue.service.ts` | Team lookup and SOS assignment | Dispatch is wrong |
| `apps/api/src/services/shelter.service.ts` | Capacity and distance lookup | Evacuation suggestions are wrong |
| `apps/api/src/openapi.ts` | Versioned Swagger contract, MQTT and LoRa extensions | Integrations drift |
| `apps/api/prisma/schema.prisma` | Persistent models and relations | Prisma errors occur |
| `apps/device-sim/src` | Station physics, scenarios, MQTT and LoRa clients | Packets are not sent |
| `infrastructure/lora-sim/gateway.py` | SimPy radio timing, collision/loss and backhaul | LoRa delivery fails |
| `packages/types` | Shared compile-time domain types and events | Type names diverge |
| `packages/validation` | Shared runtime Zod schemas at boundaries | Invalid input gets through |

## Prisma model responsibilities

`Municipality` owns the geographic tenant and relates residents, devices, shelters
and rescue teams. `Device` is the long-lived station identity; `SensorReading` is
append-only telemetry and records its `transport`. `DisasterEvent` is the risk
incident and `Alert` is its per-resident notification. `UserResponse` stores
SAFE/UNSAFE and voice triage. `SOSRequest` is a distress case optionally assigned
to a `RescueTeam`. `Shelter` is an evacuation destination and `CitizenReport` is
an independent field observation.

State fields are currently strings for migration compatibility. Canonical values
live in `packages/types`; production hardening should migrate these columns to
Prisma enums in one migration rather than adding another source of truth.

## SRS decisions and implementation notes

- The original SRS names Firebase RTDB as the LoRa fallback. The active local
  simulation uses an open-source SimPy gateway so it works without credentials;
  `firebase.listener.ts` remains an optional compatibility adapter.
- The SRS formula is the weighted baseline `0.30 earthquake + 0.25 rainfall +
  0.20 soil + 0.25 water`. The risk service also applies an acute dominant-hazard
  floor so one dangerous measurement is not diluted by normal sensors.
- Simulation mode creates a municipality on first valid telemetry instead of
  requiring `db:seed`. Production mode fails clearly when none is configured.
- Swagger UI is `/docs` and its machine-readable contract is `/openapi.json`.
  MQTT is described under `x-mqtt` and LoRa under `x-lora`, because broker topics
  and radio packets are not HTTP paths.

## SOLID and debugging rules

1. Routes do not own reusable business logic; move work into a service when a
   second route needs it.
2. Services depend on domain inputs and outputs. Keep HTTP, MQTT, Firebase and
   LoRa envelopes at adapters.
3. A new transport implements decoding and calls ingestion; it does not duplicate
   persistence or risk logic.
4. Keep pure calculations side-effect free (`risk`, `haversine`, validation).
5. Validate every external boundary and include transport/device IDs in logs.

For a live system inspect `/health`, `/openapi.json`, `/api/transports/status`,
the MQTT subscription, then the latest `SensorReading`. This isolates transport
issues from service and dashboard issues.

The SRS heartbeat topic is `prakop/device/+/status`. The older
`prakop/device/+/heartbeat` topic remains subscribed and published as an alias
for compatibility; telemetry is only accepted from the `/telemetry` topic.
