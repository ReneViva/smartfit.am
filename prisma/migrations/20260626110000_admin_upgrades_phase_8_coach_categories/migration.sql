-- CreateTable
CREATE TABLE "CoachCategory" (
    "coachId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachCategory_pkey" PRIMARY KEY ("coachId","categoryId")
);

-- CreateIndex
CREATE INDEX "CoachCategory_coachId_idx" ON "CoachCategory"("coachId");

-- CreateIndex
CREATE INDEX "CoachCategory_categoryId_idx" ON "CoachCategory"("categoryId");

-- AddForeignKey
ALTER TABLE "CoachCategory" ADD CONSTRAINT "CoachCategory_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachCategory" ADD CONSTRAINT "CoachCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
