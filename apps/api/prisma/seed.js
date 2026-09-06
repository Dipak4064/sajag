"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 Seeding Kathmandu Valley Disaster Platform Data...');
    // 1. Clean existing records in dependency order
    await prisma.userResponse.deleteMany();
    await prisma.alert.deleteMany();
    await prisma.disasterEvent.deleteMany();
    await prisma.sensorReading.deleteMany();
    await prisma.sOSRequest.deleteMany();
    await prisma.citizenReport.deleteMany();
    await prisma.rescueTeam.deleteMany();
    await prisma.shelter.deleteMany();
    await prisma.user.deleteMany();
    await prisma.device.deleteMany();
    await prisma.municipality.deleteMany();
    // 2. Municipality
    const municipality = await prisma.municipality.create({
        data: {
            name: 'Kathmandu Metropolitan City (काठमाडौँ महानगरपालिका)'
        }
    });
    // 3. 8 Kathmandu Virtual ESP32 Devices
    const devicesData = [
        {
            deviceId: 'ESP32-KTM-001',
            name: 'Bagmati River - Balkhu Bridge Station',
            latitude: 27.6895,
            longitude: 85.3021,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        },
        {
            deviceId: 'ESP32-KTM-002',
            name: 'Bishnumati River - Shova Bhagwati Station',
            latitude: 27.7153,
            longitude: 85.3015,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        },
        {
            deviceId: 'ESP32-KTM-003',
            name: 'Shivapuri Hillside - Sundarijal Catchment',
            latitude: 27.7942,
            longitude: 85.3850,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        },
        {
            deviceId: 'ESP32-KTM-004',
            name: 'Patan Historical Core - Lalitpur',
            latitude: 27.6726,
            longitude: 85.3255,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        },
        {
            deviceId: 'ESP32-KTM-005',
            name: 'Hanumante River - Bhaktapur Lowlands',
            latitude: 27.6710,
            longitude: 85.4298,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        },
        {
            deviceId: 'ESP32-KTM-006',
            name: 'Chandragiri Escarpment - South-West Ridge',
            latitude: 27.6698,
            longitude: 85.2085,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        },
        {
            deviceId: 'ESP32-KTM-007',
            name: 'Kalanki Highway Transit Junction',
            latitude: 27.6934,
            longitude: 85.2816,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        },
        {
            deviceId: 'ESP32-KTM-008',
            name: 'Kirtipur Historic Ridge Station',
            latitude: 27.6798,
            longitude: 85.2755,
            status: 'ONLINE',
            transport: 'MQTT',
            municipalityId: municipality.id
        }
    ];
    for (const d of devicesData) {
        await prisma.device.create({ data: d });
    }
    // 4. Rescue Teams
    const rescueTeams = [
        {
            name: 'Nepal Army Disaster Management Directorate',
            teamType: 'ARMY',
            status: 'AVAILABLE',
            latitude: 27.7025,
            longitude: 85.3180,
            capacity: 12,
            leadOfficerName: 'Major Bikram Thapa',
            contactRadioFreq: 'VHF-145.200',
            municipalityId: municipality.id
        },
        {
            name: 'Armed Police Force (APF) Disaster Relief Team',
            teamType: 'POLICE',
            status: 'AVAILABLE',
            latitude: 27.6872,
            longitude: 85.3140,
            capacity: 8,
            leadOfficerName: 'Inspector Sunita Shrestha',
            contactRadioFreq: 'VHF-148.550',
            municipalityId: municipality.id
        },
        {
            name: 'Nepal Red Cross Society Rapid Response Unit',
            teamType: 'RED_CROSS',
            status: 'AVAILABLE',
            latitude: 27.7060,
            longitude: 85.3280,
            capacity: 10,
            leadOfficerName: 'Dr. Ramesh Adhikari',
            contactRadioFreq: 'VHF-151.100',
            municipalityId: municipality.id
        },
        {
            name: 'Kathmandu Fire Service & Rescue Unit (Juddha Barun Yantra)',
            teamType: 'FIRE_DEPARTMENT',
            status: 'AVAILABLE',
            latitude: 27.7042,
            longitude: 85.3095,
            capacity: 6,
            leadOfficerName: 'Officer Hari Bahadur Karki',
            contactRadioFreq: 'VHF-142.800',
            municipalityId: municipality.id
        }
    ];
    for (const rt of rescueTeams) {
        await prisma.rescueTeam.create({ data: rt });
    }
    // 5. Emergency Shelters
    const shelters = [
        {
            name: 'Dasarath Rangasala Stadium Open Haven',
            nameNe: 'दशरथ रङ्गशाला खुला सुरक्षित आश्रय स्थल',
            latitude: 27.6958,
            longitude: 85.3144,
            address: 'Tripureshwor, Kathmandu',
            totalCapacity: 1500,
            currentOccupancy: 120,
            hasMedicalFacility: true,
            hasFoodWater: true,
            hasBackupPower: true,
            isActive: true,
            municipalityId: municipality.id
        },
        {
            name: 'Bhrikutimandap Exhibition Ground Shelter',
            nameNe: 'भृकुटीमण्डप खुल्ला आश्रय क्षेत्र',
            latitude: 27.7018,
            longitude: 85.3182,
            address: 'Pradarshani Marg, Kathmandu',
            totalCapacity: 800,
            currentOccupancy: 45,
            hasMedicalFacility: true,
            hasFoodWater: true,
            hasBackupPower: true,
            isActive: true,
            municipalityId: municipality.id
        },
        {
            name: 'Pulchowk Engineering Campus Ground',
            nameNe: 'पुल्चोक इन्जिनियरिङ क्याम्पस खुला मैदान',
            latitude: 27.6789,
            longitude: 85.3175,
            address: 'Pulchowk, Lalitpur',
            totalCapacity: 600,
            currentOccupancy: 0,
            hasMedicalFacility: false,
            hasFoodWater: true,
            hasBackupPower: true,
            isActive: true,
            municipalityId: municipality.id
        },
        {
            name: 'Tribhuvan University Kirtipur Open Space',
            nameNe: 'त्रिभुवन विश्वविद्यालय खुला मैदान, कीर्तिपुर',
            latitude: 27.6811,
            longitude: 85.2855,
            address: 'Kirtipur, Kathmandu',
            totalCapacity: 2000,
            currentOccupancy: 0,
            hasMedicalFacility: true,
            hasFoodWater: true,
            hasBackupPower: false,
            isActive: true,
            municipalityId: municipality.id
        }
    ];
    for (const s of shelters) {
        await prisma.shelter.create({ data: s });
    }
    // 6. Users: Admin / Operator + 30 Kathmandu Residents
    const passwordHash = await bcryptjs_1.default.hash('Prakop123!', 10);
    // Operator
    await prisma.user.create({
        data: {
            name: 'Municipal Disaster Officer (KMC)',
            email: 'admin@kmc.gov.np',
            passwordHash,
            phone: '+9779841000000',
            role: 'AUTHORITY',
            latitude: 27.7000,
            longitude: 85.3200,
            status: 'SAFE',
            municipalityId: municipality.id
        }
    });
    // Demo Citizen
    await prisma.user.create({
        data: {
            name: 'Aayush Maharjan (Demo Citizen)',
            email: 'citizen@sajag.np',
            passwordHash,
            phone: '+9779800000001',
            role: 'CITIZEN',
            latitude: 27.6910,
            longitude: 27.3040, // Near Balkhu river
            status: 'UNKNOWN',
            municipalityId: municipality.id
        }
    });
    // 28 Residents around Kathmandu Valley
    const residentNames = [
        'Suman Shakya', 'Prabesh Joshi', 'Manita Shrestha', 'Roshan Tamang', 'Puja Rai',
        'Binod KC', 'Sarita Basnet', 'Anil Gurung', 'Dawa Sherpa', 'Sunil Ghimire',
        'Dipendra Poudel', 'Karuna Karki', 'Sushil Bhattarai', 'Urmila Dangol', 'Milan Bajracharya',
        'Subash Khadka', 'Bhawana Magar', 'Gopal Rijal', 'Pramila Gautam', 'Bipin Nepali',
        'Srijana Acharya', 'Kiran Lama', 'Anju Pandey', 'Manoj Bista', 'Sabina Thapa',
        'Dipak Sharma', 'Rita Silwal', 'Prakash Neupane'
    ];
    for (let i = 0; i < residentNames.length; i++) {
        // Distribute around Kathmandu center (27.70, 85.31) with ~3km spread
        const latOffset = (Math.random() - 0.5) * 0.05;
        const lngOffset = (Math.random() - 0.5) * 0.05;
        await prisma.user.create({
            data: {
                name: residentNames[i],
                email: `resident${i + 1}@example.np`,
                passwordHash,
                phone: `+9779841${String(100000 + i).padStart(6, '0')}`,
                role: 'CITIZEN',
                latitude: Number((27.7050 + latOffset).toFixed(4)),
                longitude: Number((85.3150 + lngOffset).toFixed(4)),
                status: 'UNKNOWN',
                municipalityId: municipality.id
            }
        });
    }
    console.log('✅ Seed completed: 1 Municipality, 8 Devices, 4 Rescue Teams, 4 Shelters, 30 Users.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map