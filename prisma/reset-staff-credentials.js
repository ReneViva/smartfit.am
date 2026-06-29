const { randomBytes, scryptSync } = require("node:crypto");

const { PrismaClient, StaffRole } = require("@prisma/client");

const prisma = new PrismaClient();

const staffAccounts = [
  {
    emailEnv: "SEED_ADMIN_EMAIL",
    label: "ADMIN",
    passwordEnv: "SEED_ADMIN_PASSWORD",
    role: StaffRole.ADMIN,
    usernameEnv: "SEED_ADMIN_USERNAME",
  },
  {
    emailEnv: "SEED_REGISTRATION_EMAIL",
    label: "REGISTRATION",
    passwordEnv: "SEED_REGISTRATION_PASSWORD",
    role: StaffRole.REGISTRATION,
    usernameEnv: "SEED_REGISTRATION_USERNAME",
  },
];

function requiredText(name) {
  const value = process.env[name];

  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${name} is required to reset staff credentials.`);
  }

  return value.trim();
}

function requiredPassword(name) {
  const value = process.env[name];

  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${name} is required to reset staff credentials.`);
  }

  return value;
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");

  return `scrypt$${salt}$${hash}`;
}

async function resetStaffAccount(account) {
  const username = requiredText(account.usernameEnv);
  const email = requiredText(account.emailEnv);
  const password = requiredPassword(account.passwordEnv);
  const users = await prisma.staffUser.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true },
    where: { role: account.role },
  });

  if (users.length !== 1) {
    throw new Error(
      `Expected exactly one ${account.label} StaffUser, found ${users.length}. Resolve staff-user duplicates or provision the missing account before resetting credentials.`,
    );
  }

  await prisma.staffUser.update({
    data: {
      email,
      isActive: true,
      passwordHash: hashPassword(password),
      username,
    },
    where: { id: users[0].id },
  });

  console.log(`${account.label} staff credentials updated from environment.`);
}

async function main() {
  for (const account of staffAccounts) {
    await resetStaffAccount(account);
  }

  console.log("Staff credential reset complete.");
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
