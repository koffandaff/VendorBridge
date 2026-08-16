import { Prisma, type VendorStatus } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import type {
  CreateVendorCategoryInput,
  UpdateVendorCategoryInput,
  CreateVendorInput,
  UpdateVendorInput,
  VendorQueryFilters,
  CreateVendorContactInput,
  UpdateVendorContactInput,
} from "./vendor.types.js";

export class VendorRepository {
  // -------------------------------------------------------------------------
  // Vendor Category Methods
  // -------------------------------------------------------------------------
  async createCategory(data: CreateVendorCategoryInput) {
    return prisma.vendorCategory.create({
      data: {
        name: data.name,
        description: data.description ?? null,
      },
    });
  }

  async findCategoryById(id: string) {
    return prisma.vendorCategory.findUnique({
      where: { id },
    });
  }

  async findCategoryByName(name: string) {
    return prisma.vendorCategory.findUnique({
      where: { name },
    });
  }

  async listCategories() {
    return prisma.vendorCategory.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: { vendors: true },
        },
      },
    });
  }

  async updateCategory(id: string, data: UpdateVendorCategoryInput) {
    return prisma.vendorCategory.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });
  }

  async deleteCategory(id: string) {
    return prisma.vendorCategory.delete({
      where: { id },
    });
  }

  async countVendorsByCategoryId(categoryId: string): Promise<number> {
    return prisma.vendor.count({
      where: { categoryId },
    });
  }

  // -------------------------------------------------------------------------
  // Vendor Methods
  // -------------------------------------------------------------------------
  async createVendor(data: CreateVendorInput & { code: string }) {
    return prisma.vendor.create({
      data: {
        name: data.name,
        code: data.code,
        categoryId: data.categoryId,
        email: data.email,
        phone: data.phone,
        gstNumber: data.gstNumber || null,
        panNumber: data.panNumber || null,
        address: data.address || null,
        city: data.city || null,
        state: data.state || null,
        postalCode: data.postalCode || null,
        country: data.country,
        status: data.status ?? "PENDING",
        rating: data.rating !== undefined && data.rating !== null ? new Prisma.Decimal(data.rating) : null,
        notes: data.notes || null,
      },
      include: {
        category: true,
        contacts: {
          orderBy: { isPrimary: "desc" },
        },
      },
    });
  }

  async findVendorById(id: string) {
    return prisma.vendor.findUnique({
      where: { id },
      include: {
        category: true,
        contacts: {
          orderBy: { isPrimary: "desc" },
        },
        _count: {
          select: {
            rfqVendors: true,
            quotations: true,
            purchaseOrders: true,
            invoices: true,
          },
        },
      },
    });
  }

  async findVendorByCode(code: string) {
    return prisma.vendor.findUnique({
      where: { code },
    });
  }

  async findVendorByGst(gstNumber: string) {
    return prisma.vendor.findFirst({
      where: { gstNumber },
    });
  }

  async findLatestVendorCodePrefix(prefix: string) {
    return prisma.vendor.findFirst({
      where: {
        code: {
          startsWith: prefix,
        },
      },
      orderBy: {
        code: "desc",
      },
      select: { code: true },
    });
  }

  async listVendors(filters: VendorQueryFilters) {
    const {
      search,
      categoryId,
      status,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = filters;

    const where: Prisma.VendorWhereInput = {};

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { gstNumber: { contains: search, mode: "insensitive" } },
      ];
    }

    const skip = (page - 1) * limit;

    const [items, totalItems] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          category: {
            select: { id: true, name: true },
          },
          contacts: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      }),
      prisma.vendor.count({ where }),
    ]);

    return { items, totalItems };
  }

  async updateVendor(id: string, data: UpdateVendorInput) {
    return prisma.vendor.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.gstNumber !== undefined && { gstNumber: data.gstNumber || null }),
        ...(data.panNumber !== undefined && { panNumber: data.panNumber || null }),
        ...(data.address !== undefined && { address: data.address || null }),
        ...(data.city !== undefined && { city: data.city || null }),
        ...(data.state !== undefined && { state: data.state || null }),
        ...(data.postalCode !== undefined && { postalCode: data.postalCode || null }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.notes !== undefined && { notes: data.notes || null }),
      },
      include: {
        category: true,
        contacts: {
          orderBy: { isPrimary: "desc" },
        },
      },
    });
  }

  async updateVendorStatus(id: string, status: VendorStatus) {
    return prisma.vendor.update({
      where: { id },
      data: { status },
      include: {
        category: true,
      },
    });
  }

  async updateVendorRating(id: string, rating: number) {
    return prisma.vendor.update({
      where: { id },
      data: {
        rating: new Prisma.Decimal(rating),
      },
      include: {
        category: true,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Vendor Contact Methods
  // -------------------------------------------------------------------------
  async createContact(vendorId: string, data: CreateVendorContactInput) {
    if (data.isPrimary) {
      await this.resetPrimaryContact(vendorId);
    }

    return prisma.vendorContact.create({
      data: {
        vendorId,
        name: data.name,
        email: data.email,
        phone: data.phone,
        designation: data.designation || null,
        isPrimary: data.isPrimary ?? false,
      },
    });
  }

  async listContactsByVendorId(vendorId: string) {
    return prisma.vendorContact.findMany({
      where: { vendorId },
      orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }],
    });
  }

  async findContactById(contactId: string) {
    return prisma.vendorContact.findUnique({
      where: { id: contactId },
    });
  }

  async updateContact(
    vendorId: string,
    contactId: string,
    data: UpdateVendorContactInput
  ) {
    if (data.isPrimary) {
      await this.resetPrimaryContact(vendorId);
    }

    return prisma.vendorContact.update({
      where: { id: contactId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.designation !== undefined && { designation: data.designation || null }),
        ...(data.isPrimary !== undefined && { isPrimary: data.isPrimary }),
      },
    });
  }

  async deleteContact(contactId: string) {
    return prisma.vendorContact.delete({
      where: { id: contactId },
    });
  }

  async resetPrimaryContact(vendorId: string) {
    return prisma.vendorContact.updateMany({
      where: { vendorId, isPrimary: true },
      data: { isPrimary: false },
    });
  }
}
