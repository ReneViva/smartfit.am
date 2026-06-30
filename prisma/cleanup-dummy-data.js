const fs = require("node:fs");

const { PrismaClient } = require("@prisma/client");

function loadEnvFile(path) {
  if (!fs.existsSync(path)) {
    return;
  }

  for (const rawLine of fs.readFileSync(path, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex < 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    process.env[key] ??= value;
  }
}

loadEnvFile(".env");

const prisma = new PrismaClient();

const MODEL_CLASSIFICATION = [
  {
    classification: "PRESERVE",
    model: "StaffUser",
    reason: "Admin and registration login users must remain intact.",
  },
  {
    classification: "PRESERVE",
    model: "GymSettings",
    reason:
      "Real contact number, address, schedule, links, logo settings, and public business settings live here.",
  },
  {
    classification: "DELETE",
    model: "PublicContent",
    reason:
      "Dummy offers, promotions, and homepage/public content records are allowlisted for cleanup. Referenced image files are not deleted.",
  },
  {
    classification: "DELETE",
    model: "Customer",
    reason: "Dummy customer records are allowlisted for cleanup.",
  },
  {
    classification: "DELETE",
    model: "Coach",
    reason: "Dummy coach records are allowlisted for cleanup.",
  },
  {
    classification: "DELETE",
    model: "Package",
    reason: "Dummy package definitions are allowlisted for cleanup.",
  },
  {
    classification: "DELETE",
    model: "Category",
    reason: "Categories should be reset/cleared.",
  },
  {
    classification: "DELETE",
    model: "PackageCategory",
    reason: "Package-category links must be cleared before packages/categories.",
  },
  {
    classification: "DELETE",
    model: "CoachCategory",
    reason: "Coach-category links must be cleared before coaches/categories.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "CustomerPackage",
    reason: "Customer-package assignments connected to dummy customers.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "CustomerPackageService",
    reason: "Service lines connected to customer packages being removed.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "PackageFreeze",
    reason:
      "Freeze records connected to customer packages/services being removed.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "GymVisit",
    reason: "Check-in/check-out visits connected to dummy customers.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "VisitPackageUsage",
    reason:
      "Guest/session usage records connected to removed visits or customer packages.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "PackageSessionChange",
    reason:
      "Session changes connected to removed customer packages/visits/usages.",
  },
  {
    classification: "DELETE",
    model: "Note",
    reason: "Notes are explicitly allowlisted for cleanup.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "CustomerDocument",
    reason:
      "Customer document database records connected to dummy customers. Physical files are not deleted.",
  },
  {
    classification: "PRESERVE",
    model: "OccupancyState",
    reason:
      "The row is preserved; actual cleanup only sets currentCount to 0 if needed.",
  },
  {
    classification: "DELETE DEPENDENT ONLY",
    model: "OccupancyEvent",
    reason: "Occupancy events connected to removed visits.",
  },
  {
    classification: "DELETE",
    model: "AuditLog",
    reason: "Logs/audit logs are explicitly allowlisted for cleanup.",
  },
  {
    classification: "PRESERVE",
    model: "GalleryImage",
    reason: "Public gallery image database records and media must remain.",
  },
];

const PRESERVED_MODELS = MODEL_CLASSIFICATION.filter(
  ({ classification }) => classification === "PRESERVE",
).map(({ model }) => model);

const CLEANED_MODELS = MODEL_CLASSIFICATION.filter(
  ({ classification }) => classification !== "PRESERVE",
).map(({ model }) => model);

const BLOCKED_OR_UNCLEAR_MODELS = MODEL_CLASSIFICATION.filter(
  ({ classification }) => classification === "BLOCKED/UNCLEAR",
).map(({ model }) => model);

function requireCleanupApproval() {
  if (process.env.ALLOW_DUMMY_DATA_CLEANUP !== "true") {
    throw new Error(
      "Dummy data cleanup is blocked. Set ALLOW_DUMMY_DATA_CLEANUP=true to run the dry run.",
    );
  }
}

function isConfirmedDelete() {
  return process.env.CONFIRM_DUMMY_DATA_DELETE === "true";
}

function safeDatabaseLabel() {
  const rawUrl = process.env.DATABASE_URL;

  if (!rawUrl) {
    return "DATABASE_URL is not set";
  }

  try {
    const url = new URL(rawUrl);

    return `${url.protocol}//${url.hostname}${url.port ? `:${url.port}` : ""}${url.pathname}`;
  } catch {
    return "DATABASE_URL is set but could not be parsed";
  }
}

function isRetryableDatabaseError(error) {
  return error?.code === "P1001" || error?.code === "P1002";
}

async function withReadRetry(label, operation) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (!isRetryableDatabaseError(error) || attempt === 4) {
        break;
      }

      const waitMs = attempt * 1500;
      console.warn(
        `${label} hit ${error.code}; retrying in ${waitMs}ms (${attempt}/4).`,
      );
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
  }

  throw lastError;
}

