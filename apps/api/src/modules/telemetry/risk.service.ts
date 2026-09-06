import { DisasterType, RiskScoreBreakdown, SensorValues, SeverityLevel } from '#sajag-types';

export class RiskEngineService {
  public evaluate(sensors: SensorValues): {
    breakdown: RiskScoreBreakdown;
    primaryDisasterType: DisasterType;
    isAlertTriggerRequired: boolean;
  } {
    const earthquakeScore = Math.min(
      100,
      Math.max(0, ((sensors.acceleration - 0.15) / 1.85) * 100)
    );

    const waterScore = Math.min(
      100,
      Math.max(0, ((sensors.waterLevel - 20) / 70) * 100)
    );

    const soilScore = Math.min(
      100,
      Math.max(0, ((sensors.soilMoisture - 30) / 60) * 100)
    );

    const rainfallScore = Math.min(
      100,
      Math.max(0, (sensors.rainfall / 75) * 100)
    );

    const weightedBaseline = (
      0.30 * earthquakeScore +
      0.25 * rainfallScore +
      0.20 * soilScore +
      0.25 * waterScore
    );

    const dominantHazard = Math.max(
      earthquakeScore,
      waterScore * 0.7 + rainfallScore * 0.3,
      soilScore * 0.6 + rainfallScore * 0.4
    );

    const overallScore = Number(Math.max(weightedBaseline, dominantHazard).toFixed(1));

    let severity: SeverityLevel = 'LOW';
    if (overallScore >= 80) {
      severity = 'CRITICAL';
    } else if (overallScore >= 60) {
      severity = 'HIGH';
    } else if (overallScore >= 30) {
      severity = 'MODERATE';
    }

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
