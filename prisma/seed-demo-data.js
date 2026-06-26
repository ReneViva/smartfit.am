const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DAYTIME_RESTRICTION = {
  allowedEndTime: "15:00",
  allowedStartTime: "06:00",
  hasTimeRestriction: true,
  timeRestrictionLabel: "Daytime access, usable before 3:00 PM",
};

const ALL_DAY_RESTRICTION = {
  allowedEndTime: null,
  allowedStartTime: null,
  hasTimeRestriction: false,
  timeRestrictionLabel: null,
};

const coaches = [
  {
    contactInfo: "Available through Smartfit reception",
    description:
      "Strength coach focused on proper technique, progressive training, and personal programs.",
    firstName: "Davit",
    lastName: "Hakobyan",
    specialty: "Strength and Personal Training",
  },
  {
    contactInfo: "Available through Smartfit reception",
    description:
      "Coach for group workouts, functional fitness, and beginner-friendly training.",
    firstName: "Ani",
    lastName: "Grigoryan",
    specialty: "Functional and Group Training",
  },
  {
    contactInfo: "Available through Smartfit reception",
    description:
      "Fitness coach focused on conditioning, mobility, and general gym progress.",
    firstName: "Aram",
    lastName: "Petrosyan",
    specialty: "Fitness and Conditioning",
  },
];

const categories = [
  {
    description: "General gym access memberships and visit-based passes.",
    isPublic: true,
    name: "Gym Access",
    slug: "gym-access",
    sortOrder: 10,
  },
  {
    description: "Coached personal, group, and fitness trainer sessions.",
    isPublic: true,
    name: "Training",
    slug: "training",
    sortOrder: 20,
  },
  {
    description: "Swimming packages and pool access offers.",
    isPublic: true,
    name: "Swimming",
    slug: "swimming",
    sortOrder: 30,
  },
  {
    description: "Cardio-focused access packages.",
    isPublic: true,
    name: "Cardio",
    slug: "cardio",
    sortOrder: 40,
  },
  {
    description: "Couple and member-value offers for the public packages page.",
    isPublic: true,
    name: "Member Offers",
    slug: "member-offers",
    sortOrder: 50,
  },
];

