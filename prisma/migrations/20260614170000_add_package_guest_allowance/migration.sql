-- AlterTable
ALTER TABLE "Package" ADD COLUMN "defaultGuestPasses" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CustomerPackage" ADD COLUMN "initialGuestPasses" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "remainingGuestPasses" INTEGER NOT NULL DEFAULT 0;
