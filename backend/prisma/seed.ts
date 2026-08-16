import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Development seed data. The admin credential below is a DEMO credential -
// change it in any non-development environment.
async function main() {
  const email = "admin@gmail.com";
  const passwordHash = await bcrypt.hash("Admin@123", 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Administrator",
      role: "ADMIN",
    },
  });

  console.log(`[seed] admin user ready: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });