import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import {
  Gender,
  LivestockStatus,
  PrismaClient,
} from '../src/generated/prisma/client';
import * as dotenv from 'dotenv';
import bcrypt from 'bcrypt';

dotenv.config();

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST!,
  user: process.env.DATABASE_USER!,
  password: process.env.DATABASE_PASSWORD!,
  database: process.env.DATABASE_NAME!,
});

const prisma = new PrismaClient({
  adapter,
});

// --- Fungsi Bantuan (Helpers) ---

// Menghasilkan tanggal acak di antara dua tanggal
function getRandomDate(start: Date, end: Date) {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
}

// Mengambil elemen acak dari sebuah array
function getRandomElement<T>(arr: T[]): T {
  const data = arr[Math.floor(Math.random() * arr.length)];
  if (!data) throw Error('Not found');
  return data;
}

async function main() {
  console.log('🌱 Memulai proses seeding data...');

  // 1. Setup User Admin
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@farm.local';
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || 'password123',
    10,
  );

  // Dummy OTP (karena field ini required di skema)
  const otpExpiration = new Date();
  otpExpiration.setHours(otpExpiration.getHours() + 1);

  const adminUser = await prisma.user.upsert({
    where: { username: adminUsername },
    update: {}, // Jika sudah ada, jangan diubah
    create: {
      username: adminUsername,
      email: adminEmail, // Dummy email required
      password: adminPassword,
      role: 'admin', // Cast sebagai 'any' untuk mengabaikan tipe enum jika namanya berbeda di Prisma
      fullName: 'Administrator Peternakan',
      otpCode: '123456',
      otpExpiration: otpExpiration,
      isVerified: true,
    },
  });
  console.log(`✅ User admin '${adminUser.username}' siap.`);

  // 2. Setup Farm untuk Admin
  const adminFarm = await prisma.farm.upsert({
    where: { userId: adminUser.id },
    update: {},
    create: {
      userId: adminUser.id,
      name: 'Peternakan Utama Admin',
      address: 'Jl. Agro Industri No. 1, Jakarta',
      latitude: -6.2,
      longitude: 106.8,
      description: 'Peternakan pusat yang dikelola oleh admin utama.',
    },
  });
  console.log(`✅ Farm '${adminFarm.name}' siap.`);

  // 3. Data Template (farmId: null) & Duplikasi (farmId: adminFarm.id)
  const animalTypesData = [
    { code: 'sapi', label: 'Sapi' },
    { code: 'kambing', label: 'Kambing' },
    { code: 'domba', label: 'Domba' },
    { code: 'ayam', label: 'Ayam' },
    { code: 'bebek', label: 'Bebek' },
    { code: 'kelinci', label: 'Kelinci' },
  ];

  const conditionTypesData = [
    { code: 'sehat', label: 'Sehat' },
    { code: 'sakit', label: 'Sakit' },
    { code: 'lahir', label: 'Lahir' },
    { code: 'mati', label: 'Mati' },
    { code: 'bunting', label: 'Bunting' },
  ];

  const vaccinesData = [
    {
      code: 'lumpy-skin-disease',
      name: 'Lumpy Skin Disease',
      description: 'Vaksin LSD untuk ternak',
    },
    {
      code: 'foot-and-mouth-disease',
      name: 'Foot and Mouth Disease',
      description: 'Vaksin Penyakit Mulut dan Kuku',
    },
    {
      code: 'anthrax-vaccine',
      name: 'Anthrax Vaccine',
      description: 'Vaksin Antraks',
    },
  ];

  console.log('⚙️ Menyisipkan data template global dan duplikasinya...');

  // Menggunakan createMany dengan skipDuplicates agar aman dijalankan berulang
  await prisma.animalType.createMany({
    data: [
      ...animalTypesData.map((d) => ({ ...d, farmId: null })),
      ...animalTypesData.map((d) => ({ ...d, farmId: adminFarm.id })),
    ],
    skipDuplicates: true,
  });

  await prisma.conditionType.createMany({
    data: [
      ...conditionTypesData.map((d) => ({ ...d, farmId: null })),
      ...conditionTypesData.map((d) => ({ ...d, farmId: adminFarm.id })),
    ],
    skipDuplicates: true,
  });

  await prisma.vaccine.createMany({
    data: [
      ...vaccinesData.map((d) => ({ ...d, farmId: null })),
      ...vaccinesData.map((d) => ({ ...d, farmId: adminFarm.id })),
    ],
    skipDuplicates: true,
  });

  // Ambil referensi ID spesifik milik Farm Admin untuk merelasikan Livestocks
  const farmAnimalTypes = await prisma.animalType.findMany({
    where: { farmId: adminFarm.id },
  });
  const farmConditionTypes = await prisma.conditionType.findMany({
    where: { farmId: adminFarm.id },
  });
  const farmVaccines = await prisma.vaccine.findMany({
    where: { farmId: adminFarm.id },
  });

  // 4. Generate 50 Livestocks
  const livestockCount = await prisma.livestock.count({
    where: { farmId: adminFarm.id },
  });

  if (livestockCount < 50) {
    console.log('🐄 Menyiapkan populasi 45 indukan (Founders)...');
    const foundersToCreate: {
      farmId: number;
      tagId: string;
      name: string;
      animalTypeId: number;
      gender: Gender;
      birthDate: Date;
      status: LivestockStatus;
    }[] = [];

    // Indukan lahir antara 2020 hingga akhir 2023
    const startFounderDate = new Date(2020, 0, 1);
    const endFounderDate = new Date(2023, 11, 31);

    for (let i = 1; i <= 45; i++) {
      const animalType = getRandomElement(farmAnimalTypes);
      const gender = getRandomElement(Object.values(Gender));
      const status = getRandomElement(Object.values(LivestockStatus));
      const birthDate = getRandomDate(startFounderDate, endFounderDate);

      foundersToCreate.push({
        farmId: adminFarm.id,
        tagId: `${animalType.code}-TAG-${i.toString().padStart(3, '0')}`,
        name: `${animalType.label} Indukan ${i}`,
        animalTypeId: animalType.id,
        gender: gender,
        birthDate: birthDate,
        status: status,
      });
    }

    // Insert 45 indukan ke database
    await prisma.livestock.createMany({
      data: foundersToCreate,
      skipDuplicates: true,
    });

    // Tarik kembali data indukan untuk mendapatkan ID asli yang di-generate database
    const insertedFounders = await prisma.livestock.findMany({
      where: { farmId: adminFarm.id },
    });

    console.log(
      '🧬 Menyiapkan populasi 5 keturunan (Offspring) dengan silsilah...',
    );
    const offspringsToCreate: {
      farmId: number;
      tagId: string;
      name: string;
      animalTypeId: number;
      gender: Gender;
      birthDate: Date;
      status: LivestockStatus;
      fatherId: number | null;
      motherId: number | null;
    }[] = [];

    // Cari tipe hewan apa saja yang memiliki setidaknya 1 jantan dan 1 betina dari data indukan
    const validTypesForBreeding = farmAnimalTypes.filter((type) => {
      const hasMale = insertedFounders.some(
        (f) => f.animalTypeId === type.id && f.gender === 'male',
      );
      const hasFemale = insertedFounders.some(
        (f) => f.animalTypeId === type.id && f.gender === 'female',
      );
      return hasMale && hasFemale;
    });

    // Fallback darurat jika probabilitas acak meleset (sangat jarang terjadi)
    const typesToUse =
      validTypesForBreeding.length > 0
        ? validTypesForBreeding
        : farmAnimalTypes;

    for (let i = 46; i <= 50; i++) {
      // Pilih tipe hewan yang terjamin punya ayah dan ibu
      const animalType = getRandomElement(typesToUse);

      const potentialFathers = insertedFounders.filter(
        (f) =>
          f.animalTypeId === animalType.id &&
          f.gender === 'male' &&
          f.birthDate,
      );
      const potentialMothers = insertedFounders.filter(
        (f) =>
          f.animalTypeId === animalType.id &&
          f.gender === 'female' &&
          f.birthDate,
      );

      let fatherId: number | null = null;
      let motherId: number | null = null;
      let childBirthDate = new Date();

      if (potentialFathers.length > 0 && potentialMothers.length > 0) {
        const father = getRandomElement(potentialFathers);
        const mother = getRandomElement(potentialMothers);

        fatherId = father.id;
        motherId = mother.id;

        // Logika Biologis: Anak lahir minimal 1 tahun (kedewasaan) setelah orang tua paling muda
        const latestParentDate =
          father.birthDate! > mother.birthDate!
            ? father.birthDate!
            : mother.birthDate!;

        const minChildBirthDate = new Date(latestParentDate.getTime());
        minChildBirthDate.setFullYear(minChildBirthDate.getFullYear() + 1);

        const today = new Date();

        // Pastikan kalkulasi tanggal tidak melebihi hari ini
        if (minChildBirthDate >= today) {
          childBirthDate = today;
        } else {
          childBirthDate = getRandomDate(minChildBirthDate, today);
        }
      } else {
        // Fallback jika tidak ada indukan yang cocok
        childBirthDate = getRandomDate(new Date(2024, 0, 1), new Date());
      }

      offspringsToCreate.push({
        farmId: adminFarm.id,
        tagId: `${animalType.code}-TAG-${i.toString().padStart(3, '0')}`,
        name: `${animalType.label} Keturunan ${i}`,
        animalTypeId: animalType.id,
        gender: getRandomElement(Object.values(Gender)),
        birthDate: childBirthDate,
        status: LivestockStatus.active,
        fatherId: fatherId,
        motherId: motherId,
      });
    }

    // Insert 5 keturunan bersilsilah
    await prisma.livestock.createMany({
      data: offspringsToCreate,
      skipDuplicates: true,
    });
    console.log(
      `✅ Berhasil menyisipkan 50 data Livestock (45 Indukan + 5 Anak dengan silsilah).`,
    );
  } else {
    console.log(
      `ℹ️ Data Livestock sudah ada (${livestockCount} records). Skip pembuatan livestock.`,
    );
  }

  // 5. Generate Condition & Vaccination Histories
  const allLivestocks = await prisma.livestock.findMany({
    where: { farmId: adminFarm.id },
  });
  const conditionsToCreate: {
    livestockId: number;
    conditionTypeId: number;
    recordDate: Date;
    notes: string;
  }[] = [];
  const vaccinesToCreate: {
    livestockId: number;
    vaccineId: number;
    isVaccinated: boolean;
    vaccinationDate: Date;
    batchNumber: string;
    notes: string;
  }[] = [];

  // Pengecekan agar tidak generate terus menerus jika sudah ada
  const existingConditions = await prisma.conditionHistory.count({
    where: { livestock: { farmId: adminFarm.id } },
  });

  if (existingConditions === 0 && allLivestocks.length > 0) {
    for (const livestock of allLivestocks) {
      if (!livestock.birthDate) continue;

      // Randomize 1-3 riwayat kondisi per ternak
      const numConditions = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numConditions; j++) {
        const condition = getRandomElement(farmConditionTypes);
        // Pastikan tanggal record logis (selalu setelah tanggal lahir ternak)
        const recordDate = getRandomDate(livestock.birthDate, new Date());

        conditionsToCreate.push({
          livestockId: livestock.id,
          conditionTypeId: condition.id,
          recordDate: recordDate,
          notes: `Catatan otomatis kondisi: ${condition.label}`,
        });
      }

      // Randomize 0-2 riwayat vaksinasi per ternak
      const numVaccines = Math.floor(Math.random() * 3);
      for (let k = 0; k < numVaccines; k++) {
        const vaccine = getRandomElement(farmVaccines);
        const vaxDate = getRandomDate(livestock.birthDate, new Date());

        vaccinesToCreate.push({
          livestockId: livestock.id,
          vaccineId: vaccine.id,
          isVaccinated: true,
          vaccinationDate: vaxDate,
          batchNumber: `BCH-${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0')}`,
          notes: `Vaksinasi rutin ${vaccine.name}`,
        });
      }
    }

    await prisma.conditionHistory.createMany({ data: conditionsToCreate });
    await prisma.vaccinationHistory.createMany({ data: vaccinesToCreate });

    console.log(
      `✅ Berhasil menambahkan ${conditionsToCreate.length} riwayat kondisi & ${vaccinesToCreate.length} riwayat vaksinasi yang logis.`,
    );
  } else {
    console.log(
      `ℹ️ Data riwayat (histories) sudah terisi. Skip pembuatan history.`,
    );
  }

  console.log('🎉 Seeding selesai dengan sukses!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Terjadi kesalahan saat seeding:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
