// Embedded lightweight MQTT Broker for local testing without Docker
// Run with: node infrastructure/broker.js
const net = require('net');

try {
  const aedes = require('aedes')();
  const server = net.createServer(aedes.handle);
  const PORT = process.env.MQTT_PORT || 1883;

  server.listen(PORT, function () {
    console.log(`\x1b[32m✔ Embedded MQTT Broker listening on port ${PORT}\x1b[0m`);
    console.log(`  Topic prefix: prakop/device/+/...`);
  });

  aedes.on('client', function (client) {
    console.log(`[MQTT] Client connected: ${client ? client.id : 'unknown'}`);
  });

  aedes.on('publish', function (packet, client) {
    if (packet.topic.startsWith('prakop/')) {
      // debug
    }
  });
} catch (e) {
  console.log('\x1b[33m[Notice] To run embedded MQTT broker without Docker, run: npm install -D aedes\x1b[0m');
}
