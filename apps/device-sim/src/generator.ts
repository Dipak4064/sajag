import { SensorValues, TelemetryPayload } from '#sajag-types';
import { VirtualDeviceConfig } from './devices';

export interface ScenarioOverride {
  acceleration?: number;
  waterLevel?: number;
  soilMoisture?: number;
  rainfall?: number;
}

export class TelemetryGenerator {
  private activeOverrides: Map<string, ScenarioOverride> = new Map();

  public setOverride(deviceId: string, override: ScenarioOverride | null) {
    if (!override) {
      this.activeOverrides.delete(deviceId);
    } else {
      this.activeOverrides.set(deviceId, override);
    }
  }

  public clearAllOverrides() {
    this.activeOverrides.clear();
  }

  // Generates realistic baseline sensor noise with small organic fluctuations
  public generateReading(device: VirtualDeviceConfig): TelemetryPayload {
    const override = this.activeOverrides.get(device.deviceId);

    // Baseline physics simulation with Gaussian-like random walk
    let baseAccel = 0.12 + (Math.random() - 0.5) * 0.08;
    let baseWater = device.zoneType === 'RIVER_FLOOD' ? 22 + (Math.random() - 0.5) * 3 : 8;
    let baseSoil = device.zoneType === 'HILL_SLOPE' ? 42 + (Math.random() - 0.5) * 4 : 30;
    let baseRain = 2.0 + (Math.random() - 0.5) * 1.5;

    // Apply scenario overrides if currently injected
    const sensors: SensorValues = {
      acceleration: Number((override?.acceleration ?? baseAccel).toFixed(3)),
      waterLevel: Number((override?.waterLevel ?? baseWater).toFixed(1)),
      soilMoisture: Number((override?.soilMoisture ?? baseSoil).toFixed(1)),
      rainfall: Number((override?.rainfall ?? Math.max(0, baseRain)).toFixed(1))
    };

    return {
      deviceId: device.deviceId,
      timestamp: new Date().toISOString(),
      location: device.location,
      sensors
    };
  }
}
