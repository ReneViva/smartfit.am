const { randomBytes, scryptSync } = require("node:crypto");

const { PrismaClient, StaffRole } = require("@prisma/client");

const prisma = new PrismaClient();

const developmentCredentials = {
  admin: {
    email: process.env.SEED_ADMIN_EMAIL || "admin@smartfit.local",
    password: process.env.SEED_ADMIN_PASSWORD || "Admin123!",
    username: process.env.SEED_ADMIN_USERNAME || "admin",
  },
  registration: {
    email:
      process.env.SEED_REGISTRATION_EMAIL || "registration@smartfit.local",
    password: process.env.SEED_REGISTRATION_PASSWORD || "Registration123!",
    username: process.env.SEED_REGISTRATION_USERNAME || "registration",
  },
};

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

async function seedStaffUser({
  credentials,
  legacyUsername,
  name,
  role,
}) {
  const existingUser = await prisma.staffUser.findFirst({
    where: {
      OR: [
        { username: credentials.username },
        { email: credentials.email },
        { username: legacyUsername },
      ],
    },
  });
  const data = {
    email: credentials.email,
    isActive: true,
    name,
    passwordHash: hashPassword(credentials.password),
    role,
    username: credentials.username,
  };

  if (existingUser) {
    return prisma.staffUser.update({
      where: { id: existingUser.id },
      data,
    });
  }

  return prisma.staffUser.create({ data });
}

async function main() {
  await seedStaffUser({
    credentials: developmentCredentials.admin,
    legacyUsername: "dev-admin",
    name: "Development Admin",
    role: StaffRole.ADMIN,
  });

  await seedStaffUser({
    credentials: developmentCredentials.registration,
    legacyUsername: "dev-registration",
    name: "Development Registration",
    role: StaffRole.REGISTRATION,
  });

  await prisma.gymSettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      gymName: "Smartfit.am",
      occupancyGreenMax: 20,
      occupancyYellowMax: 40,
      showPhoneInPublicApp: true,
      showWhatsappInPublicApp: true,
      showInstagramInPublicApp: true,
      showLocationInPublicApp: true,
      showMotivationalTextInPublicApp: true,
      motivationalText: "Train well. Feel strong.",
      hideInactiveCustomersFromRegistration: false,
    },
  });

  await prisma.occupancyState.upsert({
    where: { id: "current" },
    update: { currentCount: 0 },
    create: {
      id: "current",
      currentCount: 0,
    },
  });

  console.log("Development seed complete.");
  console.log(
    `Admin login: ${developmentCredentials.admin.username} / ${developmentCredentials.admin.email}`,
  );
  console.log(
    `Registration login: ${developmentCredentials.registration.username} / ${developmentCredentials.registration.email}`,
  );
  console.log("Passwords come from .env or the documented local defaults.");
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
