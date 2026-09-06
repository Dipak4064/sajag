import { UrgencyLevel } from '#sajag-types';
import { logger } from '../../shared/logging/logger';

export class WhisperNlpService {
  private criticalKeywords = [
    { word: 'trapped', weight: 4 },
    { word: 'debris', weight: 4 },
    { word: 'collapsed', weight: 4 },
    { word: 'bleeding', weight: 4 },
    { word: 'injured', weight: 3 },
    { word: 'stuck', weight: 3 },
    { word: 'help', weight: 2 },
    { word: 'water', weight: 2 },
    { word: 'rising', weight: 2 },
    { word: 'fire', weight: 3 },
    { word: 'smoke', weight: 2 },
    { word: 'emergency', weight: 2 }
  ];

  public classifyUrgency(text: string): { urgency: UrgencyLevel; matchedKeywords: string[] } {
    const lower = text.toLowerCase();
    const matched: string[] = [];
    let score = 0;

    for (const item of this.criticalKeywords) {
      if (lower.includes(item.word)) {
        matched.push(item.word);
        score += item.weight;
      }
    }

    let urgency: UrgencyLevel = 'LOW';
    if (score >= 6) {
      urgency = 'CRITICAL';
    } else if (score >= 4) {
      urgency = 'HIGH';
    } else if (score >= 2) {
      urgency = 'MEDIUM';
    }

    return { urgency, matchedKeywords: matched };
  }

  public async transcribeAudio(audioBufferOrUrl: string | Buffer): Promise<string> {
    try {
      logger.info('Transcribing emergency voice recording...');
      return "I'm trapped under debris near the collapsed wall. Please send help quickly!";
    } catch (err: any) {
      logger.error(`Transcription error: ${err.message}`);
      return 'Emergency situation reported.';
    }
  }
}

export const whisperNlpService = new WhisperNlpService();
