-- CreateEnum
CREATE TYPE "PackageFreezeMode" AS ENUM ('NORMAL', 'RETROACTIVE');

-- CreateEnum
CREATE TYPE "PackageFreezeStatus" AS ENUM ('ACTIVE', 'REACTIVATED', 'CANCELLED');

-- AlterTable
ALTER TABLE "CustomerPackage" ADD COLUMN     "remainingFreezeChances" INTEGER NOT NULL DEFAULT 3;

-- AlterTable
ALTER TABLE "Package" ADD COLUMN     "defaultFreezeChances" INTEGER NOT NULL DEFAULT 3;

-- AddCheckConstraint
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_remainingFreezeChances_nonnegative" CHECK ("remainingFreezeChances" >= 0);

-- AddCheckConstraint
ALTER TABLE "Package" ADD CONSTRAINT "Package_defaultFreezeChances_nonnegative" CHECK ("defaultFreezeChances" >= 0);

-- CreateTable
CREATE TABLE "PackageFreeze" (
    "id" TEXT NOT NULL,
    "customerPackageId" TEXT NOT NULL,
    "mode" "PackageFreezeMode" NOT NULL,
    "status" "PackageFreezeStatus" NOT NULL DEFAULT 'ACTIVE',
    "plannedDays" INTEGER NOT NULL,
    "actualDays" INTEGER,
    "startDate" TIMESTAMP(3) NOT NULL,
    "plannedEndDate" TIMESTAMP(3),
    "actualEndDate" TIMESTAMP(3),
    "originalExpirationDate" TIMESTAMP(3) NOT NULL,
    "resultingExpirationDate" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "reactivatedById" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PackageFreeze_pkey" PRIMARY KEY ("id")
);

-- AddCheckConstraint
ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_plannedDays_positive" CHECK ("plannedDays" > 0);

-- AddCheckConstraint
ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_actualDays_nonnegative" CHECK ("actualDays" IS NULL OR "actualDays" >= 0);

-- AddCheckConstraint
ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_plannedEndDate_not_before_start" CHECK ("plannedEndDate" IS NULL OR "plannedEndDate" >= "startDate");

-- AddCheckConstraint
ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_actualEndDate_not_before_start" CHECK ("actualEndDate" IS NULL OR "actualEndDate" >= "startDate");

-- CreateIndex
CREATE INDEX "PackageFreeze_customerPackageId_idx" ON "PackageFreeze"("customerPackageId");

-- CreateIndex
CREATE INDEX "PackageFreeze_status_idx" ON "PackageFreeze"("status");

-- CreateIndex
CREATE INDEX "PackageFreeze_startDate_idx" ON "PackageFreeze"("startDate");

-- CreateIndex
CREATE INDEX "PackageFreeze_actualEndDate_idx" ON "PackageFreeze"("actualEndDate");

-- CreateIndex
CREATE INDEX "PackageFreeze_createdById_idx" ON "PackageFreeze"("createdById");

-- CreateIndex
CREATE INDEX "PackageFreeze_reactivatedById_idx" ON "PackageFreeze"("reactivatedById");

-- CreateIndex
CREATE UNIQUE INDEX "PackageFreeze_one_active_per_customerPackage_idx" ON "PackageFreeze"("customerPackageId") WHERE "status" = 'ACTIVE'::"PackageFreezeStatus";

-- AddForeignKey
ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES "CustomerPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_reactivatedById_fkey" FOREIGN KEY ("reactivatedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
