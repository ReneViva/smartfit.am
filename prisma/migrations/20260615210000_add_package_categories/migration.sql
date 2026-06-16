-- AlterEnum
ALTER TYPE "AuditActionType" ADD VALUE 'CATEGORY_EDIT';

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageCategory" (
    "packageId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageCategory_pkey" PRIMARY KEY ("packageId","categoryId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_name_idx" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Category_sortOrder_idx" ON "Category"("sortOrder");

-- CreateIndex
CREATE INDEX "Category_isPublic_idx" ON "Category"("isPublic");

-- CreateIndex
CREATE INDEX "Category_isArchived_idx" ON "Category"("isArchived");

-- CreateIndex
CREATE INDEX "PackageCategory_packageId_idx" ON "PackageCategory"("packageId");

-- CreateIndex
CREATE INDEX "PackageCategory_categoryId_idx" ON "PackageCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "PackageCategory" ADD CONSTRAINT "PackageCategory_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageCategory" ADD CONSTRAINT "PackageCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
