import { Router } from "express";
import { VendorController } from "./vendor.controller.js";
import { authenticate } from "../../core/auth/guards.js";
import { requirePermission } from "../../core/rbac/guards.js";
import { validateRequest } from "../../core/middleware/validate.middleware.js";
import {
  createVendorCategorySchema,
  updateVendorCategorySchema,
  createVendorSchema,
  updateVendorSchema,
  updateVendorStatusSchema,
  updateVendorRatingSchema,
  vendorQuerySchema,
  createVendorContactSchema,
  updateVendorContactSchema,
  uuidParamSchema,
  vendorContactParamSchema,
} from "./vendor.schema.js";
import { z } from "zod";

export const vendorRouter: Router = Router();
const controller = new VendorController();

// -----------------------------------------------------------------------------
// Vendor Category Routes (Requires authenticate & vendors:manage / procurement:view)
// -----------------------------------------------------------------------------
vendorRouter.post(
  "/categories",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ body: createVendorCategorySchema }),
  controller.createCategory
);

vendorRouter.get(
  "/categories",
  authenticate,
  requirePermission("vendors:manage", "procurement:view"),
  controller.listCategories
);

vendorRouter.get(
  "/categories/:id",
  authenticate,
  requirePermission("vendors:manage", "procurement:view"),
  validateRequest({ params: uuidParamSchema }),
  controller.getCategoryById
);

vendorRouter.put(
  "/categories/:id",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ params: uuidParamSchema, body: updateVendorCategorySchema }),
  controller.updateCategory
);

vendorRouter.delete(
  "/categories/:id",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ params: uuidParamSchema }),
  controller.deleteCategory
);

// -----------------------------------------------------------------------------
// Vendor Contact Routes
// -----------------------------------------------------------------------------
vendorRouter.post(
  "/:vendorId/contacts",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({
    params: z.object({ vendorId: z.string().uuid("Invalid vendor ID format") }),
    body: createVendorContactSchema,
  }),
  controller.createContact
);

vendorRouter.get(
  "/:vendorId/contacts",
  authenticate,
  requirePermission("vendors:manage", "procurement:view"),
  validateRequest({
    params: z.object({ vendorId: z.string().uuid("Invalid vendor ID format") }),
  }),
  controller.listContacts
);

vendorRouter.put(
  "/:vendorId/contacts/:contactId",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({
    params: vendorContactParamSchema,
    body: updateVendorContactSchema,
  }),
  controller.updateContact
);

vendorRouter.delete(
  "/:vendorId/contacts/:contactId",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({
    params: vendorContactParamSchema,
  }),
  controller.deleteContact
);

// -----------------------------------------------------------------------------
// Vendor Core Routes
// -----------------------------------------------------------------------------
vendorRouter.post(
  "/",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ body: createVendorSchema }),
  controller.createVendor
);

vendorRouter.get(
  "/",
  authenticate,
  requirePermission("vendors:manage", "procurement:view"),
  validateRequest({ query: vendorQuerySchema }),
  controller.listVendors
);

vendorRouter.get(
  "/:id",
  authenticate,
  requirePermission("vendors:manage", "procurement:view"),
  validateRequest({ params: uuidParamSchema }),
  controller.getVendorById
);

vendorRouter.put(
  "/:id",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ params: uuidParamSchema, body: updateVendorSchema }),
  controller.updateVendor
);

vendorRouter.patch(
  "/:id/status",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ params: uuidParamSchema, body: updateVendorStatusSchema }),
  controller.updateVendorStatus
);

vendorRouter.patch(
  "/:id/rating",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ params: uuidParamSchema, body: updateVendorRatingSchema }),
  controller.updateVendorRating
);

vendorRouter.delete(
  "/:id",
  authenticate,
  requirePermission("vendors:manage"),
  validateRequest({ params: uuidParamSchema }),
  controller.softDeleteVendor
);
