-- AlterTable
ALTER TABLE "GymVisit" ADD COLUMN "guestCountUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "occupancyDelta" INTEGER NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE "VisitPackageUsage" ADD COLUMN "guestPassesDeducted" INTEGER NOT NULL DEFAULT 0;
