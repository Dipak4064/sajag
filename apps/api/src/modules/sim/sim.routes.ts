import axios from 'axios';
import { config } from '../../config/env.config';
import { Router } from 'express';
import { simController } from './sim.controller';

export const simRouter = Router();

simRouter.post('/scenario', simController.triggerScenario);
simRouter.post('/network-mode', simController.setNetworkMode);
simRouter.get('/devices', simController.getDevices);
// Mobile phone LoRa-mode relay: phone → API:4000 → lora-sim:4002
simRouter.post('/lora-transmit', simController.loraTransmit);
simRouter.get('/lora-health', async (_req, res) => {
  try {
    const { simProxyService } = await import('./sim.service.js');
    res.json(await simProxyService.loraHealth());
  } catch {
    res.status(502).json({ error: 'LoRa gateway unavailable' });
  }
});

// USB phones only need the API port; radio traffic stays inside Docker.
simRouter.post('/radio-messages', async (req, res) => {
  if (!config.isSimulationMode) return res.sendStatus(404);
  try {
    const r = await axios.post(`${config.loraSimUrl}/messages`, req.body, { timeout: 5000 });
    res.status(202).json(r.data);
  } catch (error: any) { res.status(error.response?.status || 502).json({ error: 'Radio message rejected or gateway unavailable' }); }
});
simRouter.get('/radio-messages', async (req, res) => {
  if (!config.isSimulationMode) return res.sendStatus(404);
  try {
    const r = await axios.get(`${config.loraSimUrl}/messages`, { params: { deviceId: String(req.query.deviceId || '') }, timeout: 5000 });
    res.json(r.data);
  } catch { res.status(502).json({ error: 'Radio inbox unavailable' }); }
});
