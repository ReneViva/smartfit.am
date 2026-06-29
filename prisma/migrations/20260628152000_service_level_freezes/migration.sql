ALTER TABLE "PackageFreeze" ADD COLUMN "customerPackageServiceId" TEXT;
ALTER TABLE "PackageFreeze" ADD COLUMN "originalServiceEndDate" TIMESTAMP(3);
ALTER TABLE "PackageFreeze" ADD COLUMN "resultingServiceEndDate" TIMESTAMP(3);

CREATE INDEX "PackageFreeze_customerPackageServiceId_idx" ON "PackageFreeze"("customerPackageServiceId");

DROP INDEX IF EXISTS "PackageFreeze_one_active_per_customerPackage_idx";

CREATE UNIQUE INDEX "PackageFreeze_one_active_membership_per_customerPackage_idx"
ON "PackageFreeze"("customerPackageId")
WHERE "status" = 'ACTIVE'::"PackageFreezeStatus" AND "customerPackageServiceId" IS NULL;

CREATE UNIQUE INDEX "PackageFreeze_one_active_per_customerPackageService_idx"
ON "PackageFreeze"("customerPackageServiceId")
WHERE "status" = 'ACTIVE'::"PackageFreezeStatus" AND "customerPackageServiceId" IS NOT NULL;

ALTER TABLE "PackageFreeze" ADD CONSTRAINT "PackageFreeze_customerPackageServiceId_fkey"
FOREIGN KEY ("customerPackageServiceId") REFERENCES "CustomerPackageService"("id") ON DELETE SET NULL ON UPDATE CASCADE;
