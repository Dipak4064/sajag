"""Local LoRa link model using open-source SimPy (not an ESP32 firmware emulator).

One channel, SF7/BW125/CR4/5, 32-byte encoded sensor frames. Overlapping
transmissions collide; configurable loss models an unreliable link. HTTP input
represents device radio submission; only received frames reach the backend.
"""
import json
import math
import os
import queue
import random
import threading
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import simpy.rt


def airtime(payload_bytes=32, sf=7, bandwidth=125000):
    symbol = 2**sf / bandwidth
    low_rate = int(symbol > 0.016)
    symbols = 8 + max(math.ceil((8 * payload_bytes - 4 * sf + 28 + 16) /
                               (4 * (sf - 2 * low_rate))) * 5, 0)
    return (8 + 4.25 + symbols) * symbol


class Radio:
    def __init__(self, env, deliver, loss_rate=0):
        self.env, self.deliver, self.loss_rate = env, deliver, loss_rate
        self.active = []
        self.stats = dict(submitted=0, received=0, collisions=0, lost=0,
                          forwarded=0, forwarding_errors=0)

    def transmit(self, payload, delay=0):
        self.stats['submitted'] += 1
        yield self.env.timeout(delay)
        frame = {'collision': False}
        for other in self.active:
            other['collision'] = frame['collision'] = True
        self.active.append(frame)
        yield self.env.timeout(airtime())
        self.active.remove(frame)
        if frame['collision']:
            self.stats['collisions'] += 1
        elif random.random() < self.loss_rate:
            self.stats['lost'] += 1
        else:
            self.stats['received'] += 1
            self.deliver(payload)


def main():
    pending, received = queue.Queue(maxsize=1000), queue.Queue(maxsize=1000)
    env = simpy.rt.RealtimeEnvironment(strict=False)
    loss_rate = float(os.getenv('LORA_LOSS_RATE', '0'))
    if not 0 <= loss_rate <= 1:
        raise ValueError('LORA_LOSS_RATE must be between 0 and 1')
    def accept(payload):
        try:
            received.put_nowait(payload)
        except queue.Full:
            radio.stats['forwarding_errors'] += 1

    radio = Radio(env, accept, loss_rate)

    def poll():
        while True:
            for _ in range(100):
                try:
                    payload = pending.get_nowait()
                except queue.Empty:
                    break
                # Random radio backoff avoids all eight periodic nodes colliding.
                env.process(radio.transmit(payload, random.uniform(0, 2)))
            yield env.timeout(0.02)

    def forward():
        while True:
            payload = received.get()
            try:
                request = urllib.request.Request(
                    os.getenv('API_URL', 'http://localhost:4000') + '/api/transports/lora',
                    data=json.dumps(payload).encode(),
                    headers={'Content-Type': 'application/json',
                             'X-Gateway-Token': os.environ['LORA_GATEWAY_TOKEN']})
                with urllib.request.urlopen(request, timeout=5) as response:
                    response.read()
                radio.stats['forwarded'] += 1
            except Exception as error:
                radio.stats['forwarding_errors'] += 1
                print(f'Gateway delivery failed: {error}', flush=True)
            finally:
                received.task_done()

    class Handler(BaseHTTPRequestHandler):
        def reply(self, status, data):
            body = json.dumps(data).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            if self.path != '/health':
                return self.reply(404, {'error': 'Not found'})
            self.reply(200, {'status': 'ok', 'engine': 'SimPy', 'stats': radio.stats,
                             'airtimeMs': round(airtime() * 1000, 3), 'lossRate': loss_rate})

        def do_POST(self):
            if self.path != '/transmit':
                return self.reply(404, {'error': 'Not found'})
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= 4096:
                    raise ValueError('Expected JSON body up to 4096 bytes')
                payload = json.loads(self.rfile.read(size))['payload']
                if not isinstance(payload, dict) or not isinstance(payload.get('deviceId'), str):
                    raise ValueError('Expected telemetry payload with deviceId')
                pending.put_nowait(payload)
            except queue.Full:
                return self.reply(503, {'error': 'Radio queue full'})
            except (ValueError, KeyError, TypeError) as error:
                return self.reply(400, {'error': str(error)})
            self.reply(202, {'accepted': True})

    env.process(poll())
    threading.Thread(target=forward, daemon=True).start()
    threading.Thread(target=lambda: ThreadingHTTPServer(('0.0.0.0', 4002), Handler).serve_forever(),
                     daemon=True).start()
    env.run()


if __name__ == '__main__':
    main()
