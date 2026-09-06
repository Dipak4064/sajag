// Bound database work before it reaches Prisma's connection queue.
export class IngestionGate {
  private active = 0;
  private maxConcurrent = Number(process.env.TELEMETRY_MAX_CONCURRENT || 2);

  async run<T>(work: () => Promise<T>): Promise<T> {
    if (this.active >= this.maxConcurrent) {
      throw Object.assign(new Error('Telemetry busy; wait before sending the next reading.'), { statusCode: 503 });
    }
    this.active++;
    try { return await work(); }
    finally { this.active--; }
  }
}
