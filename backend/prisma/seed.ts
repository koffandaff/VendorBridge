import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Development seed data. The demo credentials below are DEMO credentials -
// change them in any non-development environment.
async function main() {
  // ---------------------------------------------------------------------------
  // Users
  // ---------------------------------------------------------------------------
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

  const officer = await prisma.user.upsert({
    where: { email: "procurement.officer@gmail.com" },
    update: { emailVerified: true },
    create: {
      email: "procurement.officer@gmail.com",
      passwordHash: await bcrypt.hash("Procure@123", 12),
      name: "Procurement Officer",
      role: "PROCUREMENT_OFFICER",
      emailVerified: true,
    },
  });
  console.log(`[seed] officer user ready: ${officer.email}`);

  const approver = await prisma.user.upsert({
    where: { email: "approver@gmail.com" },
    update: { emailVerified: true },
    create: {
      email: "approver@gmail.com",
      passwordHash: await bcrypt.hash("Approve@123", 12),
      name: "Approver",
      role: "APPROVER",
      emailVerified: true,
    },
  });
  console.log(`[seed] approver user ready: ${approver.email}`);

  const vendorUser = await prisma.user.upsert({
    where: { email: "vendor.user@gmail.com" },
    update: { emailVerified: true },
    create: {
      email: "vendor.user@gmail.com",
      passwordHash: await bcrypt.hash("Vendor@123", 12),
      name: "Vendor User",
      role: "VENDOR",
      emailVerified: true,
    },
  });
  console.log(`[seed] vendor user ready: ${vendorUser.email}`);

  // ---------------------------------------------------------------------------
  // Categories
  // ---------------------------------------------------------------------------
  const categories = await Promise.all(
    [
      { name: "IT & Software", description: "Information technology products and software services" },
      { name: "Office Supplies", description: "Stationery, paper, and general office consumables" },
      { name: "Professional Services", description: "Consulting, staffing, and advisory services" },
    ].map((category) =>
      prisma.vendorCategory.upsert({
        where: { name: category.name },
        update: {},
        create: category,
      })
    )
  );
  const itCategory = categories[0];
  const officeCategory = categories[1];
  const servicesCategory = categories[2];
  console.log("[seed] vendor categories ready");

  // ---------------------------------------------------------------------------
  // Vendors
  // ---------------------------------------------------------------------------
  const acmeVendor = await prisma.vendor.upsert({
    where: { code: "ACME-IT-001" },
    update: {},
    create: {
      name: "Acme IT Solutions",
      code: "ACME-IT-001",
      categoryId: itCategory.id,
      email: "contact@acme-it.example",
      phone: "+91 90000 00001",
      country: "India",
      status: "ACTIVE",
      rating: 4.5,
    },
  });
  console.log(`[seed] vendor ready: ${acmeVendor.code}`);

  const sigmaVendor = await prisma.vendor.upsert({
    where: { code: "SIGMA-OFF-001" },
    update: {},
    create: {
      name: "Sigma Office Supplies",
      code: "SIGMA-OFF-001",
      categoryId: officeCategory.id,
      email: "sales@sigma-office.example",
      phone: "+91 90000 00002",
      country: "India",
      status: "ACTIVE",
      rating: 4.0,
    },
  });
  console.log(`[seed] vendor ready: ${sigmaVendor.code}`);

  const nexusVendor = await prisma.vendor.upsert({
    where: { code: "NEXUS-CON-001" },
    update: {},
    create: {
      name: "Nexus Consulting Group",
      code: "NEXUS-CON-001",
      categoryId: servicesCategory.id,
      email: "hello@nexus-consulting.example",
      phone: "+91 90000 00003",
      country: "India",
      status: "ACTIVE",
      rating: 3.5,
    },
  });
  console.log(`[seed] vendor ready: ${nexusVendor.code}`);

  // Link demo vendor user to the vendor account
  if (vendorUser.vendorId !== acmeVendor.id) {
    await prisma.user.update({
      where: { id: vendorUser.id },
      data: { vendorId: acmeVendor.id },
    });
  }

  // ---------------------------------------------------------------------------
  // Vendor contacts
  // ---------------------------------------------------------------------------
  const vendorsWithContacts = [
    { vendor: acmeVendor, contact: { name: "Priya Sharma", email: "priya@acme-it.example", phone: "+91 90000 00011", designation: "Sales Lead", isPrimary: true } },
    { vendor: sigmaVendor, contact: { name: "Rahul Mehta", email: "rahul@sigma-office.example", phone: "+91 90000 00012", designation: "Account Manager", isPrimary: true } },
    { vendor: nexusVendor, contact: { name: "Ananya Iyer", email: "ananya@nexus-consulting.example", phone: "+91 90000 00013", designation: "Partnership Manager", isPrimary: true } },
  ];
  for (const entry of vendorsWithContacts) {
    const existing = await prisma.vendorContact.findFirst({
      where: { vendorId: entry.vendor.id, isPrimary: true },
    });
    if (!existing) {
      await prisma.vendorContact.create({
        data: { vendorId: entry.vendor.id, ...entry.contact },
      });
    }
  }
  console.log("[seed] vendor contacts ready");

  // ---------------------------------------------------------------------------
  // Teardown of previously seeded procurement data (FK-safe order)
  // ---------------------------------------------------------------------------
  const seededInvoices = await prisma.invoice.findMany({
    where: { invoiceNumber: { in: ["INV-2026-0001"] } },
    select: { id: true },
  });
  const seededInvoiceIds = seededInvoices.map((item) => item.id);
  if (seededInvoiceIds.length > 0) {
    await prisma.invoiceItem.deleteMany({ where: { invoiceId: { in: seededInvoiceIds } } });
  }
  await prisma.invoice.deleteMany({ where: { invoiceNumber: { in: ["INV-2026-0001"] } } });

  const seededPos = await prisma.purchaseOrder.findMany({
    where: { poNumber: { in: ["PO-2026-0001"] } },
    select: { id: true },
  });
  const seededPoIds = seededPos.map((item) => item.id);
  if (seededPoIds.length > 0) {
    await prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: { in: seededPoIds } },
    });
  }
  await prisma.purchaseOrder.deleteMany({ where: { poNumber: { in: ["PO-2026-0001"] } } });

  const seededQuotations = await prisma.quotation.findMany({
    where: { quotationNumber: { in: ["QTN-2026-0001", "QTN-2026-0002"] } },
    select: { id: true },
  });
  const seededQuotationIds = seededQuotations.map((item) => item.id);
  if (seededQuotationIds.length > 0) {
    await prisma.quotationItem.deleteMany({
      where: { quotationId: { in: seededQuotationIds } },
    });
    await prisma.approval.deleteMany({
      where: { quotationId: { in: seededQuotationIds } },
    });
  }
  await prisma.quotation.deleteMany({
    where: { quotationNumber: { in: ["QTN-2026-0001", "QTN-2026-0002"] } },
  });

  const seededRfqs = await prisma.rFQ.findMany({
    where: { rfqNumber: { in: ["RFQ-2026-0001", "RFQ-2026-0002"] } },
    select: { id: true },
  });
  const seededRfqIds = seededRfqs.map((item) => item.id);
  if (seededRfqIds.length > 0) {
    await prisma.rFQVendor.deleteMany({ where: { rfqId: { in: seededRfqIds } } });
    await prisma.rFQItem.deleteMany({ where: { rfqId: { in: seededRfqIds } } });
  }
  await prisma.rFQ.deleteMany({ where: { rfqNumber: { in: ["RFQ-2026-0001", "RFQ-2026-0002"] } } });

  // Seed-managed notifications and audit logs
  await prisma.notification.deleteMany({
    where: {
      userId: { in: [approver.id, officer.id, admin.id] },
      OR: [
        { entityId: { in: [...seededQuotationIds] } },
        { entityId: null },
      ],
    },
  });
  await prisma.auditLog.deleteMany({
    where: { entityId: { in: [...seededRfqIds, ...seededQuotationIds, ...seededPoIds] } },
  });

  // ---------------------------------------------------------------------------
  // RFQs
  // ---------------------------------------------------------------------------
  const now = new Date();

  const rfqLaptops = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2026-0001",
      title: "Workstation hardware refresh",
      description: "Procurement of laptops, monitors, and docking stations for the engineering teams.",
      status: "AWAITING_APPROVAL",
      deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
      createdById: officer.id,
    },
  });
  const rfqLaptopsItems = [
    {
      rfqId: rfqLaptops.id,
      name: "Laptop",
      description: "14-inch developer laptop, 32GB RAM, 1TB SSD",
      itemType: "PRODUCT" as const,
      quantity: 20,
      unit: "unit",
      estimatedUnitPrice: 85000,
    },
    {
      rfqId: rfqLaptops.id,
      name: "Monitor",
      description: "27-inch 4K monitor",
      itemType: "PRODUCT" as const,
      quantity: 40,
      unit: "unit",
      estimatedUnitPrice: 12000,
    },
    {
      rfqId: rfqLaptops.id,
      name: "Docking station",
      description: "USB-C docking station with dual display output",
      itemType: "PRODUCT" as const,
      quantity: 20,
      unit: "unit",
      estimatedUnitPrice: 4500,
    },
  ];
  await prisma.rFQItem.createMany({ data: rfqLaptopsItems });
  console.log(`[seed] RFQ ready: ${rfqLaptops.rfqNumber} (+${rfqLaptopsItems.length} items)`);

  for (const vendor of [acmeVendor, sigmaVendor, nexusVendor]) {
    await prisma.rFQVendor.create({
      data: { rfqId: rfqLaptops.id, vendorId: vendor.id, status: "INVITED" },
    });
  }
  console.log(`[seed] RFQ vendors invited: ${rfqLaptops.rfqNumber}`);

  const rfqOffice = await prisma.rFQ.create({
    data: {
      rfqNumber: "RFQ-2026-0002",
      title: "Office consumables restock",
      description: "A4 paper, toner cartridges, and general office stationery.",
      status: "OPEN",
      deadline: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000),
      createdById: officer.id,
    },
  });
  const rfqOfficeItems = [
    {
      rfqId: rfqOffice.id,
      name: "A4 paper",
      description: "80 gsm A4 multipurpose paper, ream of 500 sheets",
      itemType: "PRODUCT" as const,
      quantity: 100,
      unit: "ream",
      estimatedUnitPrice: 350,
    },
    {
      rfqId: rfqOffice.id,
      name: "Toner cartridge",
      description: "Compatible laser toner, black, high yield",
      itemType: "PRODUCT" as const,
      quantity: 25,
      unit: "unit",
      estimatedUnitPrice: 1500,
    },
  ];
  await prisma.rFQItem.createMany({ data: rfqOfficeItems });
  for (const vendor of [sigmaVendor, nexusVendor]) {
    await prisma.rFQVendor.create({
      data: { rfqId: rfqOffice.id, vendorId: vendor.id, status: "INVITED" },
    });
  }
  console.log(`[seed] RFQ ready: ${rfqOffice.rfqNumber} (+${rfqOfficeItems.length} items)`);

  // ---------------------------------------------------------------------------
  // Quotations (RFQ-2026-0001)
  // ---------------------------------------------------------------------------
  const taxRate = 18;

  const acmeQuote = await prisma.quotation.create({
    data: {
      quotationNumber: "QTN-2026-0001",
      rfqId: rfqLaptops.id,
      vendorId: acmeVendor.id,
      status: "UNDER_REVIEW",
      subtotal: 85000 * 20 + 12000 * 40 + 4500 * 20,
      taxAmount: (85000 * 20 + 12000 * 40 + 4500 * 20) * (taxRate / 100),
      totalAmount: 85000 * 20 + 12000 * 40 + 4500 * 20 + (85000 * 20 + 12000 * 40 + 4500 * 20) * (taxRate / 100),
      deliveryDays: 15,
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      notes: "Includes onsite setup and 1-year warranty.",
      submittedAt: now,
    },
  });

  const sigmaQuote = await prisma.quotation.create({
    data: {
      quotationNumber: "QTN-2026-0002",
      rfqId: rfqLaptops.id,
      vendorId: sigmaVendor.id,
      status: "SELECTED",
      subtotal: 83000 * 20 + 11800 * 40 + 4600 * 20,
      taxAmount: (83000 * 20 + 11800 * 40 + 4600 * 20) * (taxRate / 100),
      totalAmount: 83000 * 20 + 11800 * 40 + 4600 * 20 + (83000 * 20 + 11800 * 40 + 4600 * 20) * (taxRate / 100),
      deliveryDays: 12,
      validUntil: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      notes: "Volume pricing, free shipping, 2-year warranty.",
      submittedAt: now,
    },
  });
  console.log(`[seed] quotations ready: ${acmeQuote.quotationNumber}, ${sigmaQuote.quotationNumber}`);

  // Quotation items
  const rfq1Items = await prisma.rFQItem.findMany({
    where: { rfqId: rfqLaptops.id },
    orderBy: { createdAt: "asc" },
  });
  const quoteItemsFor = async (quoteId: string, rates: number[]) => {
    const items = rfq1Items.map((rfqItem, index) => {
      const quantity = Number(rfqItem.quantity);
      const unitPrice = rates[index] ?? Number(rfqItem.estimatedUnitPrice ?? 0);
      const taxAmount = (quantity * unitPrice * taxRate) / 100;
      const totalAmount = quantity * unitPrice + taxAmount;
      return {
        quotationId: quoteId,
        rfqItemId: rfqItem.id,
        description: rfqItem.name,
        quantity,
        unitPrice,
        taxRate,
        taxAmount,
        totalAmount,
        notes: rfqItem.description,
      };
    });
    await prisma.quotationItem.createMany({ data: items });
  };
  await quoteItemsFor(acmeQuote.id, [85000, 12000, 4500]);
  await quoteItemsFor(sigmaQuote.id, [83000, 11800, 4600]);
  console.log("[seed] quotation items ready");

  // ---------------------------------------------------------------------------
  // Approvals
  // ---------------------------------------------------------------------------
  const pendingApproval = await prisma.approval.create({
    data: {
      quotationId: acmeQuote.id,
      approverId: approver.id,
      status: "PENDING",
      remarks: "Quotation under review - awaiting budget approval.",
      step: 1,
    },
  });

  const approvedApproval = await prisma.approval.create({
    data: {
      quotationId: sigmaQuote.id,
      approverId: approver.id,
      status: "APPROVED",
      remarks: "Approved - best pricing and delivery terms.",
      step: 1,
      requestedAt: now,
      decidedAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
    },
  });
  console.log(
    `[seed] approvals ready (pending: ${pendingApproval.status}, ${approvedApproval.status})`
  );

  // ---------------------------------------------------------------------------
  // Purchase order (from approved quotation) + invoice
  // ---------------------------------------------------------------------------
  const po = await prisma.purchaseOrder.create({
    data: {
      poNumber: "PO-2026-0001",
      quotationId: sigmaQuote.id,
      vendorId: sigmaVendor.id,
      createdById: officer.id,
      status: "APPROVED",
      orderDate: now,
      expectedDeliveryDate: new Date(now.getTime() + 12 * 24 * 60 * 60 * 1000),
      subtotal: sigmaQuote.subtotal,
      taxAmount: sigmaQuote.taxAmount,
      totalAmount: sigmaQuote.totalAmount,
      notes: sigmaQuote.notes,
    },
  });

  const sigmaQuoteItems = await prisma.quotationItem.findMany({
    where: { quotationId: sigmaQuote.id },
    orderBy: { createdAt: "asc" },
  });
  await prisma.purchaseOrderItem.createMany({
    data: sigmaQuoteItems.map((quoteItem) => ({
      purchaseOrderId: po.id,
      quotationItemId: quoteItem.id,
      description: quoteItem.description,
      quantity: quoteItem.quantity,
      unit: "unit",
      unitPrice: quoteItem.unitPrice,
      taxRate: quoteItem.taxRate,
      taxAmount: quoteItem.taxAmount,
      totalAmount: quoteItem.totalAmount,
    })),
  });
  console.log(`[seed] purchase order ready: ${po.poNumber}`);

  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-2026-0001",
      purchaseOrderId: po.id,
      vendorId: sigmaVendor.id,
      status: "SENT",
      invoiceDate: now,
      dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
      subtotal: po.subtotal,
      taxAmount: po.taxAmount,
      totalAmount: po.totalAmount,
      notes: "Please remit payment within 30 days.",
      sentAt: now,
    },
  });

  const poItems = await prisma.purchaseOrderItem.findMany({
    where: { purchaseOrderId: po.id },
    orderBy: { createdAt: "asc" },
  });
  await prisma.invoiceItem.createMany({
    data: poItems.map((poItem) => ({
      invoiceId: invoice.id,
      purchaseOrderItemId: poItem.id,
      description: poItem.description,
      quantity: poItem.quantity,
      unit: poItem.unit,
      unitPrice: poItem.unitPrice,
      taxRate: poItem.taxRate,
      taxAmount: poItem.taxAmount,
      totalAmount: poItem.totalAmount,
    })),
  });
  console.log(`[seed] invoice ready: ${invoice.invoiceNumber}`);

  // ---------------------------------------------------------------------------
  // Notifications
  // ---------------------------------------------------------------------------
  await prisma.notification.createMany({
    data: [
      {
        userId: approver.id,
        type: "APPROVAL_REQUIRED",
        title: "Quotation pending approval",
        message: `${acmeQuote.quotationNumber} for ${rfqLaptops.title} is awaiting your approval.`,
        entityType: "Quotation",
        entityId: acmeQuote.id,
      },
      {
        userId: officer.id,
        type: "APPROVAL_APPROVED",
        title: "Quotation approved",
        message: `${sigmaQuote.quotationNumber} was approved. You can now generate a purchase order.`,
        entityType: "Quotation",
        entityId: sigmaQuote.id,
      },
      {
        userId: admin.id,
        type: "SYSTEM",
        title: "Welcome to VendorBridge",
        message: "The system is running and seeded with demo data. Explore the dashboard and reports.",
      },
    ],
  });
  console.log("[seed] notifications ready");

  // ---------------------------------------------------------------------------
  // Audit logs
  // ---------------------------------------------------------------------------
  await prisma.auditLog.createMany({
    data: [
      {
        userId: officer.id,
        action: "RFQ.CREATED",
        entityType: "RFQ",
        entityId: rfqLaptops.id,
        metadata: { rfqNumber: rfqLaptops.rfqNumber },
      },
      {
        userId: approver.id,
        action: "APPROVAL.APPROVED",
        entityType: "Approval",
        entityId: approvedApproval.id,
        metadata: { quotationNumber: sigmaQuote.quotationNumber },
      },
      {
        userId: officer.id,
        action: "PURCHASE_ORDER.GENERATED",
        entityType: "PurchaseOrder",
        entityId: po.id,
        metadata: { poNumber: po.poNumber },
      },
      {
        userId: admin.id,
        action: "USER.SEEDED",
        entityType: "User",
        entityId: admin.id,
        metadata: { message: "Seed data created" },
      },
    ],
  });
  console.log("[seed] audit logs ready");

  console.log("[seed] done");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });