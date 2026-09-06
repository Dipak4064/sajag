import pino from 'pino';
import { ScenarioMode } from '#sajag-types';
import { TelemetryGenerator } from '../generator';

const logger = pino({ name: 'DeviceSim:ScenarioManager' });

export class ScenarioManager {
  private activeScenarioTimer: NodeJS.Timeout | null = null;

  constructor(private generator: TelemetryGenerator) {}

  public triggerScenario(scenario: ScenarioMode, targetDeviceId: string = 'ESP32-KTM-001', durationSeconds: number = 30) {
    if (this.activeScenarioTimer) {
      clearInterval(this.activeScenarioTimer);
      this.activeScenarioTimer = null;
    }

    this.generator.clearAllOverrides();

    logger.info(`Starting scripted disaster scenario: ${scenario} on ${targetDeviceId} for ${durationSeconds}s`);

    if (scenario === 'NORMAL') {
      this.generator.clearAllOverrides();
      logger.info('Reset all devices to normal baseline physics.');
      return;
    }

    let elapsed = 0;
    const intervalMs = 1000;
    const totalSteps = durationSeconds;

    this.activeScenarioTimer = setInterval(() => {
      elapsed++;
      const progress = Math.min(1, elapsed / (totalSteps * 0.7)); // Reach peak at 70% of duration

      if (scenario === 'FLOOD') {
        // Ramp waterLevel 22 -> 96 cm, rainfall 5 -> 85 mm/hr
        const waterLevel = 22 + (96 - 22) * progress;
        const rainfall = 5 + (85 - 5) * progress;
        this.generator.setOverride(targetDeviceId, { waterLevel, rainfall });
      } else if (scenario === 'EARTHQUAKE') {
        // Seismic violent shockwave acceleration: peak at 2.4 g
        const peak = Math.sin(progress * Math.PI) * 2.5;
        const acceleration = Math.max(0.1, peak);
        this.generator.setOverride(targetDeviceId, { acceleration });
      } else if (scenario === 'LANDSLIDE') {
        // High soil saturation 40% -> 92%, heavy continuous rainfall
        const soilMoisture = 40 + (92 - 40) * progress;
        const rainfall = 10 + (65 - 10) * progress;
        this.generator.setOverride(targetDeviceId, { soilMoisture, rainfall });
      }

      if (elapsed >= totalSteps) {
        logger.info(`Scenario ${scenario} completed. Returning to baseline.`);
        this.generator.setOverride(targetDeviceId, null);
        if (this.activeScenarioTimer) {
          clearInterval(this.activeScenarioTimer);
          this.activeScenarioTimer = null;
        }
      }
    }, intervalMs);
  }
}
