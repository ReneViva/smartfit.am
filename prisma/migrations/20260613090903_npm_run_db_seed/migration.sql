-- CreateEnum
CREATE TYPE "StaffRole" AS ENUM ('ADMIN', 'REGISTRATION');

-- CreateEnum
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "GymPresenceStatus" AS ENUM ('IN_GYM', 'NOT_IN_GYM');

-- CreateEnum
CREATE TYPE "CustomerPackageStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'EXPIRED', 'FROZEN');

-- CreateEnum
CREATE TYPE "SessionChangeType" AS ENUM ('CHECK_IN_DEDUCTION', 'MANUAL_CORRECTION');

-- CreateEnum
CREATE TYPE "OccupancyEventType" AS ENUM ('CHECK_IN', 'CHECK_OUT', 'MANUAL_CORRECTION');

-- CreateEnum
CREATE TYPE "AuditActionType" AS ENUM ('CUSTOMER_CHECK_IN', 'CUSTOMER_CHECK_OUT', 'SESSION_DEDUCTION', 'SESSION_CORRECTION', 'OCCUPANCY_CORRECTION', 'PACKAGE_FREEZE', 'PACKAGE_REACTIVATION', 'PACKAGE_RENEWAL', 'CUSTOMER_EDIT', 'PACKAGE_EDIT', 'COACH_EDIT', 'SETTINGS_EDIT', 'PUBLIC_CONTENT_EDIT');

-- CreateEnum
CREATE TYPE "PublicContentType" AS ENUM ('OFFER', 'PROMOTION', 'DISCOUNT', 'NEWS', 'ANNOUNCEMENT', 'HERO');