async function collectTargetIds() {
  const customers = await prisma.customer.findMany({ select: { id: true } });
  const customerPackages = await prisma.customerPackage.findMany({
    select: { id: true },
  });
  const customerPackageServices =
    await prisma.customerPackageService.findMany({
      select: { id: true },
    });
  const gymVisits = await prisma.gymVisit.findMany({ select: { id: true } });
  const visitPackageUsages = await prisma.visitPackageUsage.findMany({
    select: { id: true },
  });

  return {
    customerIds: customers.map(({ id }) => id),
    customerPackageIds: customerPackages.map(({ id }) => id),
    customerPackageServiceIds: customerPackageServices.map(({ id }) => id),
    gymVisitIds: gymVisits.map(({ id }) => id),
    visitPackageUsageIds: visitPackageUsages.map(({ id }) => id),
  };
}

function idFilter(ids) {
  return ids.length ? { in: ids } : { in: ["__none__"] };
}

async function collectCounts(targets) {
  const customerIdFilter = idFilter(targets.customerIds);
  const customerPackageIdFilter = idFilter(targets.customerPackageIds);
  const customerPackageServiceIdFilter = idFilter(
    targets.customerPackageServiceIds,
  );
  const gymVisitIdFilter = idFilter(targets.gymVisitIds);
  const visitPackageUsageIdFilter = idFilter(targets.visitPackageUsageIds);

  const staffUsers = await prisma.staffUser.count();
  const gymSettings = await prisma.gymSettings.count();
  const galleryImages = await prisma.galleryImage.count();
  const occupancyStates = await prisma.occupancyState.count();
  const publicContent = await prisma.publicContent.count();
  const auditLogs = await prisma.auditLog.count();
  const notes = await prisma.note.count();
  const customerDocuments = await prisma.customerDocument.count({
    where: { customerId: customerIdFilter },
  });
  const packageSessionChanges = await prisma.packageSessionChange.count({
    where: {
      OR: [
        { customerPackageId: customerPackageIdFilter },
        { visitId: gymVisitIdFilter },
        { visitPackageUsageId: visitPackageUsageIdFilter },
      ],
    },
  });
  const visitPackageUsages = await prisma.visitPackageUsage.count({
    where: {
      OR: [
        { customerPackageId: customerPackageIdFilter },
        { visitId: gymVisitIdFilter },
      ],
    },
  });
  const occupancyEvents = await prisma.occupancyEvent.count({
    where: { visitId: gymVisitIdFilter },
  });
  const gymVisits = await prisma.gymVisit.count({
    where: { customerId: customerIdFilter },
  });
  const packageFreezes = await prisma.packageFreeze.count({
    where: {
      OR: [
        { customerPackageId: customerPackageIdFilter },
        { customerPackageServiceId: customerPackageServiceIdFilter },
      ],
    },
  });
  const customerPackageServices =
    await prisma.customerPackageService.count({
      where: {
        OR: [
          { customerPackageId: customerPackageIdFilter },
          { packageId: { not: null } },
        ],
      },
    });
  const customerPackages = await prisma.customerPackage.count({
    where: { customerId: customerIdFilter },
  });
  const customers = await prisma.customer.count();
  const packageCategories = await prisma.packageCategory.count();
  const coachCategories = await prisma.coachCategory.count();
  const packages = await prisma.package.count();
  const categories = await prisma.category.count();
  const coaches = await prisma.coach.count();
  const occupancyStatesNeedingReset = await prisma.occupancyState.count({
    where: { currentCount: { not: 0 } },
  });
  const skippedManualOccupancyEvents = await prisma.occupancyEvent.count({
    where: { visitId: null },
  });

  return {
    clean: {
      AuditLog: auditLogs,
      Category: categories,
      Coach: coaches,
      CoachCategory: coachCategories,
      Customer: customers,
      CustomerDocument: customerDocuments,
      CustomerPackage: customerPackages,
      CustomerPackageService: customerPackageServices,
      GymVisit: gymVisits,
      Note: notes,
      OccupancyEvent: occupancyEvents,
      Package: packages,
      PackageCategory: packageCategories,
      PackageFreeze: packageFreezes,
      PackageSessionChange: packageSessionChanges,
      PublicContent: publicContent,
      VisitPackageUsage: visitPackageUsages,
    },
    preserve: {
      GalleryImage: galleryImages,
      GymSettings: gymSettings,
      OccupancyState: occupancyStates,
      StaffUser: staffUsers,
    },
    resetOnly: {
      OccupancyStateCurrentCountRows: occupancyStatesNeedingReset,
    },
    skippedRecords: {
      OccupancyEventWithoutVisit: skippedManualOccupancyEvents,
    },
  };
}

