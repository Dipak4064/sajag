#!/usr/bin/env python3
import time
import requests
import sys

try:
    import serial
except ImportError:
    print("pyserial required. Install with: pip install pyserial requests")
    sys.exit(1)

SERIAL_PORT = sys.argv[1] if len(sys.argv) > 1 else '/dev/ttyUSB0'
BAUD_RATE = 115200
API_URL = 'http://localhost:4000/api/transports/lora'
GATEWAY_TOKEN = 'local-simulation-gateway'

print(f"🔌 Connecting to Physical ESP32 on {SERIAL_PORT} at {BAUD_RATE} baud...")
try:
    ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=1)
    print("✅ Connected! Reading USB Serial telemetry from ESP32...")
    while True:
        line = ser.readline().decode('utf-8', errors='ignore').strip()
        if line.startswith('{') and line.endswith('}'):
            print(f"📡 Physical ESP32 Ingress: {line}")
            try:
                res = requests.post(
                    API_URL,
                    data=line,
                    headers={'Content-Type': 'application/json', 'x-gateway-token': GATEWAY_TOKEN},
                    timeout=3
                )
                print(f"   └─ API Telemetry Result: {res.status_code}")
            except Exception as e:
                print(f"   └─ Transmission Error: {e}")
        time.sleep(0.1)
except Exception as err:
    print(f"Error connecting to serial port {SERIAL_PORT}: {err}")
