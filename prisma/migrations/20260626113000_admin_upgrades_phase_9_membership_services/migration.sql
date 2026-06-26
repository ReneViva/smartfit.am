-- Add package template access-limit defaults.
ALTER TABLE "Package"
ADD COLUMN "hasUnlimitedIntervalCheckIns" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "intervalCheckInLimit" INTEGER,
ADD COLUMN "hasUnlimitedDailyCheckIns" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "dailyCheckInLimit" INTEGER;

-- Add assigned membership/container access-limit snapshots.
ALTER TABLE "CustomerPackage"
ADD COLUMN "hasUnlimitedIntervalCheckIns" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "intervalCheckInLimit" INTEGER,
ADD COLUMN "hasUnlimitedDailyCheckIns" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "dailyCheckInLimit" INTEGER;

-- Create service/session lines under a customer membership/container.
CREATE TABLE "CustomerPackageService" (
    "id" TEXT NOT NULL,
    "customerPackageId" TEXT NOT NULL,
    "packageId" TEXT,
    "serviceName" TEXT NOT NULL,
    "categoryId" TEXT,
    "coachId" TEXT,
    "initialSessions" INTEGER NOT NULL,
    "remainingSessions" INTEGER NOT NULL,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPackageService_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CustomerPackageService_customerPackageId_idx" ON "CustomerPackageService"("customerPackageId");
CREATE INDEX "CustomerPackageService_packageId_idx" ON "CustomerPackageService"("packageId");
CREATE INDEX "CustomerPackageService_categoryId_idx" ON "CustomerPackageService"("categoryId");
CREATE INDEX "CustomerPackageService_coachId_idx" ON "CustomerPackageService"("coachId");
CREATE INDEX "CustomerPackageService_isActive_idx" ON "CustomerPackageService"("isActive");
CREATE INDEX "CustomerPackageService_sortOrder_idx" ON "CustomerPackageService"("sortOrder");

-- Supports the future one-active-membership lookup without forcing a risky
-- uniqueness rule before existing multi-active customer package data is reviewed.
CREATE INDEX "CustomerPackage_active_container_lookup_idx"
ON "CustomerPackage"("customerId")
WHERE "deletedAt" IS NULL AND "status" = 'ACTIVE';

ALTER TABLE "CustomerPackageService" ADD CONSTRAINT "CustomerPackageService_customerPackageId_fkey"
FOREIGN KEY ("customerPackageId") REFERENCES "CustomerPackage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CustomerPackageService" ADD CONSTRAINT "CustomerPackageService_packageId_fkey"
FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CustomerPackageService" ADD CONSTRAINT "CustomerPackageService_categoryId_fkey"
FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CustomerPackageService" ADD CONSTRAINT "CustomerPackageService_coachId_fkey"
FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Non-destructive legacy backfill: every existing assigned package gets one
-- service line preserving its package, sessions, coach snapshot, and first
-- package category when one exists. It intentionally does not merge/deactivate
-- multiple active package rows because interval selection is a business decision.
INSERT INTO "CustomerPackageService" (
    "id",
    "customerPackageId",
    "packageId",
    "serviceName",
    "categoryId",
    "coachId",
    "initialSessions",
    "remainingSessions",
    "notes",
    "isActive",
    "sortOrder",
    "deletedAt",
    "createdAt",
    "updatedAt"
)
SELECT
    'legacy_' || customer_package."id",
    customer_package."id",
    customer_package."packageId",
    package."name",
    (
        SELECT package_category."categoryId"
        FROM "PackageCategory" package_category
        INNER JOIN "Category" category ON category."id" = package_category."categoryId"
        WHERE package_category."packageId" = customer_package."packageId"
        ORDER BY category."sortOrder" ASC, category."name" ASC, category."id" ASC
        LIMIT 1
    ),
    COALESCE(customer_package."coachId", package."assignedCoachId"),
    customer_package."initialSessions",
    customer_package."remainingSessions",
    'Backfilled from the legacy customer package assignment during Admin Upgrades Phase 9.',
    customer_package."status" IN ('ACTIVE', 'FROZEN'),
    0,
    customer_package."deletedAt",
    customer_package."createdAt",
    CURRENT_TIMESTAMP
FROM "CustomerPackage" customer_package
INNER JOIN "Package" package ON package."id" = customer_package."packageId"
WHERE NOT EXISTS (
    SELECT 1
    FROM "CustomerPackageService" existing_service
    WHERE existing_service."id" = 'legacy_' || customer_package."id"
);
