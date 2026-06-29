-- Correction pass: private customer memberships/services are manually named
-- and no longer need to point at public package/category/coach templates.

ALTER TABLE "CustomerPackage"
ADD COLUMN "membershipName" TEXT;

UPDATE "CustomerPackage" customer_package
SET "membershipName" = package."name"
FROM "Package" package
WHERE customer_package."packageId" = package."id"
  AND (
    customer_package."membershipName" IS NULL OR
    btrim(customer_package."membershipName") = ''
  );

ALTER TABLE "CustomerPackageService"
ADD COLUMN "coachName" TEXT;

UPDATE "CustomerPackageService" service
SET "coachName" = btrim(concat_ws(' ', coach."firstName", coach."lastName"))
FROM "Coach" coach
WHERE service."coachId" = coach."id"
  AND (
    service."coachName" IS NULL OR
    btrim(service."coachName") = ''
  );

ALTER TABLE "CustomerPackage"
DROP CONSTRAINT IF EXISTS "CustomerPackage_packageId_fkey";

ALTER TABLE "CustomerPackage"
ALTER COLUMN "packageId" DROP NOT NULL;

ALTER TABLE "CustomerPackage"
ADD CONSTRAINT "CustomerPackage_packageId_fkey"
FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
