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
