import { VendorRepository } from "./vendor.repository.js";
import {
  NotFoundError,
  ConflictError,
} from "../../core/errors/AppError.js";
import type {
  CreateVendorCategoryInput,
  UpdateVendorCategoryInput,
  CreateVendorInput,
  UpdateVendorInput,
  UpdateVendorStatusInput,
  UpdateVendorRatingInput,
  VendorQueryFilters,
  CreateVendorContactInput,
  UpdateVendorContactInput,
} from "./vendor.types.js";
import type { PaginationMeta } from "../../core/http/response.js";

export class VendorService {
  constructor(private readonly repository: VendorRepository = new VendorRepository()) {}

  // -------------------------------------------------------------------------
  // Vendor Category Services
  // -------------------------------------------------------------------------
  async createCategory(input: CreateVendorCategoryInput) {
    const existing = await this.repository.findCategoryByName(input.name);
    if (existing) {
      throw new ConflictError(`Vendor category with name '${input.name}' already exists`);
    }

    return this.repository.createCategory(input);
  }

  async getCategoryById(id: string) {
    const category = await this.repository.findCategoryById(id);
    if (!category) {
      throw new NotFoundError("Vendor category not found");
    }
    return category;
  }

  async listCategories() {
    return this.repository.listCategories();
  }

  async updateCategory(id: string, input: UpdateVendorCategoryInput) {
    await this.getCategoryById(id);

    if (input.name) {
      const existing = await this.repository.findCategoryByName(input.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Vendor category with name '${input.name}' already exists`);
      }
    }

    return this.repository.updateCategory(id, input);
  }

  async deleteCategory(id: string) {
    await this.getCategoryById(id);

    const vendorCount = await this.repository.countVendorsByCategoryId(id);
    if (vendorCount > 0) {
      throw new ConflictError(
        `Cannot delete vendor category because it is associated with ${vendorCount} vendor(s)`
      );
    }

    return this.repository.deleteCategory(id);
  }

  // -------------------------------------------------------------------------
  // Vendor Services
  // -------------------------------------------------------------------------
  async createVendor(input: CreateVendorInput) {
    // 1. Verify category exists
    await this.getCategoryById(input.categoryId);

    // 2. Process / auto-generate vendor code
    let finalCode = input.code?.trim();
    if (!finalCode) {
      finalCode = await this.generateVendorCode();
    } else {
      const existingCode = await this.repository.findVendorByCode(finalCode);
      if (existingCode) {
        throw new ConflictError(`Vendor code '${finalCode}' is already taken`);
      }
    }

    // 3. Optional GST uniqueness check if provided
    if (input.gstNumber) {
      const existingGst = await this.repository.findVendorByGst(input.gstNumber);
      if (existingGst) {
        throw new ConflictError(`Vendor with GST number '${input.gstNumber}' already exists`);
      }
    }

    return this.repository.createVendor({
      ...input,
      code: finalCode,
    });
  }

  async getVendorById(id: string) {
    const vendor = await this.repository.findVendorById(id);
    if (!vendor) {
      throw new NotFoundError("Vendor not found");
    }
    return vendor;
  }

  async listVendors(filters: VendorQueryFilters) {
    const { items, totalItems } = await this.repository.listVendors(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const pagination: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
    };

    return { items, pagination };
  }

  async updateVendor(id: string, input: UpdateVendorInput) {
    await this.getVendorById(id);

    if (input.categoryId) {
      await this.getCategoryById(input.categoryId);
    }

    if (input.gstNumber) {
      const existingGst = await this.repository.findVendorByGst(input.gstNumber);
      if (existingGst && existingGst.id !== id) {
        throw new ConflictError(`Vendor with GST number '${input.gstNumber}' already exists`);
      }
    }

    return this.repository.updateVendor(id, input);
  }

  async updateVendorStatus(id: string, input: UpdateVendorStatusInput) {
    await this.getVendorById(id);
    return this.repository.updateVendorStatus(id, input.status);
  }

  async updateVendorRating(id: string, input: UpdateVendorRatingInput) {
    await this.getVendorById(id);
    return this.repository.updateVendorRating(id, input.rating);
  }

  /**
   * Soft deletion according to docs/Schema.md §38 (Delete Rules).
   * Vendor records are preserved with status set to INACTIVE.
   */
  async softDeleteVendor(id: string) {
    await this.getVendorById(id);
    return this.repository.updateVendorStatus(id, "INACTIVE");
  }

  // -------------------------------------------------------------------------
  // Vendor Contact Services
  // -------------------------------------------------------------------------
  async createContact(vendorId: string, input: CreateVendorContactInput) {
    await this.getVendorById(vendorId);
    return this.repository.createContact(vendorId, input);
  }

  async listContacts(vendorId: string) {
    await this.getVendorById(vendorId);
    return this.repository.listContactsByVendorId(vendorId);
  }

  async updateContact(
    vendorId: string,
    contactId: string,
    input: UpdateVendorContactInput
  ) {
    await this.getVendorById(vendorId);
    
    const contact = await this.repository.findContactById(contactId);
    if (!contact || contact.vendorId !== vendorId) {
      throw new NotFoundError("Vendor contact not found");
    }

    return this.repository.updateContact(vendorId, contactId, input);
  }

  async deleteContact(vendorId: string, contactId: string) {
    await this.getVendorById(vendorId);

    const contact = await this.repository.findContactById(contactId);
    if (!contact || contact.vendorId !== vendorId) {
      throw new NotFoundError("Vendor contact not found");
    }

    return this.repository.deleteContact(contactId);
  }

  // -------------------------------------------------------------------------
  // Private Helpers
  // -------------------------------------------------------------------------
  private async generateVendorCode(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `VND-${currentYear}-`;

    const latestVendor = await this.repository.findLatestVendorCodePrefix(prefix);

    if (!latestVendor) {
      return `${prefix}0001`;
    }

    const lastSequenceStr = latestVendor.code.substring(prefix.length);
    const lastSequenceNum = parseInt(lastSequenceStr, 10);

    if (isNaN(lastSequenceNum)) {
      return `${prefix}0001`;
    }

    const nextSequenceNum = lastSequenceNum + 1;
    return `${prefix}${nextSequenceNum.toString().padStart(4, "0")}`;
  }
}
