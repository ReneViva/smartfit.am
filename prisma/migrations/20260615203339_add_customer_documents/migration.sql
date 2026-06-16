-- CreateEnum
CREATE TYPE "CustomerDocumentStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditActionType" ADD VALUE 'CUSTOMER_DOCUMENT_CREATE';
ALTER TYPE "AuditActionType" ADD VALUE 'CUSTOMER_DOCUMENT_ARCHIVE';
ALTER TYPE "AuditActionType" ADD VALUE 'CUSTOMER_DOCUMENT_DOWNLOAD';

-- CreateTable
CREATE TABLE "CustomerDocument" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "storedFileName" TEXT NOT NULL,
    "storageProvider" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storagePublicId" TEXT,
    "storageResourceType" TEXT,
    "storageDeliveryType" TEXT,
    "storageFolder" TEXT,
    "storageFormat" TEXT,
    "mimeType" TEXT NOT NULL,
    "fileExtension" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "label" TEXT,
    "notes" TEXT,
    "status" "CustomerDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "uploadedById" TEXT NOT NULL,
    "archivedById" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerDocument_customerId_status_idx" ON "CustomerDocument"("customerId", "status");

-- CreateIndex
CREATE INDEX "CustomerDocument_uploadedById_idx" ON "CustomerDocument"("uploadedById");

-- CreateIndex
CREATE INDEX "CustomerDocument_archivedById_idx" ON "CustomerDocument"("archivedById");

-- CreateIndex
CREATE INDEX "CustomerDocument_storageProvider_storageKey_idx" ON "CustomerDocument"("storageProvider", "storageKey");

-- CreateIndex
CREATE INDEX "CustomerDocument_createdAt_idx" ON "CustomerDocument"("createdAt");

-- AddForeignKey
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerDocument" ADD CONSTRAINT "CustomerDocument_archivedById_fkey" FOREIGN KEY ("archivedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;
