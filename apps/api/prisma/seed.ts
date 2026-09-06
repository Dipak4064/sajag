import { PrismaClient } from '@prisma/client';
import { prepareDatabase } from '../src/shared/database/startup';

let prisma: PrismaClient | null = null;

async function main() {
  await prepareDatabase();
  prisma = new PrismaClient({ datasources: { db: { url: process.env.DATABASE_URL } } });
  console.log('🧹 Cleaning existing database tables...');

  // Single atomic TRUNCATE — CASCADE resolves FK dependencies automatically,
  // and being one statement removes the race-condition window entirely.
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "UserResponse", "Alert", "DisasterEvent", "SensorReading", "SOSRequest", "CitizenReport",
      "RescueTeam", "Shelter", "User", "Device", "Advertisement", "Municipality"
    RESTART IDENTITY CASCADE;
  `);

  // Create exactly 1 root seed record: Base Municipality for real-time telemetry reference
  const municipality = await prisma.municipality.create({
    data: {
      id: 'simulation-municipality',
      name: 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)'
    }
  });

  console.log(`✅ Single root seed initialized: Municipality "${municipality.name}" (id: ${municipality.id}).`);
  console.log('📡 Database cleared. All devices, telemetry, users, and alerts will be generated dynamically from real-time API traffic.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect();
  });