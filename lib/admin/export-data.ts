import { db } from "../db";

export const exportCategories = [
  {
    description: "Member identity, contact, status, presence, and coach details.",
    label: "Customers",
    type: "customers",
  },
  {
    description: "Package definitions, pricing, sessions, coaches, and time rules.",
    label: "Packages",
    type: "packages",
  },
  {
    description: "Coach profiles, specialties, contact details, and status.",
    label: "Coaches",
    type: "coaches",
  },
  {
    description: "Full customer package assignment and status history.",
    label: "Customer package history",
    type: "customer-package-history",
  },
  {
    description:
      "Check-in/check-out visits, staff, occupancy, session usage, and guest usage.",
    label: "Check-in/check-out logs",
    type: "visits",
  },
  {
    description: "Offers, promotions, announcements, and other public content history.",
    label: "Promotion/offer history",
    type: "public-content",
  },
  {
    description: "Active and soft-deleted customer notes with staff attribution.",
    label: "Notes",
    type: "notes",
  },
] as const;

export type ExportType = (typeof exportCategories)[number]["type"];

type ExportCell = boolean | number | string | null;

export type ExportColumn = {
  header: string;
  key: string;
  width?: number;
};

export type ExportDefinition = {
  columns: ExportColumn[];
  filePrefix: string;
  rows: Record<string, ExportCell>[];
  worksheetName: string;
};

export function isExportType(value: string | null): value is ExportType {
  return exportCategories.some((category) => category.type === value);
}

function formatDate(value: Date | null) {
  return value
    ? `${value.toISOString().slice(0, 19).replace("T", " ")} UTC`
    : null;
}

function formatDateOnly(value: Date | null) {
  return value?.toISOString().slice(0, 10) ?? null;
}

function personName(
  person:
    | { firstName: string; lastName: string }
    | { name: string | null; username: string | null }
    | null,
) {
  if (!person) {
    return null;
  }

  if ("firstName" in person) {
    return `${person.firstName} ${person.lastName}`;
  }

  return person.name ?? person.username ?? "Staff user";
}

async function customersExport(): Promise<ExportDefinition> {
  const customers = await db.customer.findMany({
    orderBy: [{ fullName: "asc" }, { customerCode: "asc" }],
    select: {
      assignedCoach: { select: { firstName: true, lastName: true } },
      birthDate: true,
      createdAt: true,
      customerCode: true,
      deletedAt: true,
      emergencyPhone: true,
      firstName: true,
      fullName: true,
      gymPresenceStatus: true,
      lastName: true,
      phone: true,
      status: true,
      updatedAt: true,
    },
  });

  return {
    columns: [
      { header: "Member ID", key: "customerCode", width: 16 },
      { header: "Full Name", key: "fullName", width: 28 },
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Birth Date", key: "birthDate", width: 16 },
      { header: "Phone", key: "phone", width: 20 },
      { header: "Emergency Phone", key: "emergencyPhone", width: 20 },
      { header: "Customer Status", key: "status", width: 18 },
      { header: "Gym Presence", key: "gymPresenceStatus", width: 18 },
      { header: "Assigned Coach", key: "assignedCoach", width: 25 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-customers",
    rows: customers.map((customer) => ({
      assignedCoach: personName(customer.assignedCoach),
      birthDate: formatDateOnly(customer.birthDate),
      createdAt: formatDate(customer.createdAt),
      customerCode: customer.customerCode,
      deletedAt: formatDate(customer.deletedAt),
      emergencyPhone: customer.emergencyPhone,
      firstName: customer.firstName,
      fullName: customer.fullName,
      gymPresenceStatus: customer.gymPresenceStatus,
      lastName: customer.lastName,
      phone: customer.phone,
      status: customer.status,
      updatedAt: formatDate(customer.updatedAt),
    })),
    worksheetName: "Customers",
  };
}

async function packagesExport(): Promise<ExportDefinition> {
  const packages = await db.package.findMany({
    orderBy: { name: "asc" },
    select: {
      allowedEndTime: true,
      allowedStartTime: true,
      assignedCoach: { select: { firstName: true, lastName: true } },
      createdAt: true,
      defaultGuestPasses: true,
      deletedAt: true,
      description: true,
      hasTimeRestriction: true,
      isActive: true,
      name: true,
      packageType: true,
      price: true,
      sessionCount: true,
      timeRestrictionLabel: true,
      updatedAt: true,
    },
  });

  return {
    columns: [
      { header: "Package Name", key: "name", width: 28 },
      { header: "Description", key: "description", width: 42 },
      { header: "Price", key: "price", width: 14 },
      { header: "Session Count", key: "sessionCount", width: 16 },
      {
        header: "Default Guest Passes",
        key: "defaultGuestPasses",
        width: 22,
      },
      { header: "Package Type", key: "packageType", width: 20 },
      { header: "Assigned Coach", key: "assignedCoach", width: 25 },
      { header: "Active", key: "isActive", width: 12 },
      { header: "Has Time Restriction", key: "hasTimeRestriction", width: 22 },
      { header: "Allowed Start Time", key: "allowedStartTime", width: 20 },
      { header: "Allowed End Time", key: "allowedEndTime", width: 20 },
      { header: "Time Restriction Label", key: "timeRestrictionLabel", width: 28 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-packages",
    rows: packages.map((gymPackage) => ({
      allowedEndTime: gymPackage.allowedEndTime,
      allowedStartTime: gymPackage.allowedStartTime,
      assignedCoach: personName(gymPackage.assignedCoach),
      createdAt: formatDate(gymPackage.createdAt),
      defaultGuestPasses: gymPackage.defaultGuestPasses,
      deletedAt: formatDate(gymPackage.deletedAt),
      description: gymPackage.description,
      hasTimeRestriction: gymPackage.hasTimeRestriction,
      isActive: gymPackage.isActive,
      name: gymPackage.name,
      packageType: gymPackage.packageType,
      price: gymPackage.price.toString(),
      sessionCount: gymPackage.sessionCount,
      timeRestrictionLabel: gymPackage.timeRestrictionLabel,
      updatedAt: formatDate(gymPackage.updatedAt),
    })),
    worksheetName: "Packages",
  };
}

async function coachesExport(): Promise<ExportDefinition> {
  const coaches = await db.coach.findMany({
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
    select: {
      contactInfo: true,
      createdAt: true,
      deletedAt: true,
      description: true,
      firstName: true,
      isActive: true,
      lastName: true,
      photoUrl: true,
      specialty: true,
      updatedAt: true,
    },
  });

  return {
    columns: [
      { header: "First Name", key: "firstName", width: 20 },
      { header: "Last Name", key: "lastName", width: 20 },
      { header: "Specialty", key: "specialty", width: 28 },
      { header: "Description", key: "description", width: 42 },
      { header: "Contact Info", key: "contactInfo", width: 28 },
      { header: "Photo URL", key: "photoUrl", width: 40 },
      { header: "Active", key: "isActive", width: 12 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-coaches",
    rows: coaches.map((coach) => ({
      contactInfo: coach.contactInfo,
      createdAt: formatDate(coach.createdAt),
      deletedAt: formatDate(coach.deletedAt),
      description: coach.description,
      firstName: coach.firstName,
      isActive: coach.isActive,
      lastName: coach.lastName,
      photoUrl: coach.photoUrl,
      specialty: coach.specialty,
      updatedAt: formatDate(coach.updatedAt),
    })),
    worksheetName: "Coaches",
  };
}

async function customerPackageHistoryExport(): Promise<ExportDefinition> {
  const customerPackages = await db.customerPackage.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      activationDate: true,
      coach: { select: { firstName: true, lastName: true } },
      createdAt: true,
      customer: { select: { customerCode: true, fullName: true } },
      deletedAt: true,
      expirationDate: true,
      frozenAt: true,
      initialSessions: true,
      initialGuestPasses: true,
      package: {
        select: {
          assignedCoach: { select: { firstName: true, lastName: true } },
          name: true,
          packageType: true,
        },
      },
      reactivatedAt: true,
      remainingSessions: true,
      remainingGuestPasses: true,
      status: true,
      updatedAt: true,
    },
  });

  return {
    columns: [
      { header: "Member ID", key: "customerCode", width: 16 },
      { header: "Customer Full Name", key: "customerName", width: 28 },
      { header: "Package Name", key: "packageName", width: 28 },
      { header: "Package Type", key: "packageType", width: 20 },
      { header: "Coach", key: "coach", width: 25 },
      { header: "Activation Date", key: "activationDate", width: 24 },
      { header: "Expiration Date", key: "expirationDate", width: 24 },
      { header: "Initial Sessions", key: "initialSessions", width: 18 },
      { header: "Remaining Sessions", key: "remainingSessions", width: 20 },
      {
        header: "Initial Guest Passes",
        key: "initialGuestPasses",
        width: 22,
      },
      {
        header: "Remaining Guest Passes",
        key: "remainingGuestPasses",
        width: 25,
      },
      { header: "Status", key: "status", width: 16 },
      { header: "Frozen At", key: "frozenAt", width: 24 },
      { header: "Reactivated At", key: "reactivatedAt", width: 24 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-customer-package-history",
    rows: customerPackages.map((customerPackage) => ({
      activationDate: formatDate(customerPackage.activationDate),
      coach: personName(
        customerPackage.coach ?? customerPackage.package.assignedCoach,
      ),
      createdAt: formatDate(customerPackage.createdAt),
      customerCode: customerPackage.customer.customerCode,
      customerName: customerPackage.customer.fullName,
      deletedAt: formatDate(customerPackage.deletedAt),
      expirationDate: formatDate(customerPackage.expirationDate),
      frozenAt: formatDate(customerPackage.frozenAt),
      initialSessions: customerPackage.initialSessions,
      initialGuestPasses: customerPackage.initialGuestPasses,
      packageName: customerPackage.package.name,
      packageType: customerPackage.package.packageType,
      reactivatedAt: formatDate(customerPackage.reactivatedAt),
      remainingSessions: customerPackage.remainingSessions,
      remainingGuestPasses: customerPackage.remainingGuestPasses,
      status: customerPackage.status,
      updatedAt: formatDate(customerPackage.updatedAt),
    })),
    worksheetName: "Customer Package History",
  };
}

async function visitsExport(): Promise<ExportDefinition> {
  const visits = await db.gymVisit.findMany({
    orderBy: { checkedInAt: "desc" },
    select: {
      checkedInAt: true,
      checkedInBy: { select: { name: true, username: true } },
      checkedOutAt: true,
      checkedOutBy: { select: { name: true, username: true } },
      customer: { select: { customerCode: true, fullName: true } },
      guestCountUsed: true,
      occupancyDelta: true,
      occupancyAfterCheckIn: true,
      occupancyAfterCheckOut: true,
      packageUsages: {
        select: {
          customerPackage: {
            select: {
              package: { select: { name: true } },
            },
          },
          guestPassesDeducted: true,
          sessionsDeducted: true,
        },
      },
    },
  });

  return {
    columns: [
      { header: "Member ID", key: "customerCode", width: 16 },
      { header: "Customer Full Name", key: "customerName", width: 28 },
      { header: "Checked In At", key: "checkedInAt", width: 24 },
      { header: "Checked Out At", key: "checkedOutAt", width: 24 },
      { header: "Checked In By", key: "checkedInBy", width: 24 },
      { header: "Checked Out By", key: "checkedOutBy", width: 24 },
      { header: "Guest Count Used", key: "guestCountUsed", width: 20 },
      {
        header: "Party Size / Occupancy Delta",
        key: "occupancyDelta",
        width: 29,
      },
      { header: "Occupancy After Check-In", key: "occupancyAfterCheckIn", width: 25 },
      { header: "Occupancy After Check-Out", key: "occupancyAfterCheckOut", width: 26 },
      { header: "Selected Packages", key: "selectedPackages", width: 36 },
      { header: "Sessions Deducted", key: "sessionsDeducted", width: 36 },
      {
        header: "Guest Passes Deducted",
        key: "guestPassesDeducted",
        width: 38,
      },
      { header: "Visit Status", key: "visitStatus", width: 16 },
    ],
    filePrefix: "smartfit-visits",
    rows: visits.map((visit) => ({
      checkedInAt: formatDate(visit.checkedInAt),
      checkedInBy: personName(visit.checkedInBy),
      checkedOutAt: formatDate(visit.checkedOutAt),
      checkedOutBy: personName(visit.checkedOutBy),
      customerCode: visit.customer.customerCode,
      customerName: visit.customer.fullName,
      guestCountUsed: visit.guestCountUsed,
      occupancyDelta: visit.occupancyDelta,
      occupancyAfterCheckIn: visit.occupancyAfterCheckIn,
      occupancyAfterCheckOut: visit.occupancyAfterCheckOut,
      selectedPackages:
        visit.packageUsages
          .map((usage) => usage.customerPackage.package.name)
          .join(", ") || null,
      sessionsDeducted:
        visit.packageUsages
          .map(
            (usage) =>
              `${usage.customerPackage.package.name}: ${usage.sessionsDeducted}`,
          )
          .join(", ") || null,
      guestPassesDeducted:
        visit.packageUsages
          .filter((usage) => usage.guestPassesDeducted > 0)
          .map(
            (usage) =>
              `${usage.customerPackage.package.name}: ${usage.guestPassesDeducted}`,
          )
          .join(", ") || null,
      visitStatus: visit.checkedOutAt ? "CLOSED" : "OPEN",
    })),
    worksheetName: "Visits",
  };
}

async function publicContentExport(): Promise<ExportDefinition> {
  const content = await db.publicContent.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      body: true,
      createdAt: true,
      createdBy: { select: { name: true, username: true } },
      deletedAt: true,
      endsAt: true,
      imageUrl: true,
      isActive: true,
      startsAt: true,
      title: true,
      type: true,
      updatedAt: true,
    },
  });

  return {
    columns: [
      { header: "Type", key: "type", width: 20 },
      { header: "Title", key: "title", width: 32 },
      { header: "Body / Description", key: "body", width: 48 },
      { header: "Image URL", key: "imageUrl", width: 40 },
      { header: "Starts At", key: "startsAt", width: 24 },
      { header: "Ends At", key: "endsAt", width: 24 },
      { header: "Active", key: "isActive", width: 12 },
      { header: "Created By", key: "createdBy", width: 24 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-public-content",
    rows: content.map((item) => ({
      body: item.body,
      createdAt: formatDate(item.createdAt),
      createdBy: personName(item.createdBy),
      deletedAt: formatDate(item.deletedAt),
      endsAt: formatDate(item.endsAt),
      imageUrl: item.imageUrl,
      isActive: item.isActive,
      startsAt: formatDate(item.startsAt),
      title: item.title,
      type: item.type,
      updatedAt: formatDate(item.updatedAt),
    })),
    worksheetName: "Public Content History",
  };
}

async function notesExport(): Promise<ExportDefinition> {
  const notes = await db.note.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      content: true,
      createdAt: true,
      createdBy: { select: { name: true, username: true } },
      customer: { select: { customerCode: true, fullName: true } },
      deletedAt: true,
      updatedAt: true,
      updatedBy: { select: { name: true, username: true } },
    },
  });

  return {
    columns: [
      { header: "Member ID", key: "customerCode", width: 16 },
      { header: "Customer Full Name", key: "customerName", width: 28 },
      { header: "Note Content", key: "content", width: 55 },
      { header: "Created By", key: "createdBy", width: 24 },
      { header: "Updated By", key: "updatedBy", width: 24 },
      { header: "Status", key: "status", width: 14 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
    ],
    filePrefix: "smartfit-notes",
    rows: notes.map((note) => ({
      content: note.content,
      createdAt: formatDate(note.createdAt),
      createdBy: personName(note.createdBy),
      customerCode: note.customer?.customerCode ?? null,
      customerName: note.customer?.fullName ?? null,
      deletedAt: formatDate(note.deletedAt),
      status: note.deletedAt ? "DELETED" : "ACTIVE",
      updatedAt: formatDate(note.updatedAt),
      updatedBy: personName(note.updatedBy),
    })),
    worksheetName: "Notes",
  };
}

export async function getExportDefinition(
  type: ExportType,
): Promise<ExportDefinition> {
  switch (type) {
    case "customers":
      return customersExport();
    case "packages":
      return packagesExport();
    case "coaches":
      return coachesExport();
    case "customer-package-history":
      return customerPackageHistoryExport();
    case "visits":
      return visitsExport();
    case "public-content":
      return publicContentExport();
    case "notes":
      return notesExport();
  }
}
