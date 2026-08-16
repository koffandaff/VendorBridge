import { z } from "zod";
import { VendorStatus } from "@prisma/client";

// Category Schemas
export const createVendorCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name must be at least 2 characters").max(100),
  description: z.string().trim().max(500).nullish(),
});

export const updateVendorCategorySchema = createVendorCategorySchema.partial();

// Vendor Schemas
export const createVendorSchema = z.object({
  name: z.string().trim().min(2, "Vendor name must be at least 2 characters").max(200),
  code: z.string().trim().max(50).optional(),
  categoryId: z.string().uuid("Invalid category ID format"),
  email: z.string().trim().email("Invalid email format"),
  phone: z.string().trim().min(5, "Phone number too short").max(20),
  gstNumber: z
    .string()
    .trim()
    .regex(/^[0-9A-Z]{15}$/, "GST number must be 15 alphanumeric characters")
    .nullish()
    .or(z.literal("")),
  panNumber: z
    .string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN number must follow standard format (e.g. ABCDE1234F)")
    .nullish()
    .or(z.literal("")),
  address: z.string().trim().max(500).nullish(),
  city: z.string().trim().max(100).nullish(),
  state: z.string().trim().max(100).nullish(),
  postalCode: z.string().trim().max(20).nullish(),
  country: z.string().trim().min(2).max(100),
  status: z.nativeEnum(VendorStatus).optional(),
  rating: z
    .number()
    .min(0, "Rating cannot be less than 0")
    .max(5, "Rating cannot exceed 5")
    .nullish(),
  notes: z.string().trim().max(1000).nullish(),
});

export const updateVendorSchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  categoryId: z.string().uuid("Invalid category ID format").optional(),
  email: z.string().trim().email("Invalid email format").optional(),
  phone: z.string().trim().min(5).max(20).optional(),
  gstNumber: z
    .string()
    .trim()
    .regex(/^[0-9A-Z]{15}$/, "GST number must be 15 alphanumeric characters")
    .nullish()
    .or(z.literal("")),
  panNumber: z
    .string()
    .trim()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN number must follow standard format (e.g. ABCDE1234F)")
    .nullish()
    .or(z.literal("")),
  address: z.string().trim().max(500).nullish(),
  city: z.string().trim().max(100).nullish(),
  state: z.string().trim().max(100).nullish(),
  postalCode: z.string().trim().max(20).nullish(),
  country: z.string().trim().min(2).max(100).optional(),
  notes: z.string().trim().max(1000).nullish(),
});

export const updateVendorStatusSchema = z.object({
  status: z.nativeEnum(VendorStatus),
});

export const updateVendorRatingSchema = z.object({
  rating: z
    .number()
    .min(0, "Rating must be between 0.00 and 5.00")
    .max(5, "Rating must be between 0.00 and 5.00"),
});

export const vendorQuerySchema = z.object({
  search: z.string().trim().optional(),
  categoryId: z.string().uuid().optional(),
  status: z.nativeEnum(VendorStatus).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  sortBy: z.enum(["createdAt", "name", "rating"]).default("createdAt"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// Contact Schemas
export const createVendorContactSchema = z.object({
  name: z.string().trim().min(2, "Contact name must be at least 2 characters").max(150),
  email: z.string().trim().email("Invalid contact email format"),
  phone: z.string().trim().min(5).max(20),
  designation: z.string().trim().max(100).nullish(),
  isPrimary: z.boolean().default(false),
});

export const updateVendorContactSchema = createVendorContactSchema.partial();

export const uuidParamSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const vendorContactParamSchema = z.object({
  vendorId: z.string().uuid("Invalid vendor ID format"),
  contactId: z.string().uuid("Invalid contact ID format").optional(),
});
