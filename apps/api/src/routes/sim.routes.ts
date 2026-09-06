import { Router } from 'express';
import axios from 'axios';
import { logger } from '../utils/logger';

export const simRouter = Router();
const SIMULATOR_URL = process.env.SIMULATOR_URL || 'http://localhost:4001';

// Forward scenario trigger to device-sim service
simRouter.post('/scenario', async (req, res, next) => {
  try {
    const response = await axios.post(`${SIMULATOR_URL}/simulate/scenario`, req.body);
    res.json(response.data);
  } catch (err: any) {
    logger.error(`Error forwarding scenario to simulator: ${err.message}`);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(502).json({
      success: false,
      message: 'Failed to communicate with device-sim service. Is it running on port 4001?'
    });
  }
});

// Forward network mode toggle (WiFi / MQTT vs LoRa Fallback)
simRouter.post('/network-mode', async (req, res, next) => {
  try {
    const response = await axios.post(`${SIMULATOR_URL}/simulate/network-mode`, req.body);
    res.json(response.data);
  } catch (err: any) {
    logger.error(`Error forwarding network mode to simulator: ${err.message}`);
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(502).json({
      success: false,
      message: 'Failed to communicate with device-sim service. Is it running on port 4001?'
    });
  }
});

// Fetch simulated device statuses
simRouter.get('/devices', async (req, res, next) => {
  try {
    const response = await axios.get(`${SIMULATOR_URL}/devices`);
    res.json(response.data);
  } catch (err: any) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(502).json({
      success: false,
      message: 'Failed to reach device-sim service.'
    });
  }
});
