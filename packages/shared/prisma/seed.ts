import { PrismaClient, Role, Gender, Relationship, ProcessingStageStatus } from '@prisma/client';
import { hashPassword } from '../../../apps/api/src/lib/password.js';

const prisma = new PrismaClient();

const CROP_PROCURED_FORMS = {
  Turmeric: ['Fresh Finger', 'Fresh Bulb', 'Dried Finger', 'Dried Bulb'],
  Coffee: ['Fruit', 'Dry Cherry', 'Parchment'],
  Ginger: ['Fresh', 'Dried'],
  Pepper: ['Green Pepper', 'Black Pepper'],
  Wheat: ['Raw Grain', 'Cleaned Grain'],
} as const;

function generateProcurementNumberForSeed(
  crop: string,
  date: Date | undefined,
  lotNo: number,
  counter: number
): string {
  if (!date) {
    console.warn('Date is undefined for generateProcurementNumberForSeed. Using current date as fallback.');
    date = new Date();
  }
  const cropCode = crop.slice(0, 3).toUpperCase();
  const dateCode = date.toISOString().split('T')[0]?.replace(/-/g, '') || 'NODATE';
  const lotCode = lotNo.toString();
  const counterStr = counter.toString().padStart(3, '0');

  return `${cropCode}${dateCode}${lotCode}${counterStr}`.padEnd(16, 'X');
}

function generateProcessingBatchCodeForSeed(
  crop: string,
  lotNo: number,
  dateOfProcessing: Date | undefined,
  counter: number
): string {
  if (!dateOfProcessing) {
    console.warn(
      'DateOfProcessing is undefined for generateProcessingBatchCodeForSeed. Using current date as fallback.'
    );
    dateOfProcessing = new Date();
  }
  const cropCode = crop.slice(0, 3).toUpperCase();
  const dateCode = dateOfProcessing.toISOString().split('T')[0]?.replace(/-/g, '') || 'NODATEPBC';
  const lotStr = lotNo.toString();
  // Using a more random suffix to improve uniqueness for seed data
  const suffix =
    (Math.random().toString(36).substring(2, 7) + Math.random().toString(36).substring(2, 7)).toUpperCase() +
    counter.toString();
  return `PBC-${cropCode}-${lotStr}-${dateCode}-${suffix}`;
}