function printSection(title, value) {
  console.log(`\n${title}`);
  console.log(JSON.stringify(value, null, 2));
}

function printClassification() {
  printSection("Model classification", MODEL_CLASSIFICATION);
  printSection("Preserved models", PRESERVED_MODELS);
  printSection("Models cleaned by allowlist", CLEANED_MODELS);
  printSection("Blocked/unclear models", BLOCKED_OR_UNCLEAR_MODELS);
}

function printPreservedBusinessInformation() {
  printSection("Preserved business/settings fields", {
    GymSettings: [
      "gymName",
      "logoUrl",
      "ourAppLogoLightUrl",
      "ourAppLogoDarkUrl",
      "contactNumber",
      "whatsappLink",
      "instagramLink",
      "address",
      "mapLink",
      "mapEmbedUrl",
      "workingDays",
      "workingHours",
      "workingScheduleText",
      "telegramLink",
      "public visibility settings",
      "occupancy thresholds",
      "motivationalText",
      "hideInactiveCustomersFromRegistration",
    ],
    GalleryImage: ["imageUrl", "title", "altText", "sortOrder", "isActive"],
    StaffUser: [
      "admin login user",
      "registration login user",
      "username",
      "email",
      "passwordHash",
      "role",
      "isActive",
    ],
    Media: [
      "No public files are deleted",
      "No Cloudinary/R2/storage objects are deleted",
      "CustomerDocument database rows are deleted only because their customers are deleted; physical files are untouched",
    ],
    PrismaMigrations: ["_prisma_migrations is never touched"],
  });
}

async function preservedRowCounts() {
  const staffUsers = await prisma.staffUser.count();
  const gymSettings = await prisma.gymSettings.count();
  const galleryImages = await prisma.galleryImage.count();
  const occupancyStates = await prisma.occupancyState.count();

  return {
    GalleryImage: galleryImages,
    GymSettings: gymSettings,
    OccupancyState: occupancyStates,
    StaffUser: staffUsers,
  };
}

async function deleteAllowlistedData(transaction, targets) {
  const customerIdFilter = idFilter(targets.customerIds);
  const customerPackageIdFilter = idFilter(targets.customerPackageIds);
  const customerPackageServiceIdFilter = idFilter(
    targets.customerPackageServiceIds,
  );
  const gymVisitIdFilter = idFilter(targets.gymVisitIds);
  const visitPackageUsageIdFilter = idFilter(targets.visitPackageUsageIds);

  const result = {};

  result.AuditLog = await transaction.auditLog.deleteMany();
  result.Note = await transaction.note.deleteMany();
  result.PublicContent = await transaction.publicContent.deleteMany();
  result.CustomerDocument = await transaction.customerDocument.deleteMany({
    where: { customerId: customerIdFilter },
  });
  result.PackageSessionChange =
    await transaction.packageSessionChange.deleteMany({
      where: {
        OR: [
          { customerPackageId: customerPackageIdFilter },
          { visitId: gymVisitIdFilter },
          { visitPackageUsageId: visitPackageUsageIdFilter },
        ],
      },
    });
  result.OccupancyEvent = await transaction.occupancyEvent.deleteMany({
    where: { visitId: gymVisitIdFilter },
  });
  result.VisitPackageUsage = await transaction.visitPackageUsage.deleteMany({
    where: {
      OR: [
        { customerPackageId: customerPackageIdFilter },
        { visitId: gymVisitIdFilter },
      ],
    },
  });
  result.GymVisit = await transaction.gymVisit.deleteMany({
    where: { customerId: customerIdFilter },
  });
  result.PackageFreeze = await transaction.packageFreeze.deleteMany({
    where: {
      OR: [
        { customerPackageId: customerPackageIdFilter },
        { customerPackageServiceId: customerPackageServiceIdFilter },
      ],
    },
  });
  result.CustomerPackageService =
    await transaction.customerPackageService.deleteMany({
      where: {
        OR: [
          { customerPackageId: customerPackageIdFilter },
          { packageId: { not: null } },
        ],
      },
    });
  result.CustomerPackage = await transaction.customerPackage.deleteMany({
    where: { customerId: customerIdFilter },
  });
  result.Customer = await transaction.customer.deleteMany();
  result.PackageCategory = await transaction.packageCategory.deleteMany();
  result.CoachCategory = await transaction.coachCategory.deleteMany();
  result.Package = await transaction.package.deleteMany();
  result.Category = await transaction.category.deleteMany();
  result.Coach = await transaction.coach.deleteMany();
  result.OccupancyStateReset = await transaction.occupancyState.updateMany({
    data: { currentCount: 0 },
    where: { currentCount: { not: 0 } },
  });

  return Object.fromEntries(
    Object.entries(result).map(([model, mutationResult]) => [
      model,
      mutationResult.count,
    ]),
  );
}

