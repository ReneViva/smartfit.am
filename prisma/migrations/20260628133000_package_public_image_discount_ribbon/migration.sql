-- Add public-safe package image and discount ribbon metadata.
ALTER TABLE "Package" ADD COLUMN "imageUrl" TEXT;
ALTER TABLE "Package" ADD COLUMN "discountRibbonPercent" INTEGER;