// Duration-only memberships use demo session approximations until unlimited
// membership behavior is separately confirmed: 30/90/180/365 sessions.
const packages = [
  {
    ...ALL_DAY_RESTRICTION,
    description: "All-day access package for 1 month with 12 visits.",
    durationDays: 30,
    name: "All-Day Access — 1 Month / 12 Visits",
    packageType: "GYM_ACCESS",
    price: 16000,
    sessionCount: 12,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description: "All-day access package for 1 month with 16 visits.",
    discountPrice: 19000,
    durationDays: 30,
    highlightOnPublicPackages: true,
    name: "All-Day Access — 1 Month / 16 Visits",
    packageType: "GYM_ACCESS",
    price: 21000,
    sessionCount: 16,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day individual 1-month membership. Demo session count approximates daily usage.",
    durationDays: 30,
    name: "All-Day Access — 1 Month — Individual",
    packageType: "GYM_ACCESS",
    price: 40000,
    sessionCount: 30,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day couple 1-month membership. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 30,
    name: "All-Day Access — 1 Month — Couple",
    packageType: "GYM_ACCESS",
    price: 72000,
    sessionCount: 30,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day individual 3-month membership. Demo session count approximates daily usage.",
    durationDays: 90,
    name: "All-Day Access — 3 Months — Individual",
    packageType: "GYM_ACCESS",
    price: 108000,
    sessionCount: 90,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day couple 3-month membership. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 90,
    name: "All-Day Access — 3 Months — Couple",
    packageType: "GYM_ACCESS",
    price: 194000,
    sessionCount: 90,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day individual 6-month membership. Demo session count approximates daily usage.",
    durationDays: 180,
    name: "All-Day Access — 6 Months — Individual",
    packageType: "GYM_ACCESS",
    price: 192000,
    sessionCount: 180,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day couple 6-month membership. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 180,
    name: "All-Day Access — 6 Months — Couple",
    packageType: "GYM_ACCESS",
    price: 345600,
    sessionCount: 180,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day individual 12-month membership. Demo session count approximates daily usage.",
    durationDays: 365,
    name: "All-Day Access — 12 Months — Individual",
    packageType: "GYM_ACCESS",
    price: 288000,
    sessionCount: 365,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description:
      "All-day couple 12-month membership. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 365,
    name: "All-Day Access — 12 Months — Couple",
    packageType: "GYM_ACCESS",
    price: 518400,
    sessionCount: 365,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime access package for 1 month with 12 visits. Usable before 3:00 PM.",
    durationDays: 30,
    name: "Daytime Access — 1 Month / 12 Visits",
    packageType: "GYM_ACCESS",
    price: 11000,
    sessionCount: 12,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime access package for 1 month with 16 visits. Usable before 3:00 PM.",
    durationDays: 30,
    name: "Daytime Access — 1 Month / 16 Visits",
    packageType: "GYM_ACCESS",
    price: 15000,
    sessionCount: 16,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime individual 1-month membership. Usable before 3:00 PM. Demo session count approximates daily usage.",
    durationDays: 30,
    name: "Daytime Access — 1 Month — Individual",
    packageType: "GYM_ACCESS",
    price: 28000,
    sessionCount: 30,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime couple 1-month membership. Usable before 3:00 PM. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 30,
    name: "Daytime Access — 1 Month — Couple",
    packageType: "GYM_ACCESS",
    price: 50400,
    sessionCount: 30,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime individual 3-month membership. Usable before 3:00 PM. Demo session count approximates daily usage.",
    durationDays: 90,
    name: "Daytime Access — 3 Months — Individual",
    packageType: "GYM_ACCESS",
    price: 75000,
    sessionCount: 90,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime couple 3-month membership. Usable before 3:00 PM. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 90,
    name: "Daytime Access — 3 Months — Couple",
    packageType: "GYM_ACCESS",
    price: 135000,
    sessionCount: 90,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime individual 6-month membership. Usable before 3:00 PM. Demo session count approximates daily usage.",
    durationDays: 180,
    name: "Daytime Access — 6 Months — Individual",
    packageType: "GYM_ACCESS",
    price: 135000,
    sessionCount: 180,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime couple 6-month membership. Usable before 3:00 PM. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 180,
    name: "Daytime Access — 6 Months — Couple",
    packageType: "GYM_ACCESS",
    price: 243000,
    sessionCount: 180,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime individual 12-month membership. Usable before 3:00 PM. Demo session count approximates daily usage.",
    durationDays: 365,
    name: "Daytime Access — 12 Months — Individual",
    packageType: "GYM_ACCESS",
    price: 200000,
    sessionCount: 365,
  },
  {
    ...DAYTIME_RESTRICTION,
    description:
      "Daytime couple 12-month membership. Usable before 3:00 PM. Couple behavior is represented as a package name only in the MVP.",
    durationDays: 365,
    name: "Daytime Access — 12 Months — Couple",
    packageType: "GYM_ACCESS",
    price: 360000,
    sessionCount: 365,
  },
  {
    ...ALL_DAY_RESTRICTION,
    assignedCoachName: "Davit Hakobyan",
    description: "Personal training package with 8 classes.",
    durationDays: 90,
    name: "Personal Training — 8 Classes",
    packageType: "PERSONAL_TRAINING",
    price: 50000,
    sessionCount: 8,
  },
  {
    ...ALL_DAY_RESTRICTION,
    assignedCoachName: "Davit Hakobyan",
    description: "Personal training package with 12 classes.",
    durationDays: 90,
    name: "Personal Training — 12 Classes",
    packageType: "PERSONAL_TRAINING",
    price: 75000,
    sessionCount: 12,
  },
  {
    ...ALL_DAY_RESTRICTION,
    assignedCoachName: "Ani Grigoryan",
    description: "Group training package with 8 classes.",
    durationDays: 90,
    name: "Group Training — 8 Classes",
    packageType: "GROUP_TRAINING",
    price: 30000,
    sessionCount: 8,
  },
  {
    ...ALL_DAY_RESTRICTION,
    assignedCoachName: "Ani Grigoryan",
    description: "Group training package with 12 classes.",
    durationDays: 90,
    name: "Group Training — 12 Classes",
    packageType: "GROUP_TRAINING",
    price: 45000,
    sessionCount: 12,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description: "Swimming access package with 12 visits.",
    durationDays: 30,
    name: "Swimming Access — 12 Visits",
    packageType: "SWIMMING",
    price: 18000,
    sessionCount: 12,
  },
  {
    ...ALL_DAY_RESTRICTION,
    description: "Cardio-focused access package with 12 visits.",
    durationDays: 30,
    name: "Cardio Package — 12 Visits",
    packageType: "CARDIO",
    price: 18000,
    sessionCount: 12,
  },
  {
    ...ALL_DAY_RESTRICTION,
    assignedCoachName: "Aram Petrosyan",
    description: "Fitness trainer package with 8 coached sessions.",
    durationDays: 90,
    name: "Fitness Trainer Sessions — 8 Classes",
    packageType: "FITNESS_TRAINER",
    price: 50000,
    sessionCount: 8,
  },
];