-- CreateTable
CREATE TABLE "StaffUser" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "email" TEXT,
    "passwordHash" TEXT,
    "role" "StaffRole" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymSettings" (
    "id" TEXT NOT NULL,
    "gymName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "contactNumber" TEXT,
    "whatsappLink" TEXT,
    "instagramLink" TEXT,
    "address" TEXT,
    "mapLink" TEXT,
    "workingDays" TEXT,
    "workingHours" TEXT,
    "occupancyGreenMax" INTEGER,
    "occupancyYellowMax" INTEGER,
    "showPhoneInPublicApp" BOOLEAN NOT NULL DEFAULT true,
    "showWhatsappInPublicApp" BOOLEAN NOT NULL DEFAULT true,
    "showInstagramInPublicApp" BOOLEAN NOT NULL DEFAULT true,
    "showLocationInPublicApp" BOOLEAN NOT NULL DEFAULT true,
    "showMotivationalTextInPublicApp" BOOLEAN NOT NULL DEFAULT true,
    "motivationalText" TEXT,
    "hideInactiveCustomersFromRegistration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PublicContent" (
    "id" TEXT NOT NULL,
    "type" "PublicContentType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "imageUrl" TEXT,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "customerCode" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "fullName" TEXT NOT NULL,
    "phone" TEXT,
    "status" "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
    "gymPresenceStatus" "GymPresenceStatus" NOT NULL DEFAULT 'NOT_IN_GYM',
    "assignedCoachId" TEXT,
    "lastCheckInAt" TIMESTAMP(3),
    "lastCheckOutAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Coach" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "photoUrl" TEXT,
    "specialty" TEXT NOT NULL,
    "description" TEXT,
    "contactInfo" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coach_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "price" DECIMAL(10,2) NOT NULL,
    "sessionCount" INTEGER NOT NULL,
    "packageType" TEXT NOT NULL,
    "assignedCoachId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "hasTimeRestriction" BOOLEAN NOT NULL DEFAULT false,
    "allowedStartTime" TEXT,
    "allowedEndTime" TEXT,
    "timeRestrictionLabel" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomerPackage" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "coachId" TEXT,
    "activationDate" TIMESTAMP(3) NOT NULL,
    "expirationDate" TIMESTAMP(3) NOT NULL,
    "initialSessions" INTEGER NOT NULL,
    "remainingSessions" INTEGER NOT NULL,
    "status" "CustomerPackageStatus" NOT NULL DEFAULT 'ACTIVE',
    "frozenAt" TIMESTAMP(3),
    "reactivatedAt" TIMESTAMP(3),
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomerPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GymVisit" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "checkedInAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkedOutAt" TIMESTAMP(3),
    "checkedInById" TEXT NOT NULL,
    "checkedOutById" TEXT,
    "occupancyAfterCheckIn" INTEGER,
    "occupancyAfterCheckOut" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GymVisit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VisitPackageUsage" (
    "id" TEXT NOT NULL,
    "visitId" TEXT NOT NULL,
    "customerPackageId" TEXT NOT NULL,
    "sessionsDeducted" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VisitPackageUsage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PackageSessionChange" (
    "id" TEXT NOT NULL,
    "customerPackageId" TEXT NOT NULL,
    "visitId" TEXT,
    "visitPackageUsageId" TEXT,
    "changedById" TEXT NOT NULL,
    "changeType" "SessionChangeType" NOT NULL,
    "previousRemainingSessions" INTEGER NOT NULL,
    "newRemainingSessions" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageSessionChange_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "customerId" TEXT,
    "content" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupancyState" (
    "id" TEXT NOT NULL,
    "currentCount" INTEGER NOT NULL DEFAULT 0,
    "updatedById" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OccupancyState_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OccupancyEvent" (
    "id" TEXT NOT NULL,
    "eventType" "OccupancyEventType" NOT NULL,
    "previousCount" INTEGER NOT NULL,
    "newCount" INTEGER NOT NULL,
    "delta" INTEGER NOT NULL,
    "visitId" TEXT,
    "changedById" TEXT,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OccupancyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorId" TEXT,
    "actionType" "AuditActionType" NOT NULL,
    "targetType" TEXT,
    "targetId" TEXT,
    "customerId" TEXT,
    "description" TEXT NOT NULL,
    "oldValue" JSONB,
    "newValue" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryImage" (
    "id" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "title" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GalleryImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_username_key" ON "StaffUser"("username");

-- CreateIndex
CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");

-- CreateIndex
CREATE INDEX "StaffUser_role_isActive_idx" ON "StaffUser"("role", "isActive");

-- CreateIndex
CREATE INDEX "PublicContent_type_isActive_idx" ON "PublicContent"("type", "isActive");

-- CreateIndex
CREATE INDEX "PublicContent_createdById_idx" ON "PublicContent"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_customerCode_key" ON "Customer"("customerCode");

-- CreateIndex
CREATE INDEX "Customer_fullName_idx" ON "Customer"("fullName");

-- CreateIndex
CREATE INDEX "Customer_status_idx" ON "Customer"("status");

-- CreateIndex
CREATE INDEX "Customer_gymPresenceStatus_idx" ON "Customer"("gymPresenceStatus");

-- CreateIndex
CREATE INDEX "Customer_assignedCoachId_idx" ON "Customer"("assignedCoachId");

-- CreateIndex
CREATE INDEX "Coach_isActive_idx" ON "Coach"("isActive");

-- CreateIndex
CREATE INDEX "Package_name_idx" ON "Package"("name");

-- CreateIndex
CREATE INDEX "Package_packageType_idx" ON "Package"("packageType");

-- CreateIndex
CREATE INDEX "Package_isActive_idx" ON "Package"("isActive");

-- CreateIndex
CREATE INDEX "Package_assignedCoachId_idx" ON "Package"("assignedCoachId");

-- CreateIndex
CREATE INDEX "CustomerPackage_customerId_idx" ON "CustomerPackage"("customerId");

-- CreateIndex
CREATE INDEX "CustomerPackage_packageId_idx" ON "CustomerPackage"("packageId");

-- CreateIndex
CREATE INDEX "CustomerPackage_coachId_idx" ON "CustomerPackage"("coachId");

-- CreateIndex
CREATE INDEX "CustomerPackage_status_idx" ON "CustomerPackage"("status");

-- CreateIndex
CREATE INDEX "CustomerPackage_expirationDate_idx" ON "CustomerPackage"("expirationDate");

-- CreateIndex
CREATE INDEX "CustomerPackage_remainingSessions_idx" ON "CustomerPackage"("remainingSessions");

-- CreateIndex
CREATE INDEX "GymVisit_customerId_idx" ON "GymVisit"("customerId");

-- CreateIndex
CREATE INDEX "GymVisit_checkedInAt_idx" ON "GymVisit"("checkedInAt");

-- CreateIndex
CREATE INDEX "GymVisit_checkedOutAt_idx" ON "GymVisit"("checkedOutAt");

-- CreateIndex
CREATE INDEX "GymVisit_checkedInById_idx" ON "GymVisit"("checkedInById");

-- CreateIndex
CREATE INDEX "GymVisit_checkedOutById_idx" ON "GymVisit"("checkedOutById");

-- CreateIndex
CREATE INDEX "VisitPackageUsage_visitId_idx" ON "VisitPackageUsage"("visitId");

-- CreateIndex
CREATE INDEX "VisitPackageUsage_customerPackageId_idx" ON "VisitPackageUsage"("customerPackageId");

-- CreateIndex
CREATE UNIQUE INDEX "PackageSessionChange_visitPackageUsageId_key" ON "PackageSessionChange"("visitPackageUsageId");

-- CreateIndex
CREATE INDEX "PackageSessionChange_customerPackageId_idx" ON "PackageSessionChange"("customerPackageId");

-- CreateIndex
CREATE INDEX "PackageSessionChange_visitId_idx" ON "PackageSessionChange"("visitId");

-- CreateIndex
CREATE INDEX "PackageSessionChange_changedById_idx" ON "PackageSessionChange"("changedById");

-- CreateIndex
CREATE INDEX "PackageSessionChange_createdAt_idx" ON "PackageSessionChange"("createdAt");

-- CreateIndex
CREATE INDEX "Note_customerId_idx" ON "Note"("customerId");

-- CreateIndex
CREATE INDEX "Note_createdById_idx" ON "Note"("createdById");

-- CreateIndex
CREATE INDEX "Note_createdAt_idx" ON "Note"("createdAt");

-- CreateIndex
CREATE INDEX "OccupancyState_updatedById_idx" ON "OccupancyState"("updatedById");

-- CreateIndex
CREATE INDEX "OccupancyEvent_visitId_idx" ON "OccupancyEvent"("visitId");

-- CreateIndex
CREATE INDEX "OccupancyEvent_changedById_idx" ON "OccupancyEvent"("changedById");

-- CreateIndex
CREATE INDEX "OccupancyEvent_createdAt_idx" ON "OccupancyEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_customerId_idx" ON "AuditLog"("customerId");

-- CreateIndex
CREATE INDEX "AuditLog_actionType_idx" ON "AuditLog"("actionType");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_targetType_targetId_idx" ON "AuditLog"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "GalleryImage_isActive_sortOrder_idx" ON "GalleryImage"("isActive", "sortOrder");

-- AddForeignKey
ALTER TABLE "PublicContent" ADD CONSTRAINT "PublicContent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_assignedCoachId_fkey" FOREIGN KEY ("assignedCoachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Package" ADD CONSTRAINT "Package_assignedCoachId_fkey" FOREIGN KEY ("assignedCoachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomerPackage" ADD CONSTRAINT "CustomerPackage_coachId_fkey" FOREIGN KEY ("coachId") REFERENCES "Coach"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymVisit" ADD CONSTRAINT "GymVisit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymVisit" ADD CONSTRAINT "GymVisit_checkedInById_fkey" FOREIGN KEY ("checkedInById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GymVisit" ADD CONSTRAINT "GymVisit_checkedOutById_fkey" FOREIGN KEY ("checkedOutById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitPackageUsage" ADD CONSTRAINT "VisitPackageUsage_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "GymVisit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitPackageUsage" ADD CONSTRAINT "VisitPackageUsage_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES "CustomerPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageSessionChange" ADD CONSTRAINT "PackageSessionChange_customerPackageId_fkey" FOREIGN KEY ("customerPackageId") REFERENCES "CustomerPackage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageSessionChange" ADD CONSTRAINT "PackageSessionChange_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "GymVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageSessionChange" ADD CONSTRAINT "PackageSessionChange_visitPackageUsageId_fkey" FOREIGN KEY ("visitPackageUsageId") REFERENCES "VisitPackageUsage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PackageSessionChange" ADD CONSTRAINT "PackageSessionChange_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "StaffUser"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccupancyState" ADD CONSTRAINT "OccupancyState_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccupancyEvent" ADD CONSTRAINT "OccupancyEvent_visitId_fkey" FOREIGN KEY ("visitId") REFERENCES "GymVisit"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OccupancyEvent" ADD CONSTRAINT "OccupancyEvent_changedById_fkey" FOREIGN KEY ("changedById") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
