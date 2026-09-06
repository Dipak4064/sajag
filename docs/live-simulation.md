# Live ESP32 telemetry, IoT MQTT Panel and LoRa simulation

## Start everything from the launcher

From the project root:

```sh
./run-sajag.sh
```

The launcher starts the Docker simulation services, waits for their health checks,
then starts the admin and citizen frontends with the correct API and Socket.IO
URLs. It streams API, MQTT, ESP32 and LoRa logs in the terminal. Ctrl+C stops the
simulation containers and frontend process groups, preserving the database volume.
Docker Compose, Node.js and `setsid` are required; install dependencies in
`sajag_admin` and `sajag_public` with `npm install` before the first full launch.
Backend dependencies are installed inside Docker.

Use `./run-sajag.sh --no-build` to reuse images, or
`./run-sajag.sh --services-only` to skip the frontends. These flags can be combined.
Port overrides (`MQTT_PORT`, `API_PORT`, `SIMULATOR_PORT`, `LORA_PORT`) take priority;
otherwise the launcher reuses existing simulation container ports, falling back
to the defaults below for a fresh stack. It never kills unrelated port owners.
If startup fails due to a port conflict, select another port and retry.

To manage only the containers directly, `npm run sim:up` remains available from
`sajag_backend`. The launcher manages that same Compose project, so Ctrl+C also
stops simulation containers that were previously started directly.

This builds `sajag-device-sim:local`, `sajag-lora-sim:local`, and
`sajag-api:simulation`, and starts Mosquitto and an isolated PostgreSQL database.
No `db:seed` runs. Schema creation runs automatically. The first valid telemetry
creates the simulation municipality and its device; all readings come from live
transport traffic. There are no pre-created users, shelters or rescue teams.
Register through the app after the first telemetry arrives if login is needed.

The frontends run on ports 3001 (admin) and 3000 (citizen). The launcher prints
all selected backend ports and automatically configures both frontends to match.
The following URLs are the defaults for a fresh stack:

- API/devices: http://localhost:4000/api/devices
- Virtual ESP32 control: http://localhost:4001/devices
- Radio counters: http://localhost:4002/health
- Broker: your computer's LAN IPv4 address, TCP port 1883

The broker allows anonymous access for the local demo network. IoT MQTT Panel
runs on your Android phone; it is not a Docker service.

## Publish real MQTT messages with IoT MQTT Panel