const customers = [
  {
    assignedCoachName: "Davit Hakobyan",
    birthDate: "1992-04-12",
    customerCode: "0012",
    emergencyPhone: "+374 77 101 012",
    firstName: "Rene",
    lastName: "Vartanian",
    packages: [
      {
        name: "All-Day Access — 1 Month / 12 Visits",
        remainingSessions: 7,
        status: "ACTIVE",
      },
      {
        name: "Personal Training — 8 Classes",
        remainingSessions: 7,
        status: "ACTIVE",
      },
    ],
    phone: "+374 77 001 012",
  },
  {
    assignedCoachName: "Ani Grigoryan",
    birthDate: "1996-09-21",
    customerCode: "0001",
    emergencyPhone: "+374 77 101 001",
    firstName: "Mariam",
    lastName: "Sargsyan",
    packages: [
      {
        name: "Daytime Access — 1 Month / 16 Visits",
        remainingSessions: 10,
        status: "ACTIVE",
      },
    ],
    phone: "+374 77 001 001",
  },
  {
    assignedCoachName: null,
    birthDate: "1988-02-08",
    customerCode: "0002",
    emergencyPhone: "+374 77 101 002",
    firstName: "Narek",
    lastName: "Hovhannisyan",
    packages: [
      {
        name: "All-Day Access — 1 Month — Individual",
        remainingSessions: 25,
        status: "ACTIVE",
      },
    ],
    phone: "+374 77 001 002",
  },
  {
    assignedCoachName: "Ani Grigoryan",
    birthDate: "1999-11-14",
    customerCode: "0003",
    emergencyPhone: "+374 77 101 003",
    firstName: "Lilit",
    lastName: "Grigoryan",
    packages: [
      {
        name: "Group Training — 12 Classes",
        remainingSessions: 12,
        status: "ACTIVE",
      },
    ],
    phone: "+374 77 001 003",
  },
  {
    assignedCoachName: "Aram Petrosyan",
    birthDate: "1991-06-30",
    customerCode: "0004",
    emergencyPhone: "+374 77 101 004",
    firstName: "Gor",
    lastName: "Khachatryan",
    packages: [
      {
        name: "All-Day Access — 1 Month / 12 Visits",
        remainingFreezeChances: 3,
        remainingSessions: 0,
        status: "ACTIVE",
      },
    ],
    phone: "+374 77 001 004",
  },
  {
    assignedCoachName: null,
    birthDate: "1985-01-19",
    customerCode: "0005",
    emergencyPhone: "+374 77 101 005",
    firstName: "Anahit",
    lastName: "Petrosyan",
    packages: [],
    phone: "+374 77 001 005",
  },
  {
    assignedCoachName: "Davit Hakobyan",
    birthDate: "1994-08-05",
    customerCode: "0006",
    emergencyPhone: "+374 77 101 006",
    firstName: "Tigran",
    lastName: "Mkrtchyan",
    packages: [
      {
        name: "All-Day Access — 3 Months — Individual",
        remainingFreezeChances: 2,
        remainingSessions: 40,
        status: "FROZEN",
      },
    ],
    phone: "+374 77 001 006",
  },
  {
    assignedCoachName: null,
    birthDate: "1997-03-27",
    customerCode: "0007",
    emergencyPhone: "+374 77 101 007",
    firstName: "Sona",
    lastName: "Harutyunyan",
    packages: [
      {
        name: "Daytime Access — 1 Month — Individual",
        remainingSessions: 5,
        status: "EXPIRED",
      },
    ],
    phone: "+374 77 001 007",
  },
];

const publicContents = [
  {
    body: "A focused seasonal offer for members who want coached training plus open gym access.",
    imageUrl:
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    sortOrder: 10,
    title: "Summer Training Pass",
    type: "OFFER",
  },
  {
    body: "Bring a training partner and ask reception about current couple package availability.",
    imageUrl: null,
    sortOrder: 20,
    title: "Couple Access Packages",
    type: "PROMOTION",
  },
  {
    body: "The public app can show live occupancy, active offers, and contact details when enabled.",
    imageUrl: null,
    sortOrder: 30,
    title: "Plan Your Visit",
    type: "ANNOUNCEMENT",
    visibleOnApp: true,
  },
];

