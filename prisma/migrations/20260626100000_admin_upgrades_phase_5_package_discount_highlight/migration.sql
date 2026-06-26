ALTER TABLE "Package"
ADD COLUMN "discountPrice" DECIMAL(10, 2),
ADD COLUMN "highlightOnPublicPackages" BOOLEAN NOT NULL DEFAULT false;
