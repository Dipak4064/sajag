import { DisasterType, RiskScoreBreakdown, SensorValues, SeverityLevel } from '@sajag/types';

export class RiskEngineService {
  /**
   * Evaluates incoming raw sensor values and computes normalized individual
   * component scores and weighted overall risk score (0 - 100).
   *
   * Formula:
   * RiskScore = 0.30 * earthquakeScore + 0.25 * rainfallScore + 0.20 * soilScore + 0.25 * waterScore
   */
  public evaluate(sensors: SensorValues): {
    breakdown: RiskScoreBreakdown;
    primaryDisasterType: DisasterType;
    isAlertTriggerRequired: boolean;
  } {
    // 1. Normalize earthquake / acceleration score (0 - 100)
    // Baseline noise: ~0.1 - 0.2 g. M4+ quake produces > 0.6g. Severe quake > 1.8g.
    const earthquakeScore = Math.min(
      100,
      Math.max(0, ((sensors.acceleration - 0.15) / 1.85) * 100)
    );

    // 2. Normalize water level score (0 - 100)
    // Normal: 15 - 28 cm. Warning: > 60 cm. Danger/Overflow: > 85 cm.
    const waterScore = Math.min(
      100,
      Math.max(0, ((sensors.waterLevel - 20) / 70) * 100)
    );

    // 3. Normalize soil moisture score (0 - 100)
    // Normal: 25 - 45%. Saturated high landslide danger: > 85%.
    const soilScore = Math.min(
      100,
      Math.max(0, ((sensors.soilMoisture - 30) / 60) * 100)
    );

    // 4. Normalize rainfall score (0 - 100)
    // Normal: 0 - 10 mm/hr. Torrential danger: > 60 mm/hr.
    const rainfallScore = Math.min(
      100,
      Math.max(0, (sensors.rainfall / 75) * 100)
    );

    // 5. Weighted Overall Risk Score
    const overallScore = Number(
      (
        0.30 * earthquakeScore +
        0.25 * rainfallScore +
        0.20 * soilScore +
        0.25 * waterScore
      ).toFixed(1)
    );

    // 6. Assign Severity Level
    let severity: SeverityLevel = 'LOW';
    if (overallScore >= 80) {
      severity = 'CRITICAL';
    } else if (overallScore >= 60) {
      severity = 'HIGH';
    } else if (overallScore >= 30) {
      severity = 'MODERATE';
    }

    // 7. Determine Primary Disaster Type
    let primaryDisasterType: DisasterType = 'OTHER';
    const maxVal = Math.max(earthquakeScore, waterScore, soilScore);

    if (maxVal === earthquakeScore && earthquakeScore >= 40) {
      primaryDisasterType = 'EARTHQUAKE';
    } else if (maxVal === waterScore && waterScore >= 40) {
      primaryDisasterType = 'FLOOD';
    } else if (maxVal === soilScore && soilScore >= 40) {
      primaryDisasterType = 'LANDSLIDE';
    } else if (rainfallScore >= 50) {
      primaryDisasterType = 'STORM';
    }

    // Trigger alert pipeline when severity is HIGH or CRITICAL
    const isAlertTriggerRequired = overallScore >= 60;

    return {
      breakdown: {
        earthquakeScore: Number(earthquakeScore.toFixed(1)),
        waterScore: Number(waterScore.toFixed(1)),
        soilScore: Number(soilScore.toFixed(1)),
        rainfallScore: Number(rainfallScore.toFixed(1)),
        overallScore,
        severity
      },
      primaryDisasterType,
      isAlertTriggerRequired
    };
  }
}

export const riskEngine = new RiskEngineService();