Install **IoT MQTT Panel** by SNR Lab ([developer guide](https://blog.snrlab.in/iot/iot-mqtt-panel-user-guide/)).
Connect the phone to the computer's LAN. Create a connection with broker address
`<computer-LAN-IP>`, port `1883`, MQTT TCP, a unique client ID such as
`sajag-phone`, and no username/password or TLS. Use the host address, not
`localhost` or the Docker service name. Allow TCP 1883 through the host firewall
if needed.

Add a dashboard and Button panels with the following publish topic, QoS 1,
and retain disabled:

```text
prakop/device/ESP32-PANEL-001/telemetry
```

**Normal button payload:**

```json
{"deviceId":"ESP32-PANEL-001","location":{"lat":27.6895,"lng":85.3021},"sensors":{"acceleration":0.12,"waterLevel":22,"soilMoisture":30,"rainfall":2}}
```

**Flood button payload:**

```json
{"deviceId":"ESP32-PANEL-001","location":{"lat":27.6895,"lng":85.3021},"sensors":{"acceleration":0.12,"waterLevel":96,"soilMoisture":80,"rainfall":85}}
```

Each press sends a new measurement through MQTT and the risk engine. Timestamp
is deliberately omitted so the backend assigns current time on every press.
An explicit timestamp must be ISO 8601. The topic and JSON device IDs must match.
The separate `ESP32-PANEL-001` identity avoids the background generator overwriting
panel values. Subscribe a display panel to the same topic, with JSON path
`sensors.waterLevel` for water level (or `sensors.rainfall`).

## Exercise LoRa fallback

```sh
curl -fsS http://localhost:4001/simulate/network-mode \
  -H 'Content-Type: application/json' \
  -d '{"deviceId":"ESP32-KTM-001","mode":"LORA_FALLBACK"}'

curl -fsS http://localhost:4002/health
curl -fsS http://localhost:4000/api/devices
```

Within several seconds, received packets appear with transport `LORA_SIM`.
The device path is generator → HTTP radio submission → SimPy transmission and
loss model → local gateway → backend ingestion → database and Socket.IO.
The gateway has independent HTTP backhaul, so stopping Mosquitto does not stop
LoRa delivery after fallback is selected. Selection is manual via the dashboard
or control API; broker disconnection does not automatically change modes.

Switch back using `"mode":"NORMAL"`. Omit `deviceId` to switch all eight nodes.
Trigger a live disaster curve using:

```sh
curl -fsS http://localhost:4001/simulate/scenario \
  -H 'Content-Type: application/json' \
  -d '{"scenario":"FLOOD","targetDeviceId":"ESP32-KTM-001","durationSeconds":30}'
```

The radio uses the open-source [SimPy](https://simpy.readthedocs.io/en/4.1.0/api_reference/simpy.rt.html)
real-time event engine. `infrastructure/lora-sim/gateway.py` contains the local
model: one channel, SF7, 125 kHz bandwidth, coding rate 4/5, 32-byte sensor-frame
assumption, random backoff, overlapping-frame collisions, and configurable
packet loss. JSON is the host-side envelope; it is not sent as a physical radio
frame. This is a simplified LoRa link simulation, not the upstream LoRaSim
package, a LoRaWAN network server, RF emulation, or ESP32 firmware execution.
It does not model propagation, capture effect, encryption or regional duty cycles.

Run with `LORA_LOSS_RATE=1 npm run sim:up` to drop every radio frame, or choose
any value between 0 and 1. Counters distinguish received, collided, lost,
forwarded, and forwarding errors. Failed gateway HTTP deliveries are counted
and dropped; they are not silently reported as successful.

## Verify and stop

For a deterministic integration check, temporarily stop the background generator
so its radio frames cannot collide with the test packet:

```sh
docker compose -f infrastructure/compose.simulation.yml stop device-sim
docker compose -f infrastructure/compose.simulation.yml exec -e TEST_LORA_URL=http://lora-sim:4002 api node tests/simulation-smoke.cjs
docker compose -f infrastructure/compose.simulation.yml start device-sim
docker compose -f infrastructure/compose.simulation.yml run --rm --no-deps lora-sim python -m unittest -v test_radio
npm run sim:logs
npm run sim:down
```

Use default `LORA_LOSS_RATE=0` for the smoke test. It publishes a timestamp-free
panel payload, rejects invalid telemetry, submits a radio packet, and verifies
both transports' persisted readings. The radio unit checks cover airtime delay,
collisions, and complete packet loss. The database volume persists across stops;
no existing application database is used or cleared by this stack.

## What was broken

- The old LoRa publisher returned success after logging a message when Firebase
  credentials were absent; no packet ever reached the API.
- The ingestion service silently returned when no municipality had been seeded.
  Simulation mode now creates the required municipality on first valid traffic.
- The admin device page inserted hardcoded sensor cards on empty/error responses,
  and simulation controls displayed success even when requests failed. These now
  show empty/error states and wait for actual incoming transport updates.
- MQTT messages were parsed without the shared telemetry validation. Both paths
  now validate readings before database writes; panel timestamps can be omitted.
- The original Compose file only started infrastructure. The new dedicated stack
  also builds/runs the API, virtual devices and radio gateway with health checks.

## Ports used during verification in this workspace

An existing broker occupied 1883, so this stack was started without disturbing it:

```sh
export MQTT_PORT=1884 API_PORT=4010 SIMULATOR_PORT=4011 LORA_PORT=4012
npm run sim:up
```

For these settings use API port **4010**, simulator controls **4011**, radio
counters **4012**, and IoT MQTT Panel broker port **1884**. Apply the same exports
before subsequent `sim:up` commands so Compose retains these mappings.
In each frontend directory, connect to this stack with:

```sh
NEXT_PUBLIC_API_URL=http://localhost:4010/api NEXT_PUBLIC_SOCKET_URL=http://localhost:4010 npm run dev
```

Verified in Docker: zero devices before first traffic; MQTT panel-format ingestion;
invalid sensor rejection; LoRa ingestion for the same device; and new LoRa
readings while Mosquitto was stopped. All three radio tests and the admin
TypeScript check passed. The broker was restarted after testing, with
`ESP32-KTM-001` left in LoRa mode. IoT MQTT Panel itself still needs connection
setup on your phone; the test used an MQTT client publishing the same JSON.
