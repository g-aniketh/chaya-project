/*
  Warnings:

  - You are about to drop the column `batchCode` on the `procurements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[procurementNumber]` on the table `procurements` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `procurementNumber` to the `procurements` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "procurements_batchCode_key";

-- AlterTable
ALTER TABLE "procurements" DROP COLUMN "batchCode",
ADD COLUMN     "procurementNumber" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "procurements_procurementNumber_key" ON "procurements"("procurementNumber");
