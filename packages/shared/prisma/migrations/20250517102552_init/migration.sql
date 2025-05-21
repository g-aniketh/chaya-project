-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'OTHER');

-- CreateEnum
CREATE TYPE "Relationship" AS ENUM ('SELF', 'SPOUSE', 'CHILD', 'OTHER');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'STAFF');

-- CreateEnum
CREATE TYPE "ProcessingStageStatus" AS ENUM ('IN_PROGRESS', 'FINISHED', 'CANCELLED');

-- CreateTable
CREATE TABLE "Ping" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STAFF',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmers" (
    "id" SERIAL NOT NULL,
    "surveyNumber" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" "Relationship" NOT NULL,
    "gender" "Gender" NOT NULL,
    "community" TEXT NOT NULL,
    "aadharNumber" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "mandal" TEXT NOT NULL,
    "village" TEXT NOT NULL,
    "panchayath" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "age" INTEGER NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdById" INTEGER NOT NULL,
    "updatedById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "farmer_documents" (
    "id" SERIAL NOT NULL,
    "profilePicUrl" TEXT NOT NULL,
    "aadharDocUrl" TEXT NOT NULL,
    "bankDocUrl" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farmer_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bank_details" (
    "id" SERIAL NOT NULL,
    "ifscCode" TEXT NOT NULL,
    "bankName" TEXT NOT NULL,
    "branchName" TEXT NOT NULL,
    "accountNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "bankCode" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_details_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fields" (
    "id" SERIAL NOT NULL,
    "areaHa" DOUBLE PRECISION NOT NULL,
    "yieldEstimate" DOUBLE PRECISION NOT NULL,
    "location" JSONB NOT NULL,
    "landDocumentUrl" TEXT NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "procurements" (
    "id" SERIAL NOT NULL,
    "farmerId" INTEGER NOT NULL,
    "crop" TEXT NOT NULL,
    "procuredForm" TEXT NOT NULL,
    "speciality" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "batchCode" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,
    "lotNo" INTEGER NOT NULL,
    "procuredBy" TEXT NOT NULL,
    "vehicleNo" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processingBatchId" INTEGER,

    CONSTRAINT "procurements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_batches" (
    "id" SERIAL NOT NULL,
    "batchCode" TEXT NOT NULL,
    "crop" TEXT NOT NULL,
    "lotNo" INTEGER NOT NULL,
    "initialBatchQuantity" DOUBLE PRECISION NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "farmerId" INTEGER,

    CONSTRAINT "processing_batches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "processing_stages" (
    "id" SERIAL NOT NULL,
    "processingBatchId" INTEGER NOT NULL,
    "processingCount" INTEGER NOT NULL DEFAULT 1,
    "processMethod" TEXT NOT NULL,
    "initialQuantity" DOUBLE PRECISION NOT NULL,
    "quantityAfterProcess" DOUBLE PRECISION,
    "dateOfProcessing" TIMESTAMP(3) NOT NULL,
    "dateOfCompletion" TIMESTAMP(3),
    "doneBy" TEXT NOT NULL,
    "status" "ProcessingStageStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "processing_stages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drying_entries" (
    "id" SERIAL NOT NULL,
    "processingStageId" INTEGER NOT NULL,
    "day" INTEGER NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION NOT NULL,
    "pH" DOUBLE PRECISION NOT NULL,
    "moisturePercentage" DOUBLE PRECISION NOT NULL,
    "currentQuantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drying_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" SERIAL NOT NULL,
    "processingBatchId" INTEGER NOT NULL,
    "processingStageId" INTEGER NOT NULL,
    "quantitySold" DOUBLE PRECISION NOT NULL,
    "dateOfSale" TIMESTAMP(3) NOT NULL,
    "createdById" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "farmers_surveyNumber_key" ON "farmers"("surveyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "farmers_aadharNumber_key" ON "farmers"("aadharNumber");

-- CreateIndex
CREATE UNIQUE INDEX "farmer_documents_farmerId_key" ON "farmer_documents"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "bank_details_farmerId_key" ON "bank_details"("farmerId");

-- CreateIndex
CREATE UNIQUE INDEX "procurements_batchCode_key" ON "procurements"("batchCode");

-- CreateIndex
CREATE UNIQUE INDEX "processing_batches_batchCode_key" ON "processing_batches"("batchCode");

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmers" ADD CONSTRAINT "farmers_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farmer_documents" ADD CONSTRAINT "farmer_documents_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bank_details" ADD CONSTRAINT "bank_details_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fields" ADD CONSTRAINT "fields_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "procurements" ADD CONSTRAINT "procurements_processingBatchId_fkey" FOREIGN KEY ("processingBatchId") REFERENCES "processing_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_batches" ADD CONSTRAINT "processing_batches_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_batches" ADD CONSTRAINT "processing_batches_farmerId_fkey" FOREIGN KEY ("farmerId") REFERENCES "farmers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_stages" ADD CONSTRAINT "processing_stages_processingBatchId_fkey" FOREIGN KEY ("processingBatchId") REFERENCES "processing_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "processing_stages" ADD CONSTRAINT "processing_stages_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "drying_entries" ADD CONSTRAINT "drying_entries_processingStageId_fkey" FOREIGN KEY ("processingStageId") REFERENCES "processing_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_processingBatchId_fkey" FOREIGN KEY ("processingBatchId") REFERENCES "processing_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_processingStageId_fkey" FOREIGN KEY ("processingStageId") REFERENCES "processing_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
