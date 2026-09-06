import axios from 'axios';
import { config } from '../../config/env.config';

export class SimProxyService {
  private get simulatorUrl() {
    return config.simulatorUrl;
  }

  private get loraSimUrl() {
    return config.loraSimUrl;
  }

  async triggerScenario(body: any) {
    const response = await axios.post(`${this.simulatorUrl}/simulate/scenario`, body);
    return response.data;
  }

  async setNetworkMode(body: any) {
    const response = await axios.post(`${this.simulatorUrl}/simulate/network-mode`, body);
    return response.data;
  }

  async getDevices() {
    const response = await axios.get(`${this.simulatorUrl}/devices`);
    return response.data;
  }

  /**
   * Proxy a mobile-phone telemetry packet to the LoRa simulator (lora-sim:4002).
   * The phone cannot reach lora-sim directly (only ADB-forwarded port 4000 is open),
   * so the API acts as a relay here.
   */
  async loraTransmit(body: any) {
    const response = await axios.post(`${this.loraSimUrl}/transmit`, { payload: body }, { timeout: 5000 });
    return response.data;
  }

  async loraHealth() {
    const response = await axios.get(`${this.loraSimUrl}/health`, { timeout: 5000 });
    return response.data;
  }
}

export const simProxyService = new SimProxyService();
