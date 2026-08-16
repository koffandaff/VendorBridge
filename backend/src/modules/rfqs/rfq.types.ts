import type { RFQItemType, RFQStatus } from "@prisma/client";

export interface CreateRfqItemInput {
  name: string;
  description?: string | null;
  itemType: RFQItemType;
  quantity: number;
  unit: string;
  estimatedUnitPrice?: number | null;
  notes?: string | null;
}

export interface CreateRfqInput {
  title: string;
  description: string;
  deadline: Date;
  items: CreateRfqItemInput[];
  invitedVendorIds?: string[];
}

export interface UpdateRfqInput {
  title?: string;
  description?: string;
  deadline?: Date;
  items?: CreateRfqItemInput[];
  invitedVendorIds?: string[];
}

export interface UpdateRfqStatusInput {
  status: RFQStatus;
}

export interface RfqQueryFilters {
  search?: string;
  status?: RFQStatus;
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "deadline" | "title";
  sortOrder?: "asc" | "desc";
}