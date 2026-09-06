/**
 * The API contract is kept in code so it is versioned with the handlers.  The
 * `x-mqtt` section describes the broker contract which OpenAPI cannot model as
 * HTTP routes, while LoRa's gateway ingress is represented as a normal path.
 */
export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'SAJAG / PRAKOP Emergency API',
    version: '1.0.0',
    description: 'Disaster telemetry, risk detection, citizen safety and rescue coordination API.'
  },
  servers: [{ url: '/', description: 'SAJAG backend' }],
  tags: [
    { name: 'System', description: 'Health and API metadata' },
    { name: 'Devices', description: 'Registered virtual ESP32 stations and readings' },
    { name: 'Transport', description: 'MQTT and simulated LoRa transport contracts' },
    { name: 'Simulation', description: 'Virtual ESP32 scenario controls' },
    { name: 'Auth', description: 'Citizen and authority authentication' },
    { name: 'Alerts', description: 'Disaster events, Twilio callbacks and responses' },
    { name: 'SOS', description: 'Citizen distress and rescue assignment' },
    { name: 'Shelters', description: 'Evacuation shelter lookup' },
    { name: 'Reports', description: 'Citizen incident reports' },
    { name: 'Users', description: 'Resident safety roster' },
    { name: 'Rescue', description: 'Rescue team lookup' }
  ],
  paths: {
    '/health': { get: { tags: ['System'], summary: 'Health check', responses: { '200': { description: 'Healthy API' } } } },
    '/sensor': { get: { tags: ['System'], summary: 'Production Telemetry & Dual-Transport Simulator UI', responses: { '200': { description: 'HTML Simulator Interface' } } } },
    '/simulation': { get: { tags: ['System'], summary: 'Production Telemetry & Dual-Transport Simulator UI Alias', responses: { '200': { description: 'HTML Simulator Interface' } } } },
    '/api/transports/status': { get: { tags: ['Transport'], summary: 'Transport configuration and reachability', responses: { '200': { description: 'Transport status' } } } },
    '/api/transports/lora': {
      post: {
        tags: ['Transport'], summary: 'Receive one LoRa gateway packet',
        description: 'Simulation-only gateway callback. Requires x-gateway-token when SIMULATION_MODE=true.',
        security: [{ GatewayToken: [] }], requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/TelemetryPayload' } } } },
        responses: { '200': { description: 'Packet ingested and risk evaluated' }, '400': { description: 'Invalid telemetry' }, '401': { description: 'Invalid gateway token' } }
      }
    },
    '/api/devices': { get: { tags: ['Devices'], summary: 'List devices with latest reading', parameters: [{ name: 'connectedOnly', in: 'query', schema: { type: 'boolean', default: false } }], responses: { '200': { description: 'Device list' } } } },
    '/api/devices/{id}': { get: { tags: ['Devices'], summary: 'Get a device and recent readings by id or deviceId', parameters: [{ '$ref': '#/components/parameters/Id' }, { name: 'requireConnected', in: 'query', schema: { type: 'boolean', default: false } }], responses: { '200': { description: 'Device' }, '404': { description: 'Not found' } } } },
    '/api/devices/{id}/telemetry': { get: { tags: ['Devices'], summary: 'Fetch telemetry for one currently connected device only', parameters: [{ '$ref': '#/components/parameters/Id' }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500, default: 50 } }], responses: { '200': { description: 'Connected device and readings' }, '404': { description: 'Connected device not found' } } } },
    '/api/devices/{id}/readings': { get: { tags: ['Devices'], summary: 'Get device readings by id or deviceId', parameters: [{ '$ref': '#/components/parameters/Id' }, { name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 500, default: 50 } }, { name: 'requireConnected', in: 'query', schema: { type: 'boolean', default: false } }], responses: { '200': { description: 'Readings' } } } },
    '/api/sim/devices': { get: { tags: ['Simulation'], summary: 'List virtual ESP32 nodes', responses: { '200': { description: 'Simulator devices' } } } },
    '/api/sim/scenario': { post: { tags: ['Simulation'], summary: 'Trigger a disaster curve', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Scenario' } } } }, responses: { '200': { description: 'Scenario accepted' }, '400': { description: 'Invalid scenario' } } } },
    '/api/sim/network-mode': { post: { tags: ['Simulation'], summary: 'Switch MQTT or simulated LoRa', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/NetworkMode' } } } }, responses: { '200': { description: 'Mode changed' }, '404': { description: 'Unknown device' } } } },
    '/api/sim/lora-transmit': { post: { tags: ['Simulation'], summary: 'Proxy mobile telemetry via LoRa simulator', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/TelemetryPayload' } } } }, responses: { '200': { description: 'LoRa packet queued' } } } },
    '/api/sim/lora-health': { get: { tags: ['Simulation'], summary: 'Get SimPy LoRa radio gateway health', responses: { '200': { description: 'Radio status' } } } },
    '/api/sim/radio-messages': { get: { tags: ['Simulation'], summary: 'Get simulated radio messages inbox', responses: { '200': { description: 'Inbox' } } }, post: { tags: ['Simulation'], summary: 'Transmit simulated radio text message', responses: { '202': { description: 'Transmitted' } } } },
    '/api/auth/register': { post: { tags: ['Auth'], summary: 'Register a user', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Register' } } } }, responses: { '201': { description: 'Registered' }, '400': { description: 'Invalid request' } } } },
    '/api/auth/login': { post: { tags: ['Auth'], summary: 'Create a JWT session', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Login' } } } }, responses: { '200': { description: 'Authenticated' }, '401': { description: 'Invalid credentials' } } } },
    '/api/alerts': { get: { tags: ['Alerts'], summary: 'List recent disaster events', responses: { '200': { description: 'Events' } } } },
    '/api/alerts/active': { get: { tags: ['Alerts'], summary: 'List active events', responses: { '200': { description: 'Active events' } } } },
    '/api/alerts/{id}/twiml': { get: { tags: ['Alerts'], summary: 'Return Twilio gather XML', parameters: [{ '$ref': '#/components/parameters/Id' }], responses: { '200': { description: 'TwiML response', content: { 'text/xml': { schema: { type: 'string' } } } } } } },
    '/api/alerts/{id}/response': { post: { tags: ['Alerts'], summary: 'Record citizen/Twilio safety response', parameters: [{ '$ref': '#/components/parameters/Id' }], requestBody: { content: { 'application/json': { schema: { '$ref': '#/components/schemas/AlertResponse' } } } }, responses: { '200': { description: 'Response recorded' } } } },
    '/api/alerts/{id}/voice-upload': { post: { tags: ['Alerts'], summary: 'Receive a Twilio voice recording callback', parameters: [{ '$ref': '#/components/parameters/Id' }], responses: { '200': { description: 'Recording acknowledged' } } } },
    '/api/sos': { get: { tags: ['SOS'], summary: 'List SOS requests', responses: { '200': { description: 'SOS queue' } } }, post: { tags: ['SOS'], summary: 'Create an SOS request', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Sos' } } } }, responses: { '201': { description: 'SOS created' } } } },
    '/api/sos/active': { get: { tags: ['SOS'], summary: 'List active SOS requests with nearby teams', responses: { '200': { description: 'Active SOS queue' } } } },
    '/api/sos/{id}/status': { patch: { tags: ['SOS'], summary: 'Update SOS state', parameters: [{ '$ref': '#/components/parameters/Id' }], responses: { '200': { description: 'Updated SOS' } } } },
    '/api/sos/{id}/assign': { post: { tags: ['SOS'], summary: 'Assign a rescue team', parameters: [{ '$ref': '#/components/parameters/Id' }], responses: { '200': { description: 'Assigned SOS' } } } },
    '/api/shelters': { get: { tags: ['Shelters'], summary: 'List shelters', responses: { '200': { description: 'Shelters' } } } },
    '/api/shelters/nearest': { get: { tags: ['Shelters'], summary: 'Find nearest shelters', parameters: [{ '$ref': '#/components/parameters/Lat' }, { '$ref': '#/components/parameters/Lng' }], responses: { '200': { description: 'Shelters ordered by distance' } } } },
    '/api/reports': { get: { tags: ['Reports'], summary: 'List citizen reports', responses: { '200': { description: 'Reports' } } }, post: { tags: ['Reports'], summary: 'Submit a citizen report', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Report' } } } }, responses: { '201': { description: 'Report created' } } } },
    '/api/reports/{id}/verify': { patch: { tags: ['Reports'], summary: 'Verify or reject a report', parameters: [{ '$ref': '#/components/parameters/Id' }], responses: { '200': { description: 'Updated report' } } } },
    '/api/users': { get: { tags: ['Users'], summary: 'List users and safety tally', responses: { '200': { description: 'Users' } } }, post: { tags: ['Users'], summary: 'Create a user for frontend/admin flows', requestBody: { required: true, content: { 'application/json': { schema: { '$ref': '#/components/schemas/Register' } } } }, responses: { '201': { description: 'Created' }, '400': { description: 'Invalid request' } } } },
    '/api/rescue/teams': { get: { tags: ['Rescue'], summary: 'List rescue teams', responses: { '200': { description: 'Teams' } } } },
    '/api/rescue/nearest': { get: { tags: ['Rescue'], summary: 'Find available rescue teams', parameters: [{ '$ref': '#/components/parameters/Lat' }, { '$ref': '#/components/parameters/Lng' }], responses: { '200': { description: 'Teams ordered by distance' } } } },
    '/api/ads': { get: { tags: ['System'], summary: 'Get active announcements and ads', responses: { '200': { description: 'Active announcements' } } } },
    '/api/ads/admin': { get: { tags: ['System'], summary: 'Get all announcements and CTR stats (admin)', responses: { '200': { description: 'All ads' } } } },
    '/api/files/upload': { post: { tags: ['System'], summary: 'Upload file to RustFS object store', responses: { '200': { description: 'Uploaded' } } } }
  },
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      GatewayToken: { type: 'apiKey', in: 'header', name: 'x-gateway-token' }
    },
    parameters: {
      Id: { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
      Lat: { name: 'lat', in: 'query', required: true, schema: { type: 'number', minimum: -90, maximum: 90 } },
      Lng: { name: 'lng', in: 'query', required: true, schema: { type: 'number', minimum: -180, maximum: 180 } }
    },
    schemas: {
      TelemetryPayload: { type: 'object', required: ['deviceId', 'location', 'sensors'], properties: { deviceId: { type: 'string', example: 'ESP32-KTM-001' }, timestamp: { type: 'string', format: 'date-time' }, location: { type: 'object', required: ['lat', 'lng'], properties: { lat: { type: 'number' }, lng: { type: 'number' } } }, sensors: { type: 'object', required: ['acceleration', 'waterLevel', 'soilMoisture', 'rainfall'], properties: { acceleration: { type: 'number' }, waterLevel: { type: 'number', minimum: 0 }, soilMoisture: { type: 'number', minimum: 0, maximum: 100 }, rainfall: { type: 'number', minimum: 0 } } } } },
      Scenario: { type: 'object', required: ['scenario'], properties: { scenario: { type: 'string', enum: ['NORMAL', 'FLOOD', 'EARTHQUAKE', 'LANDSLIDE'] }, targetDeviceId: { type: 'string' }, durationSeconds: { type: 'integer', minimum: 5, maximum: 300, default: 30 } } },
      NetworkMode: { type: 'object', required: ['mode'], properties: { mode: { type: 'string', enum: ['NORMAL', 'LORA_FALLBACK'] }, deviceId: { type: 'string' } } },
      Register: { type: 'object', required: ['name', 'email', 'password', 'phone'], properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' }, phone: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' } } },
      Login: { type: 'object', required: ['email', 'password'], properties: { email: { type: 'string', format: 'email' }, password: { type: 'string', format: 'password' } } },
      AlertResponse: { type: 'object', properties: { response: { type: 'string', enum: ['SAFE', 'UNSAFE'] }, message: { type: 'string' } } },
      Sos: { type: 'object', required: ['latitude', 'longitude', 'description', 'contactNumber'], properties: { latitude: { type: 'number' }, longitude: { type: 'number' }, description: { type: 'string' }, numberOfPeople: { type: 'integer' }, medicalEmergency: { type: 'string', enum: ['NONE', 'MINOR', 'SEVERE', 'CRITICAL'] }, contactNumber: { type: 'string' } } },
      Report: { type: 'object', required: ['disasterType', 'latitude', 'longitude', 'description'], properties: { disasterType: { type: 'string' }, latitude: { type: 'number' }, longitude: { type: 'number' }, description: { type: 'string' }, mediaUrls: { type: 'array', items: { type: 'string', format: 'uri' } } } }
    }
  },
  'x-mqtt': {
    broker: '${MQTT_URL}',
    telemetry: { subscribe: 'prakop/device/+/telemetry', qos: 1, payload: { '$ref': '#/components/schemas/TelemetryPayload' } },
    status: { subscribe: 'prakop/device/+/status', qos: 0, payload: { type: 'object', required: ['deviceId', 'timestamp'] } },
    heartbeatLegacy: { subscribe: 'prakop/device/+/heartbeat', qos: 0, payload: { type: 'object', required: ['deviceId', 'timestamp'] } },
    deviceIdRule: 'The deviceId in the topic must equal payload.deviceId.'
  },
  'x-lora': {
    gatewayHealth: 'GET /health on the lora-sim service',
    gatewayTransmit: 'POST /transmit on the lora-sim service; accepted packets are forwarded to POST /api/transports/lora',
    transportValue: 'LORA_SIM'
  }
} as const;
