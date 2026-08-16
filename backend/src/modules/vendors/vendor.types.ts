import type { VendorStatus } from "@prisma/client";

// Vendor Category Types
export interface CreateVendorCategoryInput {
  name: string;
  description?: string | null;
}

export interface UpdateVendorCategoryInput {
  name?: string;
  description?: string | null;
}

// Vendor Types
export interface CreateVendorInput {
  name: string;
  code?: string;
  categoryId: string;
  email: string;
  phone: string;
  gstNumber?: string | null;
  panNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country: string;
  status?: VendorStatus;
  rating?: number | null;
  notes?: string | null;
}

export interface UpdateVendorInput {
  name?: string;
  categoryId?: string;
  email?: string;
  phone?: string;
  gstNumber?: string | null;
  panNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  country?: string;
  notes?: string | null;
}

export interface UpdateVendorStatusInput {
  status: VendorStatus;
}

export interface UpdateVendorRatingInput {
  rating: number;
}

export interface VendorQueryFilters {
  search?: string;
  categoryId?: string;
  status?: VendorStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "name" | "rating";
  sortOrder?: "asc" | "desc";
}

// Vendor Contact Types
export interface CreateVendorContactInput {
  name: string;
  email: string;
  phone: string;
  designation?: string | null;
  isPrimary?: boolean;
}

export interface UpdateVendorContactInput {
  name?: string;
  email?: string;
  phone?: string;
  designation?: string | null;
  isPrimary?: boolean;
}
