import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Development seed data. The demo credentials below are DEMO credentials -
// change them in any non-development environment.
async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@gmail.com" },
    update: { emailVerified: true },
    create: {
      email: "admin@gmail.com",
      passwordHash: await bcrypt.hash("Admin@123", 12),
      name: "Administrator",
      role: "ADMIN",
      emailVerified: true,
    },
  });
  console.log(`[seed] admin user ready: ${admin.email}`);

  const category = await prisma.vendorCategory.upsert({
    where: { name: "IT & Software" },
    update: {},
    create: {
      name: "IT & Software",
      description: "Information technology products and software services",
    },
  });
  console.log(`[seed] vendor category ready: ${category.name}`);

  const vendor = await prisma.vendor.upsert({
    where: { code: "ACME-IT-001" },
    update: {},
    create: {
      name: "Acme IT Solutions",
      code: "ACME-IT-001",
      categoryId: category.id,
      email: "contact@acme-it.example",
      phone: "+91 90000 00001",
      country: "India",
      status: "ACTIVE",
      rating: 4.5,
    },
  });
  console.log(`[seed] vendor ready: ${vendor.code}`);

  const demoUsers = [
    {
      email: "procurement.officer@gmail.com",
      password: "Procure@123",
      name: "Procurement Officer",
      role: "PROCUREMENT_OFFICER" as const,
      vendorId: null as string | null,
    },
    {
      email: "approver@gmail.com",
      password: "Approve@123",
      name: "Approver",
      role: "APPROVER" as const,
      vendorId: null as string | null,
    },
    {
      email: "vendor.user@gmail.com",
      password: "Vendor@123",
      name: "Vendor User",
      role: "VENDOR" as const,
      vendorId: vendor.id,
    },
  ];

  for (const user of demoUsers) {
    const created = await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: {
        email: user.email,
        passwordHash: await bcrypt.hash(user.password, 12),
        name: user.name,
        role: user.role,
        vendorId: user.vendorId,
        emailVerified: true,
      },
    });
    console.log(`[seed] ${user.role} user ready: ${created.email}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });