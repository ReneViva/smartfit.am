import {
  membershipCoachDisplayName,
  membershipDisplayName,
  serviceLineCoachDisplayName,
  serviceLineDisplayName,
} from "../customer-memberships";
import { db } from "../db";

export const exportCategories = [
  {
    description: "Member identity, contact, status, presence, and coach details.",
    label: "Customers",
    type: "customers",
  },
  {
    description:
      "Package definitions, categories, pricing, sessions, coaches, freeze defaults, and time rules.",
    label: "Packages",
    type: "packages",
  },
  {
    description: "Coach profiles, specialties, contact details, and status.",
    label: "Coaches",
    type: "coaches",
  },
  {
    description:
      "Full customer membership assignment, status, guest pass, service, and freeze balance history.",
    label: "Customer membership history",
    type: "customer-package-history",
  },
  {
    description:
      "Customer membership service lines, manual coach/person text, balances, dates, status, and notes.",
    label: "Membership services",
    type: "membership-services",
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
  {
    description:
      "Admin audit log entries with actor, target, customer, summary, and value snapshots.",
    label: "Audit logs",
    type: "audit-logs",
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

function formatDecimal(value: { toString(): string } | null) {
  return value?.toString() ?? null;
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

function categoryNames(
  categories: { category: { name: string; sortOrder: number } }[],
) {
  return (
    [...categories]
      .sort(
        (first, second) =>
          first.category.sortOrder - second.category.sortOrder ||
          first.category.name.localeCompare(second.category.name),
      )
      .map(({ category }) => category.name)
      .join(", ") || null
  );
}

function formatAccessLimit(unlimited: boolean, limit: number | null) {
  return unlimited ? "Unlimited" : (limit?.toString() ?? "Not configured");
}

function profilePhotoPresence(value: string | null) {
  return value ? "Present" : "None";
}

function formatJson(value: unknown) {
  return value === null || value === undefined
    ? null
    : JSON.stringify(value, null, 2);
}

function activeMembershipSummary(
  memberships: Array<{
    activationDate: Date;
    dailyCheckInLimit: number | null;
    expirationDate: Date;
    hasUnlimitedDailyCheckIns: boolean;
    hasUnlimitedIntervalCheckIns: boolean;
    intervalCheckInLimit: number | null;
    membershipName: string | null;
    package: { name: string } | null;
    remainingFreezeChances: number;
    remainingGuestPasses: number;
    services: Array<{
      deletedAt: Date | null;
      isActive: boolean;
      remainingSessions: number;
    }>;
    status: string;
  }>,
) {
  return (
    memberships
      .map((membership) => {
        const activeServiceSessions = membership.services
          .filter((service) => service.isActive && !service.deletedAt)
          .reduce((total, service) => total + service.remainingSessions, 0);

        return [
          `${membershipDisplayName(membership)} (${membership.status})`,
          `${formatDateOnly(membership.activationDate)} to ${formatDateOnly(
            membership.expirationDate,
          )}`,
          `daily ${formatAccessLimit(
            membership.hasUnlimitedDailyCheckIns,
            membership.dailyCheckInLimit,
          )}`,
          `interval ${formatAccessLimit(
            membership.hasUnlimitedIntervalCheckIns,
            membership.intervalCheckInLimit,
          )}`,
          `guest passes ${membership.remainingGuestPasses}`,
          `freeze chances ${membership.remainingFreezeChances}`,
          `service sessions ${activeServiceSessions}`,
        ].join("; ");
      })
      .join(" | ") || null
  );
}

const SERVICE_DEDUCTION_REASON_PREFIX = "Service check-in deduction:";

function serviceNameFromReason(reason: string | null) {
  if (!reason?.startsWith(SERVICE_DEDUCTION_REASON_PREFIX)) {
    return null;
  }

  return reason
    .slice(SERVICE_DEDUCTION_REASON_PREFIX.length)
    .replace(/\s+\[service:[^\]]+\]$/, "")
    .trim();
}

function targetTypeLabel(value: string | null) {
  if (!value) {
    return null;
  }

  const labels: Record<string, string> = {
    Category: "Category",
    Coach: "Coach",
    Customer: "Customer",
    CustomerDocument: "Customer document",
    CustomerPackage: "Customer membership",
    CustomerPackageService: "Membership service line",
    GalleryImage: "Gallery image",
    GymSettings: "Gym settings",
    GymVisit: "Gym visit",
    Note: "Note",
    OccupancyState: "Occupancy state",
    Package: "Package template",
    PackageFreeze: "Package freeze",
    PublicContent: "Public content",
  };

  return (
    labels[value] ??
    value
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/^./, (first) => first.toUpperCase())
  );
}

async function customersExport(): Promise<ExportDefinition> {
  const customers = await db.customer.findMany({
    orderBy: [{ fullName: "asc" }, { customerCode: "asc" }],
    select: {
      address: true,
      assignedCoach: { select: { firstName: true, lastName: true } },
      birthDate: true,
      createdAt: true,
      customerCode: true,
      deletedAt: true,
      email: true,
      emergencyPhone: true,
      firstName: true,
      fullName: true,
      gymPresenceStatus: true,
      lastName: true,
      packages: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          activationDate: true,
          dailyCheckInLimit: true,
          expirationDate: true,
          hasUnlimitedDailyCheckIns: true,
          hasUnlimitedIntervalCheckIns: true,
          intervalCheckInLimit: true,
          membershipName: true,
          package: { select: { name: true } },
          remainingFreezeChances: true,
          remainingGuestPasses: true,
          services: {
            select: {
              deletedAt: true,
              isActive: true,
              remainingSessions: true,
            },
          },
          status: true,
        },
        where: {
          deletedAt: null,
          status: "ACTIVE",
        },
      },
      phone: true,
      profileImageUrl: true,
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
      { header: "Email", key: "email", width: 28 },
      { header: "Address", key: "address", width: 34 },
      { header: "Emergency Phone", key: "emergencyPhone", width: 20 },
      { header: "Customer Status", key: "status", width: 18 },
      { header: "Gym Presence", key: "gymPresenceStatus", width: 18 },
      { header: "Assigned Coach", key: "assignedCoach", width: 25 },
      { header: "Archived", key: "archived", width: 12 },
      { header: "Profile Photo", key: "profilePhoto", width: 16 },
      {
        header: "Current Active Membership Summary",
        key: "activeMembershipSummary",
        width: 70,
      },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-customers",
    rows: customers.map((customer) => ({
      assignedCoach: personName(customer.assignedCoach),
      activeMembershipSummary: activeMembershipSummary(customer.packages),
      address: customer.address,
      archived: Boolean(customer.deletedAt),
      birthDate: formatDateOnly(customer.birthDate),
      createdAt: formatDate(customer.createdAt),
      customerCode: customer.customerCode,
      deletedAt: formatDate(customer.deletedAt),
      email: customer.email,
      emergencyPhone: customer.emergencyPhone,
      firstName: customer.firstName,
      fullName: customer.fullName,
      gymPresenceStatus: customer.gymPresenceStatus,
      lastName: customer.lastName,
      phone: customer.phone,
      profilePhoto: profilePhotoPresence(customer.profileImageUrl),
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
      categories: {
        select: {
          category: { select: { name: true, sortOrder: true } },
        },
      },
      createdAt: true,
      defaultFreezeChances: true,
      defaultGuestPasses: true,
      deletedAt: true,
      description: true,
      discountPrice: true,
      discountRibbonPercent: true,
      dailyCheckInLimit: true,
      hasUnlimitedDailyCheckIns: true,
      hasUnlimitedIntervalCheckIns: true,
      hasTimeRestriction: true,
      highlightOnPublicPackages: true,
      imageUrl: true,
      intervalCheckInLimit: true,
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
      { header: "Categories", key: "categories", width: 34 },
      { header: "Description", key: "description", width: 42 },
      { header: "Original Price", key: "price", width: 16 },
      { header: "Discount Price", key: "discountPrice", width: 16 },
      {
        header: "Discount Ribbon Percent",
        key: "discountRibbonPercent",
        width: 24,
      },
      { header: "Package Image URL", key: "imageUrl", width: 42 },
      {
        header: "Public Highlight",
        key: "highlightOnPublicPackages",
        width: 18,
      },
      { header: "Session Count", key: "sessionCount", width: 16 },
      {
        header: "Default Guest Passes",
        key: "defaultGuestPasses",
        width: 22,
      },
      {
        header: "Default Freeze Chances",
        key: "defaultFreezeChances",
        width: 25,
      },
      { header: "Package Type", key: "packageType", width: 20 },
      { header: "Assigned Coach", key: "assignedCoach", width: 25 },
      { header: "Active", key: "isActive", width: 12 },
      { header: "Archived", key: "archived", width: 12 },
      { header: "Interval Check-In Limit", key: "intervalCheckInLimit", width: 24 },
      { header: "Daily Check-In Limit", key: "dailyCheckInLimit", width: 22 },
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
      categories: categoryNames(gymPackage.categories),
      createdAt: formatDate(gymPackage.createdAt),
      archived: Boolean(gymPackage.deletedAt),
      dailyCheckInLimit: formatAccessLimit(
        gymPackage.hasUnlimitedDailyCheckIns,
        gymPackage.dailyCheckInLimit,
      ),
      defaultFreezeChances: gymPackage.defaultFreezeChances,
      defaultGuestPasses: gymPackage.defaultGuestPasses,
      deletedAt: formatDate(gymPackage.deletedAt),
      description: gymPackage.description,
      discountPrice: formatDecimal(gymPackage.discountPrice),
      discountRibbonPercent: gymPackage.discountRibbonPercent,
      hasTimeRestriction: gymPackage.hasTimeRestriction,
      highlightOnPublicPackages: gymPackage.highlightOnPublicPackages,
      imageUrl: gymPackage.imageUrl,
      intervalCheckInLimit: formatAccessLimit(
        gymPackage.hasUnlimitedIntervalCheckIns,
        gymPackage.intervalCheckInLimit,
      ),
      isActive: gymPackage.isActive,
      name: gymPackage.name,
      packageType: gymPackage.packageType,
      price: formatDecimal(gymPackage.price),
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
      categories: {
        select: {
          category: { select: { name: true, sortOrder: true } },
        },
      },
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
      { header: "Categories", key: "categories", width: 34 },
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
      categories: categoryNames(coach.categories),
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
      dailyCheckInLimit: true,
      deletedAt: true,
      expirationDate: true,
      frozenAt: true,
      hasUnlimitedDailyCheckIns: true,
      hasUnlimitedIntervalCheckIns: true,
      initialSessions: true,
      initialGuestPasses: true,
      intervalCheckInLimit: true,
      membershipName: true,
      package: {
        select: {
          assignedCoach: { select: { firstName: true, lastName: true } },
          categories: {
            select: {
              category: { select: { name: true, sortOrder: true } },
            },
          },
          name: true,
          packageType: true,
        },
      },
      reactivatedAt: true,
      remainingFreezeChances: true,
      remainingSessions: true,
      remainingGuestPasses: true,
      services: {
        orderBy: [{ sortOrder: "asc" }, { serviceName: "asc" }],
        select: {
          deletedAt: true,
          initialSessions: true,
          isActive: true,
          remainingSessions: true,
          serviceName: true,
        },
      },
      status: true,
      updatedAt: true,
    },
  });

  return {
    columns: [
      { header: "Member ID", key: "customerCode", width: 16 },
      { header: "Customer Full Name", key: "customerName", width: 28 },
      { header: "Membership Name", key: "membershipName", width: 28 },
      { header: "Legacy Package Template", key: "packageName", width: 28 },
      { header: "Legacy Package Categories", key: "packageCategories", width: 34 },
      { header: "Legacy Package Type", key: "packageType", width: 20 },
      { header: "Coach/Person", key: "coach", width: 25 },
      { header: "Activation Date", key: "activationDate", width: 24 },
      { header: "Expiration Date", key: "expirationDate", width: 24 },
      { header: "Initial Sessions", key: "initialSessions", width: 18 },
      { header: "Remaining Sessions", key: "remainingSessions", width: 20 },
      {
        header: "Active Service Lines",
        key: "activeServiceLineCount",
        width: 20,
      },
      {
        header: "Total Active Service Initial Sessions",
        key: "activeServiceInitialSessions",
        width: 34,
      },
      {
        header: "Total Active Service Remaining Sessions",
        key: "activeServiceRemainingSessions",
        width: 38,
      },
      {
        header: "Service Summary",
        key: "serviceSummary",
        width: 70,
      },
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
      {
        header: "Remaining Freeze Chances",
        key: "remainingFreezeChances",
        width: 27,
      },
      { header: "Interval Check-In Limit", key: "intervalCheckInLimit", width: 24 },
      { header: "Daily Check-In Limit", key: "dailyCheckInLimit", width: 22 },
      { header: "Status", key: "status", width: 16 },
      { header: "Frozen At", key: "frozenAt", width: 24 },
      { header: "Reactivated At", key: "reactivatedAt", width: 24 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-customer-package-history",
    rows: customerPackages.map((customerPackage) => {
      const activeServices = customerPackage.services.filter(
        (service) => service.isActive && !service.deletedAt,
      );

      return {
        activationDate: formatDate(customerPackage.activationDate),
        activeServiceInitialSessions: activeServices.reduce(
          (total, service) => total + service.initialSessions,
          0,
        ),
        activeServiceLineCount: activeServices.length,
        activeServiceRemainingSessions: activeServices.reduce(
          (total, service) => total + service.remainingSessions,
          0,
        ),
        coach: membershipCoachDisplayName(customerPackage),
        createdAt: formatDate(customerPackage.createdAt),
        customerCode: customerPackage.customer.customerCode,
        customerName: customerPackage.customer.fullName,
        dailyCheckInLimit: formatAccessLimit(
          customerPackage.hasUnlimitedDailyCheckIns,
          customerPackage.dailyCheckInLimit,
        ),
        deletedAt: formatDate(customerPackage.deletedAt),
        expirationDate: formatDate(customerPackage.expirationDate),
        frozenAt: formatDate(customerPackage.frozenAt),
        initialSessions: customerPackage.initialSessions,
        initialGuestPasses: customerPackage.initialGuestPasses,
        intervalCheckInLimit: formatAccessLimit(
          customerPackage.hasUnlimitedIntervalCheckIns,
          customerPackage.intervalCheckInLimit,
        ),
        membershipName: membershipDisplayName(customerPackage),
        packageCategories: customerPackage.package
          ? categoryNames(customerPackage.package.categories)
          : null,
        packageName: customerPackage.package?.name ?? null,
        packageType: customerPackage.package?.packageType ?? null,
        reactivatedAt: formatDate(customerPackage.reactivatedAt),
        remainingFreezeChances: customerPackage.remainingFreezeChances,
        remainingSessions: customerPackage.remainingSessions,
        remainingGuestPasses: customerPackage.remainingGuestPasses,
        serviceSummary:
          customerPackage.services
            .map(
              (service) =>
                `${serviceLineDisplayName(service)}: ${service.remainingSessions}/${service.initialSessions}${
                  service.isActive && !service.deletedAt ? "" : " inactive"
                }`,
            )
            .join("; ") || null,
        status: customerPackage.status,
        updatedAt: formatDate(customerPackage.updatedAt),
      };
    }),
    worksheetName: "Customer Membership History",
  };
}

async function membershipServicesExport(): Promise<ExportDefinition> {
  const services = await db.customerPackageService.findMany({
    orderBy: [{ createdAt: "desc" }, { serviceName: "asc" }],
    select: {
      category: { select: { name: true } },
      coach: { select: { firstName: true, lastName: true } },
      coachName: true,
      createdAt: true,
      customerPackage: {
        select: {
          activationDate: true,
          customer: { select: { customerCode: true, fullName: true } },
          expirationDate: true,
          membershipName: true,
          package: { select: { name: true, packageType: true } },
          status: true,
        },
      },
      deletedAt: true,
      freezes: {
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        select: {
          actualDays: true,
          actualEndDate: true,
          mode: true,
          plannedDays: true,
          plannedEndDate: true,
          resultingServiceEndDate: true,
          startDate: true,
          status: true,
        },
        take: 1,
      },
      initialSessions: true,
      isActive: true,
      notes: true,
      package: { select: { name: true } },
      remainingSessions: true,
      serviceName: true,
      sortOrder: true,
      updatedAt: true,
    },
  });

  return {
    columns: [
      { header: "Member ID", key: "customerCode", width: 16 },
      { header: "Customer Full Name", key: "customerName", width: 28 },
      { header: "Membership Name", key: "membershipName", width: 30 },
      { header: "Membership Status", key: "membershipStatus", width: 18 },
      { header: "Activation Date", key: "activationDate", width: 24 },
      { header: "Expiration Date", key: "expirationDate", width: 24 },
      { header: "Service Name", key: "serviceName", width: 30 },
      { header: "Coach/Person", key: "coachName", width: 25 },
      { header: "Legacy Category", key: "categoryName", width: 24 },
      { header: "Legacy Membership Package", key: "membershipPackage", width: 30 },
      { header: "Legacy Service Package Template", key: "servicePackage", width: 30 },
      { header: "Initial Sessions", key: "initialSessions", width: 18 },
      { header: "Remaining Sessions", key: "remainingSessions", width: 20 },
      { header: "Freeze State", key: "freezeState", width: 18 },
      { header: "Latest Freeze", key: "latestFreeze", width: 45 },
      {
        header: "Latest Freeze Resulting End",
        key: "latestFreezeResultingEnd",
        width: 28,
      },
      { header: "Active", key: "isActive", width: 12 },
      { header: "Deleted At", key: "deletedAt", width: 24 },
      { header: "Sort Order", key: "sortOrder", width: 14 },
      { header: "Notes", key: "notes", width: 45 },
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Updated At", key: "updatedAt", width: 24 },
    ],
    filePrefix: "smartfit-membership-services",
    rows: services.map((service) => ({
      activationDate: formatDate(service.customerPackage.activationDate),
      categoryName: service.category?.name ?? null,
      coachName: serviceLineCoachDisplayName(service),
      createdAt: formatDate(service.createdAt),
      customerCode: service.customerPackage.customer.customerCode,
      customerName: service.customerPackage.customer.fullName,
      deletedAt: formatDate(service.deletedAt),
      expirationDate: formatDate(service.customerPackage.expirationDate),
      freezeState: service.freezes[0]?.status ?? "NONE",
      initialSessions: service.initialSessions,
      isActive: service.isActive && !service.deletedAt,
      latestFreeze: service.freezes[0]
        ? `${service.freezes[0].mode} ${service.freezes[0].plannedDays} day(s), ${formatDate(service.freezes[0].startDate)} to ${formatDate(service.freezes[0].actualEndDate ?? service.freezes[0].plannedEndDate)}`
        : null,
      latestFreezeResultingEnd: formatDate(
        service.freezes[0]?.resultingServiceEndDate ?? null,
      ),
      membershipName: membershipDisplayName(service.customerPackage),
      membershipPackage: service.customerPackage.package
        ? `${service.customerPackage.package.name} (${service.customerPackage.package.packageType})`
        : null,
      membershipStatus: service.customerPackage.status,
      notes: service.notes,
      remainingSessions: service.remainingSessions,
      serviceName: serviceLineDisplayName(service),
      servicePackage: service.package?.name ?? null,
      sortOrder: service.sortOrder,
      updatedAt: formatDate(service.updatedAt),
    })),
    worksheetName: "Membership Services",
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
              membershipName: true,
              package: { select: { name: true } },
            },
          },
          guestPassesDeducted: true,
          sessionChange: {
            select: {
              delta: true,
              id: true,
              reason: true,
            },
          },
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
      { header: "Duration Minutes", key: "durationMinutes", width: 18 },
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
      { header: "Selected Memberships", key: "selectedPackages", width: 36 },
      { header: "Service Usage Summary", key: "serviceUsageSummary", width: 48 },
      { header: "Sessions Deducted", key: "sessionsDeducted", width: 36 },
      {
        header: "Guest Passes Deducted",
        key: "guestPassesDeducted",
        width: 38,
      },
      { header: "Session Change References", key: "sessionChangeReferences", width: 38 },
      { header: "Visit Status", key: "visitStatus", width: 16 },
    ],
    filePrefix: "smartfit-visits",
    rows: visits.map((visit) => {
      const durationMinutes = visit.checkedOutAt
        ? Math.max(
            0,
            Math.round(
              (visit.checkedOutAt.getTime() - visit.checkedInAt.getTime()) /
                60_000,
            ),
          )
        : null;

      return {
        checkedInAt: formatDate(visit.checkedInAt),
        checkedInBy: personName(visit.checkedInBy),
        checkedOutAt: formatDate(visit.checkedOutAt),
        checkedOutBy: personName(visit.checkedOutBy),
        customerCode: visit.customer.customerCode,
        customerName: visit.customer.fullName,
        durationMinutes,
        guestCountUsed: visit.guestCountUsed,
        occupancyDelta: visit.occupancyDelta,
        occupancyAfterCheckIn: visit.occupancyAfterCheckIn,
        occupancyAfterCheckOut: visit.occupancyAfterCheckOut,
        selectedPackages:
          visit.packageUsages
            .map((usage) => membershipDisplayName(usage.customerPackage))
            .join(", ") || null,
        serviceUsageSummary:
          visit.packageUsages
            .map((usage) => {
              const serviceName = serviceNameFromReason(
                usage.sessionChange?.reason ?? null,
              );

              return serviceName
                ? `${serviceName}: ${usage.sessionsDeducted}`
                : `${membershipDisplayName(usage.customerPackage)}: ${usage.sessionsDeducted}`;
            })
            .join(", ") || null,
        sessionsDeducted:
          visit.packageUsages
            .map(
              (usage) =>
                `${membershipDisplayName(usage.customerPackage)}: ${usage.sessionsDeducted}`,
            )
            .join(", ") || null,
        guestPassesDeducted:
          visit.packageUsages
            .filter((usage) => usage.guestPassesDeducted > 0)
            .map(
              (usage) =>
                `${membershipDisplayName(usage.customerPackage)}: ${usage.guestPassesDeducted}`,
            )
            .join(", ") || null,
        sessionChangeReferences:
          visit.packageUsages
            .flatMap((usage) =>
              usage.sessionChange
                ? [`${usage.sessionChange.id}: ${usage.sessionChange.delta}`]
                : [],
            )
            .join(", ") || null,
        visitStatus: visit.checkedOutAt ? "CLOSED" : "OPEN",
      };
    }),
    worksheetName: "Visits",
  };
}

async function publicContentExport(): Promise<ExportDefinition> {
  const content = await db.publicContent.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      body: true,
      ctaLabel: true,
      ctaUrl: true,
      createdAt: true,
      createdBy: { select: { name: true, username: true } },
      deletedAt: true,
      endsAt: true,
      imageUrl: true,
      isActive: true,
      sortOrder: true,
      startsAt: true,
      title: true,
      type: true,
      updatedAt: true,
      visibleOnApp: true,
    },
  });

  return {
    columns: [
      { header: "Type", key: "type", width: 20 },
      { header: "Title", key: "title", width: 32 },
      { header: "Body / Description", key: "body", width: 48 },
      { header: "Image URL", key: "imageUrl", width: 40 },
      { header: "CTA URL", key: "ctaUrl", width: 40 },
      { header: "CTA Label", key: "ctaLabel", width: 24 },
      { header: "Sort Order", key: "sortOrder", width: 14 },
      { header: "Visible On Our App", key: "visibleOnApp", width: 20 },
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
      ctaLabel: item.ctaLabel,
      ctaUrl: item.ctaUrl,
      deletedAt: formatDate(item.deletedAt),
      endsAt: formatDate(item.endsAt),
      imageUrl: item.imageUrl,
      isActive: item.isActive,
      sortOrder: item.sortOrder,
      startsAt: formatDate(item.startsAt),
      title: item.title,
      type: item.type,
      updatedAt: formatDate(item.updatedAt),
      visibleOnApp: item.visibleOnApp,
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

async function auditLogsExport(): Promise<ExportDefinition> {
  const logs = await db.auditLog.findMany({
    include: {
      actor: { select: { name: true, username: true } },
      customer: { select: { customerCode: true, fullName: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return {
    columns: [
      { header: "Created At", key: "createdAt", width: 24 },
      { header: "Actor", key: "actor", width: 24 },
      { header: "Action", key: "actionType", width: 26 },
      { header: "Target Type", key: "targetType", width: 26 },
      { header: "Target ID", key: "targetId", width: 30 },
      { header: "Customer", key: "customer", width: 36 },
      { header: "Summary", key: "description", width: 70 },
      { header: "Previous Value", key: "oldValue", width: 60 },
      { header: "New Value", key: "newValue", width: 60 },
    ],
    filePrefix: "smartfit-audit-logs",
    rows: logs.map((log) => ({
      actionType: log.actionType.toLowerCase().replaceAll("_", " "),
      actor: personName(log.actor),
      createdAt: formatDate(log.createdAt),
      customer: log.customer
        ? `${log.customer.customerCode}: ${log.customer.fullName}`
        : null,
      description: log.description,
      newValue: formatJson(log.newValue),
      oldValue: formatJson(log.oldValue),
      targetId: log.targetId,
      targetType: targetTypeLabel(log.targetType),
    })),
    worksheetName: "Audit Logs",
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
    case "membership-services":
      return membershipServicesExport();
    case "visits":
      return visitsExport();
    case "public-content":
      return publicContentExport();
    case "notes":
      return notesExport();
    case "audit-logs":
      return auditLogsExport();
  }
}