function assertDemoSeedIsSafe() {
  if (process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error(
      "Demo seed blocked. Set ALLOW_DEMO_SEED=true only for an intentional local/dev database seed.",
    );
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("Demo seed blocked while NODE_ENV is production.");
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("Demo seed blocked because DATABASE_URL is missing.");
  }

  let databaseTarget;
  try {
    const parsedUrl = new URL(databaseUrl);
    databaseTarget = `${parsedUrl.hostname}${parsedUrl.pathname}`.toLowerCase();
  } catch {
    throw new Error("Demo seed blocked because DATABASE_URL could not be parsed.");
  }

  if (["prod", "production", "live"].some((word) => databaseTarget.includes(word))) {
    throw new Error(
      "Demo seed blocked because the database host or database name looks production-like.",
    );
  }
}

function startOfToday() {
  const value = new Date();
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(value, days) {
  const result = new Date(value);
  result.setDate(result.getDate() + days);
  return result;
}

async function seedCoach(coach) {
  const existing = await prisma.coach.findFirst({
    where: {
      firstName: coach.firstName,
      lastName: coach.lastName,
    },
  });
  const data = {
    ...coach,
    deletedAt: null,
    isActive: true,
    photoUrl: null,
  };

  if (existing) {
    return prisma.coach.update({ data, where: { id: existing.id } });
  }

  return prisma.coach.create({ data });
}

async function seedCategory(category) {
  return prisma.category.upsert({
    create: {
      ...category,
      archivedAt: null,
      isArchived: false,
    },
    update: {
      ...category,
      archivedAt: null,
      isArchived: false,
    },
    where: { slug: category.slug },
  });
}

function categorySlugsForPackage(gymPackage) {
  const slugs = new Set();

  if (gymPackage.packageType === "GYM_ACCESS") {
    slugs.add("gym-access");
  }

  if (
    ["PERSONAL_TRAINING", "GROUP_TRAINING", "FITNESS_TRAINER"].includes(
      gymPackage.packageType,
    )
  ) {
    slugs.add("training");
  }

  if (gymPackage.packageType === "SWIMMING") {
    slugs.add("swimming");
  }

  if (gymPackage.packageType === "CARDIO") {
    slugs.add("cardio");
  }

  if (gymPackage.name.includes("Couple")) {
    slugs.add("member-offers");
  }

  return [...slugs];
}

async function linkPackageCategories(packageId, categorySlugs, categoryIdsBySlug) {
  for (const slug of categorySlugs) {
    const categoryId = categoryIdsBySlug.get(slug);
    if (!categoryId) {
      throw new Error(`Demo category was not seeded: ${slug}`);
    }

    await prisma.packageCategory.upsert({
      create: {
        categoryId,
        packageId,
      },
      update: {},
      where: {
        packageId_categoryId: {
          categoryId,
          packageId,
        },
      },
    });
  }
}

async function seedPackage(gymPackage, coachIdsByName, categoryIdsBySlug) {
  const { assignedCoachName, durationDays, ...packageData } = gymPackage;
  const existing = await prisma.package.findFirst({
    where: { name: gymPackage.name },
  });
  const data = {
    ...packageData,
    discountPrice: gymPackage.discountPrice ?? null,
    defaultFreezeChances: gymPackage.defaultFreezeChances ?? 3,
    defaultGuestPasses: gymPackage.name.includes("Couple") ? 2 : 0,
    highlightOnPublicPackages: gymPackage.highlightOnPublicPackages ?? false,
    assignedCoachId: assignedCoachName
      ? coachIdsByName.get(assignedCoachName)
      : null,
    deletedAt: null,
    isActive: true,
  };
  let record;

  if (existing) {
    record = await prisma.package.update({
      data,
      where: { id: existing.id },
    });
  } else {
    record = await prisma.package.create({ data });
  }

  await linkPackageCategories(
    record.id,
    categorySlugsForPackage(gymPackage),
    categoryIdsBySlug,
  );

  return { ...record, durationDays };
}

async function seedPublicContent(content) {
  const existing = await prisma.publicContent.findFirst({
    where: {
      title: content.title,
      type: content.type,
    },
  });
  const data = {
    ...content,
    deletedAt: null,
    endsAt: null,
    isActive: true,
    startsAt: null,
  };

  if (existing) {
    return prisma.publicContent.update({
      data,
      where: { id: existing.id },
    });
  }

  return prisma.publicContent.create({ data });
}

async function seedCustomer(customer, coachIdsByName) {
  return prisma.customer.upsert({
    create: {
      assignedCoachId: customer.assignedCoachName
        ? coachIdsByName.get(customer.assignedCoachName)
        : null,
      birthDate: new Date(`${customer.birthDate}T00:00:00.000Z`),
      customerCode: customer.customerCode,
      deletedAt: null,
      emergencyPhone: customer.emergencyPhone,
      firstName: customer.firstName,
      fullName: `${customer.firstName} ${customer.lastName}`,
      gymPresenceStatus: "NOT_IN_GYM",
      lastName: customer.lastName,
      phone: customer.phone,
      status: "ACTIVE",
    },
    update: {
      // Preserve existing visit/presence workflow state on repeat demo seeds.
      assignedCoachId: customer.assignedCoachName
        ? coachIdsByName.get(customer.assignedCoachName)
        : null,
      birthDate: new Date(`${customer.birthDate}T00:00:00.000Z`),
      deletedAt: null,
      emergencyPhone: customer.emergencyPhone,
      firstName: customer.firstName,
      fullName: `${customer.firstName} ${customer.lastName}`,
      lastName: customer.lastName,
      phone: customer.phone,
      status: "ACTIVE",
    },
    where: { customerCode: customer.customerCode },
  });
}

async function seedCustomerPackage({
  assignment,
  customerId,
  packageRecord,
}) {
  const today = startOfToday();
  const isExpired = assignment.status === "EXPIRED";
  const activationDate = isExpired ? addDays(today, -60) : today;
  const expirationDate = isExpired
    ? addDays(today, -1)
    : addDays(today, packageRecord.durationDays);
  const existing = await prisma.customerPackage.findFirst({
    where: {
      customerId,
      packageId: packageRecord.id,
    },
  });
  const data = {
    activationDate,
    coachId: null,
    deletedAt: null,
    expirationDate,
    frozenAt: assignment.status === "FROZEN" ? new Date() : null,
    initialSessions: packageRecord.sessionCount,
    initialGuestPasses: packageRecord.defaultGuestPasses,
    reactivatedAt: null,
    remainingFreezeChances:
      assignment.remainingFreezeChances ?? packageRecord.defaultFreezeChances,
    remainingSessions: assignment.remainingSessions,
    remainingGuestPasses: packageRecord.defaultGuestPasses,
    status: assignment.status,
  };

  if (existing) {
    return prisma.customerPackage.update({
      data,
      where: { id: existing.id },
    });
  }

  return prisma.customerPackage.create({
    data: {
      ...data,
      customerId,
      packageId: packageRecord.id,
    },
  });
}

async function main() {
  assertDemoSeedIsSafe();

  const coachIdsByName = new Map();
  for (const coach of coaches) {
    const record = await seedCoach(coach);
    coachIdsByName.set(`${record.firstName} ${record.lastName}`, record.id);
  }

  const categoryIdsBySlug = new Map();
  for (const category of categories) {
    const record = await seedCategory(category);
    categoryIdsBySlug.set(record.slug, record.id);
  }

  const packagesByName = new Map();
  for (const gymPackage of packages) {
    const record = await seedPackage(
      gymPackage,
      coachIdsByName,
      categoryIdsBySlug,
    );
    packagesByName.set(record.name, record);
  }

  let assignmentCount = 0;
  for (const customer of customers) {
    const customerRecord = await seedCustomer(customer, coachIdsByName);

    for (const assignment of customer.packages) {
      const packageRecord = packagesByName.get(assignment.name);
      if (!packageRecord) {
        throw new Error(`Demo package was not seeded: ${assignment.name}`);
      }

      await seedCustomerPackage({
        assignment,
        customerId: customerRecord.id,
        packageRecord,
      });
      assignmentCount += 1;
    }
  }

  for (const content of publicContents) {
    await seedPublicContent(content);
  }

  console.log("Smartfit demo data seed complete.");
  console.log(`Coaches prepared: ${coaches.length}`);
  console.log(`Categories prepared: ${categories.length}`);
  console.log(`Official packages prepared: ${packages.length}`);
  console.log(`Demo customers prepared: ${customers.length}`);
  console.log(`Demo customer-package assignments prepared: ${assignmentCount}`);
  console.log(`Public content items prepared: ${publicContents.length}`);
  console.log("No visits, check-ins, session changes, audit logs, or occupancy changes were created.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : error);
    await prisma.$disconnect();
    process.exit(1);
  });
