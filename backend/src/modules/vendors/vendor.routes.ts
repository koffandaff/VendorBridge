import { Router } from "express";
import { VendorController } from "./vendor.controller.js";
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
// Vendor Category Routes
// -----------------------------------------------------------------------------
vendorRouter.post(
  "/categories",
  validateRequest({ body: createVendorCategorySchema }),
  controller.createCategory
);

vendorRouter.get("/categories", controller.listCategories);

vendorRouter.get(
  "/categories/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.getCategoryById
);

vendorRouter.put(
  "/categories/:id",
  validateRequest({ params: uuidParamSchema, body: updateVendorCategorySchema }),
  controller.updateCategory
);

vendorRouter.delete(
  "/categories/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.deleteCategory
);

// -----------------------------------------------------------------------------
// Vendor Contact Routes
// -----------------------------------------------------------------------------
vendorRouter.post(
  "/:vendorId/contacts",
  validateRequest({
    params: z.object({ vendorId: z.string().uuid("Invalid vendor ID format") }),
    body: createVendorContactSchema,
  }),
  controller.createContact
);

vendorRouter.get(
  "/:vendorId/contacts",
  validateRequest({
    params: z.object({ vendorId: z.string().uuid("Invalid vendor ID format") }),
  }),
  controller.listContacts
);

vendorRouter.put(
  "/:vendorId/contacts/:contactId",
  validateRequest({
    params: vendorContactParamSchema,
    body: updateVendorContactSchema,
  }),
  controller.updateContact
);

vendorRouter.delete(
  "/:vendorId/contacts/:contactId",
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
  validateRequest({ body: createVendorSchema }),
  controller.createVendor
);

vendorRouter.get(
  "/",
  validateRequest({ query: vendorQuerySchema }),
  controller.listVendors
);

vendorRouter.get(
  "/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.getVendorById
);

vendorRouter.put(
  "/:id",
  validateRequest({ params: uuidParamSchema, body: updateVendorSchema }),
  controller.updateVendor
);

vendorRouter.patch(
  "/:id/status",
  validateRequest({ params: uuidParamSchema, body: updateVendorStatusSchema }),
  controller.updateVendorStatus
);

vendorRouter.patch(
  "/:id/rating",
  validateRequest({ params: uuidParamSchema, body: updateVendorRatingSchema }),
  controller.updateVendorRating
);

vendorRouter.delete(
  "/:id",
  validateRequest({ params: uuidParamSchema }),
  controller.softDeleteVendor
);
