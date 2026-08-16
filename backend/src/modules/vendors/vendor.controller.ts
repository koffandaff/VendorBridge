import type { Request, Response, NextFunction } from "express";
import { VendorService } from "./vendor.service.js";
import { sendSuccess, sendCreated, sendPaginated } from "../../core/http/response.js";
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

function getParam(req: Request, key: string): string {
  const param = req.params[key];
  if (Array.isArray(param)) {
    return param[0] ?? "";
  }
  return param ?? "";
}

export class VendorController {
  constructor(private readonly service: VendorService = new VendorService()) {}

  // Category Handlers
  createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.service.createCategory(req.body as CreateVendorCategoryInput);
      sendCreated(res, category, "Vendor category created successfully");
    } catch (error) {
      next(error);
    }
  };

  listCategories = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const categories = await this.service.listCategories();
      sendSuccess(res, categories, "Vendor categories retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.service.getCategoryById(getParam(req, "id"));
      sendSuccess(res, category, "Vendor category retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const category = await this.service.updateCategory(
        getParam(req, "id"),
        req.body as UpdateVendorCategoryInput
      );
      sendSuccess(res, category, "Vendor category updated successfully");
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteCategory(getParam(req, "id"));
      sendSuccess(res, null, "Vendor category deleted successfully");
    } catch (error) {
      next(error);
    }
  };

  // Vendor Handlers
  createVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.service.createVendor(req.body as CreateVendorInput);
      sendCreated(res, vendor, "Vendor created successfully");
    } catch (error) {
      next(error);
    }
  };

  listVendors = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters = req.query as unknown as VendorQueryFilters;
      const { items, pagination } = await this.service.listVendors(filters);
      sendPaginated(res, items, pagination, "Vendors retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  getVendorById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.service.getVendorById(getParam(req, "id"));
      sendSuccess(res, vendor, "Vendor details retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updateVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.service.updateVendor(
        getParam(req, "id"),
        req.body as UpdateVendorInput
      );
      sendSuccess(res, vendor, "Vendor updated successfully");
    } catch (error) {
      next(error);
    }
  };

  updateVendorStatus = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.service.updateVendorStatus(
        getParam(req, "id"),
        req.body as UpdateVendorStatusInput
      );
      sendSuccess(res, vendor, "Vendor status updated successfully");
    } catch (error) {
      next(error);
    }
  };

  updateVendorRating = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.service.updateVendorRating(
        getParam(req, "id"),
        req.body as UpdateVendorRatingInput
      );
      sendSuccess(res, vendor, "Vendor rating updated successfully");
    } catch (error) {
      next(error);
    }
  };

  softDeleteVendor = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const vendor = await this.service.softDeleteVendor(getParam(req, "id"));
      sendSuccess(res, vendor, "Vendor status set to INACTIVE (soft deleted)");
    } catch (error) {
      next(error);
    }
  };

  // Vendor Contact Handlers
  createContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contact = await this.service.createContact(
        getParam(req, "vendorId"),
        req.body as CreateVendorContactInput
      );
      sendCreated(res, contact, "Vendor contact added successfully");
    } catch (error) {
      next(error);
    }
  };

  listContacts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contacts = await this.service.listContacts(getParam(req, "vendorId"));
      sendSuccess(res, contacts, "Vendor contacts retrieved successfully");
    } catch (error) {
      next(error);
    }
  };

  updateContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contact = await this.service.updateContact(
        getParam(req, "vendorId"),
        getParam(req, "contactId"),
        req.body as UpdateVendorContactInput
      );
      sendSuccess(res, contact, "Vendor contact updated successfully");
    } catch (error) {
      next(error);
    }
  };

  deleteContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.service.deleteContact(getParam(req, "vendorId"), getParam(req, "contactId"));
      sendSuccess(res, null, "Vendor contact deleted successfully");
    } catch (error) {
      next(error);
    }
  };
}