async function main() {
  requireCleanupApproval();

  const confirmedDelete = isConfirmedDelete();

  console.log("Smartfit dummy data cleanup");
  console.log(`Mode: ${confirmedDelete ? "ACTUAL DELETE" : "DRY RUN"}`);
  console.log(`Database: ${safeDatabaseLabel()}`);
  console.log(
    "Deletion strategy: explicit Prisma deleteMany allowlist in dependency-safe order. No TRUNCATE. No seed.",
  );
  console.log(
    "Dummy target policy: all rows in allowlisted Customer/Package/Coach/Category/PublicContent operational tables are treated as dummy data only after the required environment flags are set.",
  );

  printClassification();
  printPreservedBusinessInformation();

  if (BLOCKED_OR_UNCLEAR_MODELS.length > 0) {
    throw new Error(
      `Cleanup blocked because unclear models exist: ${BLOCKED_OR_UNCLEAR_MODELS.join(", ")}`,
    );
  }

  const targets = await withReadRetry("Collect target ids", collectTargetIds);
  const beforeCounts = await withReadRetry("Collect counts before cleanup", () =>
    collectCounts(targets),
  );

  printSection("Counts before cleanup", beforeCounts);

  if (!confirmedDelete) {
    console.log(
      "\nDry run only. No data was deleted. Set CONFIRM_DUMMY_DATA_DELETE=true for the actual cleanup.",
    );
    return;
  }

  const preservedBefore = await withReadRetry(
    "Collect preserved counts before cleanup",
    preservedRowCounts,
  );
  let deletedCounts;
  let preservedAfter;

  await prisma.$transaction(async (transaction) => {
    deletedCounts = await deleteAllowlistedData(transaction, targets);

    const staffUsers = await transaction.staffUser.count();
    const gymSettings = await transaction.gymSettings.count();
    const galleryImages = await transaction.galleryImage.count();
    const occupancyStates = await transaction.occupancyState.count();

    preservedAfter = {
      GalleryImage: galleryImages,
      GymSettings: gymSettings,
      OccupancyState: occupancyStates,
      StaffUser: staffUsers,
    };

    for (const model of Object.keys(preservedBefore)) {
      if (preservedBefore[model] !== preservedAfter[model]) {
        throw new Error(
          `Cleanup blocked: preserved model ${model} row count changed from ${preservedBefore[model]} to ${preservedAfter[model]}. Transaction was rolled back.`,
        );
      }
    }
  });

  const afterTargets = await withReadRetry(
    "Collect target ids after cleanup",
    collectTargetIds,
  );
  const afterCounts = await withReadRetry("Collect counts after cleanup", () =>
    collectCounts(afterTargets),
  );

  printSection("Deleted row counts", deletedCounts);
  printSection("Preserved model row counts before", preservedBefore);
  printSection("Preserved model row counts after", preservedAfter);
  printSection("Counts after cleanup", afterCounts);
  console.log("\nActual cleanup complete.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
