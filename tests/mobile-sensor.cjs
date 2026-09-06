const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('apps/api/src/public/mobile-sensor.html', 'utf8');
const elements = new Map();
const requests = [];
const context = vm.createContext({
  console, Date, Math, Number, Object, JSON, AbortSignal, navigator: {},
  window: { isSecureContext: true, addEventListener() {} },
  document: { getElementById(id) {
    if (!elements.has(id)) elements.set(id, {textContent:'', className:'', classList:{toggle(){}}, children:[], prepend(){}, value:({water:'25',rain:'5',soil:'35'})[id], checkValidity(){return true;}});
    return elements.get(id);
  }, createElement(){return {};} },
  setTimeout(){}, setInterval(){return 1;}, clearInterval(){},
  fetch: async (url, options) => { requests.push({url, options}); return {ok:true,status:200,json:async()=>({engine:'SimPy',stats:{},lossRate:0})}; }
});
vm.runInContext(html.match(/<script>([\s\S]*?)<\/script>/)[1], context);
(async () => {
  await new Promise(setImmediate);
  requests.length = 0;
  vm.runInContext('onMotion({accelerationIncludingGravity:{x:0,y:0,z:9.81}})', context);
  assert.equal(elements.get('gDisplay').textContent,'0 g');
  assert.equal(requests.length,0);
  await vm.runInContext("setMode('lora'); sendTelemetry(buildPayload(0.12))",context);
  assert.equal(requests.at(-1).url,'/api/sim/lora-transmit');
  await vm.runInContext("setMode('wifi'); sendTelemetry(environmentPayload())",context);
  assert.equal(requests.at(-1).url,'/api/transports/lora');
  assert.equal(JSON.parse(requests.at(-1).options.body).sensors.waterLevel,25);
  vm.runInContext('toggleStream(); toggleStream()', context);
  assert.equal(elements.get('streamBtn').textContent,'Start stream (every 3 seconds)');
  console.log('Passed: stationary motion, LoRa/direct routing, environment payload, stream controls');
})().catch(e=>{console.error(e);process.exitCode=1;});
