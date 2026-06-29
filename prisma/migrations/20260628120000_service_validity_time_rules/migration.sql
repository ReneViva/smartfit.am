-- Add assigned-membership time rules for the manual membership workflow.
ALTER TABLE "CustomerPackage"
ADD COLUMN "hasTimeRestriction" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "allowedStartTime" TEXT,
ADD COLUMN "allowedEndTime" TEXT,
ADD COLUMN "timeRestrictionLabel" TEXT;

UPDATE "CustomerPackage" customer_package
SET
    "hasTimeRestriction" = package."hasTimeRestriction",
    "allowedStartTime" = package."allowedStartTime",
    "allowedEndTime" = package."allowedEndTime",
    "timeRestrictionLabel" = package."timeRestrictionLabel"
FROM "Package" package
WHERE
    customer_package."packageId" = package."id"
    AND package."hasTimeRestriction" = true;

-- Add service-line validity dates and backfill from the parent membership.
ALTER TABLE "CustomerPackageService"
ADD COLUMN "startDate" TIMESTAMP(3),
ADD COLUMN "endDate" TIMESTAMP(3);

UPDATE "CustomerPackageService" service
SET
    "startDate" = customer_package."activationDate",
    "endDate" = customer_package."expirationDate"
FROM "CustomerPackage" customer_package
WHERE service."customerPackageId" = customer_package."id";

CREATE INDEX "CustomerPackageService_startDate_idx" ON "CustomerPackageService"("startDate");
CREATE INDEX "CustomerPackageService_endDate_idx" ON "CustomerPackageService"("endDate");