async function main() {
  console.log(`Start seeding ...`);

  const adminPassword = await hashPassword('Admin@123');
  const staffPassword = await hashPassword('Staff@123');

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { password: adminPassword },
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      isEnabled: true,
    },
  });

  const staffUser = await prisma.user.upsert({
    where: { email: 'staff@example.com' },
    update: { password: staffPassword },
    create: {
      email: 'staff@example.com',
      name: 'Staff User',
      password: staffPassword,
      role: Role.STAFF,
      isEnabled: true,
    },
  });
  console.log(`Created users: ${adminUser.name}, ${staffUser.name}`);

  const farmer1 = await prisma.farmer.upsert({
    where: { surveyNumber: 'FARMSEED001' },
    update: {},
    create: {
      surveyNumber: 'FARMSEED001',
      name: 'Seeder Farmer One',
      relationship: Relationship.SELF,
      gender: Gender.MALE,
      community: 'General',
      aadharNumber: '111122223333',
      state: 'State A',
      district: 'District X',
      mandal: 'Mandal P',
      village: 'Village Alpha',
      panchayath: 'Alpha GP',
      dateOfBirth: new Date('1975-05-10'),
      age: 49,
      contactNumber: '9000000001',
      createdById: adminUser.id,
      updatedById: adminUser.id,
      bankDetails: {
        create: {
          ifscCode: 'IFSC001',
          bankName: 'Seed Bank',
          branchName: 'Main',
          accountNumber: 'ACC001',
          address: 'Bank Address',
          bankCode: 'SB01',
        },
      },
      documents: {
        create: {
          profilePicUrl: 'https://placehold.co/400',
          aadharDocUrl: 'https://placehold.co/doc.pdf',
          bankDocUrl: 'https://placehold.co/doc.pdf',
        },
      },
    },
  });
  const farmer2 = await prisma.farmer.upsert({
    where: { surveyNumber: 'FARMSEED002' },
    update: {},
    create: {
      surveyNumber: 'FARMSEED002',
      name: 'Seeder Farmer Two',
      relationship: Relationship.SELF,
      gender: Gender.FEMALE,
      community: 'OBC',
      aadharNumber: '444455556666',
      state: 'State B',
      district: 'District Y',
      mandal: 'Mandal Q',
      village: 'Village Beta',
      panchayath: 'Beta GP',
      dateOfBirth: new Date('1980-11-20'),
      age: 43,
      contactNumber: '9000000002',
      createdById: staffUser.id,
      updatedById: staffUser.id,
      bankDetails: {
        create: {
          ifscCode: 'IFSC002',
          bankName: 'Agri Bank',
          branchName: 'Rural',
          accountNumber: 'ACC002',
          address: 'Agri Address',
          bankCode: 'AG01',
        },
      },
      documents: {
        create: {
          profilePicUrl: 'https://placehold.co/400',
          aadharDocUrl: 'https://placehold.co/doc.pdf',
          bankDocUrl: 'https://placehold.co/doc.pdf',
        },
      },
    },
  });
  console.log(`Created farmers: ${farmer1.name}, ${farmer2.name}`);

  const procurementBaseDate = new Date();
  procurementBaseDate.setDate(procurementBaseDate.getDate() - 10); // 10 days ago

  // Procurements for Turmeric - Lot 1
  const procTurmeric1F1L1 = await prisma.procurement.create({
    data: {
      farmerId: farmer1.id,
      crop: 'Turmeric',
      procuredForm: CROP_PROCURED_FORMS.Turmeric[0], // Fresh Finger
      speciality: 'Organic',
      quantity: 120.5,
      procurementNumber: generateProcurementNumberForSeed('Turmeric', procurementBaseDate, 1, 1),
      date: procurementBaseDate,
      time: new Date(new Date(procurementBaseDate).setHours(9, 0, 0, 0)),
      lotNo: 1,
      procuredBy: staffUser.name,
      vehicleNo: 'TS01AA1111',
    },
  });
  const procTurmeric2F2L1 = await prisma.procurement.create({
    data: {
      farmerId: farmer2.id,
      crop: 'Turmeric',
      procuredForm: CROP_PROCURED_FORMS.Turmeric[0], // Fresh Finger
      speciality: 'Standard',
      quantity: 80.0,
      procurementNumber: generateProcurementNumberForSeed('Turmeric', procurementBaseDate, 1, 2),
      date: procurementBaseDate,
      time: new Date(new Date(procurementBaseDate).setHours(9, 30, 0, 0)),
      lotNo: 1,
      procuredBy: staffUser.name,
    },
  });
  // const procTurmeric3F1L1DF = await prisma.procurement.create({
  //   data: {
  //     farmerId: farmer1.id,
  //     crop: 'Turmeric',
  //     procuredForm: CROP_PROCURED_FORMS.Turmeric[2], // Dried Finger
  //     speciality: 'Organic',
  //     quantity: 50.0,
  //     procurementNumber: generateProcurementNumberForSeed('Turmeric', procurementBaseDate, 1, 3),
  //     date: procurementBaseDate,
  //     time: new Date(new Date(procurementBaseDate).setHours(10, 0, 0, 0)),
  //     lotNo: 1,
  //     procuredBy: staffUser.name,
  //   },
  // });

  // Procurements for Coffee - Lot 1
  // const procCoffee1F1L1 = await prisma.procurement.create({
  //   data: {
  //     farmerId: farmer1.id,
  //     crop: 'Coffee',
  //     procuredForm: CROP_PROCURED_FORMS.Coffee[1], // Dry Cherry
  //     speciality: 'Fair Trade',
  //     quantity: 250.0,
  //     procurementNumber: generateProcurementNumberForSeed('Coffee', procurementBaseDate, 1, 1),
  //     date: procurementBaseDate,
  //     time: new Date(new Date(procurementBaseDate).setHours(11, 0, 0, 0)),
  //     lotNo: 1,
  //     procuredBy: adminUser.name,
  //     vehicleNo: 'KA02BB2222',
  //   },
  // });
  // const procCoffee2F2L1 = await prisma.procurement.create({
  //   data: {
  //     farmerId: farmer2.id,
  //     crop: 'Coffee',
  //     procuredForm: CROP_PROCURED_FORMS.Coffee[1], // Dry Cherry
  //     speciality: 'Standard',
  //     quantity: 180.5,
  //     procurementNumber: generateProcurementNumberForSeed('Coffee', procurementBaseDate, 1, 2),
  //     date: procurementBaseDate,
  //     time: new Date(new Date(procurementBaseDate).setHours(11, 30, 0, 0)),
  //     lotNo: 1,
  //     procuredBy: adminUser.name,
  //   },
  // });

  // Procurements for Ginger - Lot 2 (Farmer 1)
  // const procGinger1F1L2 = await prisma.procurement.create({
  //   data: {
  //     farmerId: farmer1.id,
  //     crop: 'Ginger',
  //     procuredForm: CROP_PROCURED_FORMS.Ginger[0], // Fresh
  //     speciality: 'Organic',
  //     quantity: 75.5,
  //     procurementNumber: generateProcurementNumberForSeed('Ginger', procurementBaseDate, 2, 1),
  //     date: procurementBaseDate,
  //     time: new Date(new Date(procurementBaseDate).setHours(14, 0, 0, 0)),
  //     lotNo: 2,
  //     procuredBy: staffUser.name,
  //   },
  // });

  console.log(`Created various procurements.`);

  // --- Processing Batch example for Turmeric, Lot 1, Fresh Finger ---
  const turmericBatchInitialQty = procTurmeric1F1L1.quantity + procTurmeric2F2L1.quantity;
  const turmericP1Date = new Date();
  turmericP1Date.setDate(turmericP1Date.getDate() - 7); // 7 days ago

  const turmericBatchCode = generateProcessingBatchCodeForSeed('Turmeric', 1, turmericP1Date, 1);
  const turmericProcessingBatch = await prisma.processingBatch.create({
    data: {
      batchCode: turmericBatchCode,
      crop: 'Turmeric',
      lotNo: 1,
      initialBatchQuantity: turmericBatchInitialQty,
      createdById: adminUser.id,
      procurements: {
        connect: [{ id: procTurmeric1F1L1.id }, { id: procTurmeric2F2L1.id }],
      },
      processingStages: {
        create: {
          processingCount: 1,
          processMethod: 'dry',
          initialQuantity: turmericBatchInitialQty,
          dateOfProcessing: turmericP1Date,
          doneBy: 'Turmeric P1 Seed Team',
          status: ProcessingStageStatus.IN_PROGRESS,
          createdById: adminUser.id,
        },
      },
    },
    include: { processingStages: { orderBy: { processingCount: 'asc' } } },
  });

  if (!turmericProcessingBatch.processingStages || turmericProcessingBatch.processingStages.length === 0) {
    console.error(`Failed to create P1 stage for Turmeric batch ${turmericProcessingBatch.batchCode}.`);
  } else {
    const p1Turmeric = turmericProcessingBatch.processingStages[0];
    if (!p1Turmeric || typeof p1Turmeric.id === 'undefined') {
      console.error(`P1 Turmeric stage object is invalid for batch ${turmericProcessingBatch.batchCode}.`);
    } else {
      console.log(`Created Turmeric batch: ${turmericProcessingBatch.batchCode} with P1: ${p1Turmeric.id}`);

      let currentDryingQty = p1Turmeric.initialQuantity;
      for (let i = 1; i <= 2; i++) {
        currentDryingQty -= Math.random() * 5 + 1;
        await prisma.drying.create({
          data: {
            processingStageId: p1Turmeric.id,
            day: i,
            temperature: 35 + Math.random() * 5,
            humidity: 40 + Math.random() * 10,
            pH: 6.0 + Math.random() * 0.5,
            moisturePercentage: 50 - i * 10,
            currentQuantity: parseFloat(currentDryingQty.toFixed(2)),
          },
        });
      }
      console.log(`Added drying entries for Turmeric P1.`);

      const p1TurmericFinalYield = parseFloat(currentDryingQty.toFixed(2)) - (Math.random() * 2 + 0.5);
      const finalizedP1Turmeric = await prisma.processingStage.update({
        where: { id: p1Turmeric.id },
        data: {
          status: ProcessingStageStatus.FINISHED,
          dateOfCompletion: new Date(new Date(turmericP1Date).setDate(turmericP1Date.getDate() + 2)),
          quantityAfterProcess: parseFloat(p1TurmericFinalYield.toFixed(2)),
        },
      });
      console.log(`Finalized Turmeric P1. Yield: ${finalizedP1Turmeric.quantityAfterProcess}kg`);

      if (finalizedP1Turmeric.quantityAfterProcess && finalizedP1Turmeric.quantityAfterProcess > 10) {
        await prisma.sale.create({
          data: {
            processingBatchId: turmericProcessingBatch.id,
            processingStageId: finalizedP1Turmeric.id,
            quantitySold: 10,
            dateOfSale: new Date(),
            createdById: staffUser.id,
          },
        });
        console.log(`Sold 10kg from Turmeric P1.`);
      }
    }
  }

  console.log(`Seeding finished.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async e => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
