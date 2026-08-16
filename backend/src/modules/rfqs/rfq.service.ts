import type { RFQStatus } from "@prisma/client";
import { RfqRepository } from "./rfq.repository.js";
import {
  ConflictError,
  NotFoundError,
} from "../../core/errors/app-error.js";
import { recordAudit } from "../../shared/helpers/audit.helper.js";
import {
  buildYearPrefix,
  generateSequentialNumber,
} from "../../shared/helpers/number.helper.js";
import type { PaginationMeta } from "../../core/http/response.js";
import type {
  CreateRfqInput,
  RfqQueryFilters,
  UpdateRfqInput,
  UpdateRfqStatusInput,
} from "./rfq.types.js";

const RFQ_TRANSITIONS: Record<RFQStatus, RFQStatus[]> = {
  DRAFT: ["OPEN", "CANCELLED"],
  OPEN: ["CLOSED", "CANCELLED"],
  CLOSED: [],
  UNDER_REVIEW: [],
  AWAITING_APPROVAL: [],
  APPROVED: [],
  REJECTED: [],
  CANCELLED: [],
};

export class RfqService {
  constructor(private readonly repository: RfqRepository = new RfqRepository()) {}

  async createRfq(input: CreateRfqInput, createdById: string) {
    const invitedVendorIds = await this.validateInvitedVendors(input.invitedVendorIds);

    const rfqNumber = await generateSequentialNumber(
      buildYearPrefix("RFQ"),
      (prefix) => this.repository.findLatestRfqNumber(prefix)
    );

    const rfq = await this.repository.createWithItems(
      {
        title: input.title,
        description: input.description,
        deadline: input.deadline,
        createdById,
        rfqNumber,
      },
      input.items,
      invitedVendorIds
    );

    await recordAudit({
      userId: createdById,
      action: "RFQ_CREATED",
      entityType: "RFQ",
      entityId: rfq.id,
      newValue: { rfqNumber: rfq.rfqNumber, title: rfq.title },
    });

    return rfq;
  }

  async getRfqById(id: string) {
    const rfq = await this.repository.findById(id);
    if (!rfq) {
      throw new NotFoundError("RFQ not found");
    }
    return rfq;
  }

  async listRfqs(filters: RfqQueryFilters, user: { id: string; role: string }) {
    let vendorId: string | undefined;

    if (user.role === "VENDOR") {
      vendorId = (await this.repository.findUserVendorId(user.id)) ?? undefined;
    }

    const { items, totalItems } = await this.repository.list(filters, vendorId);
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

  async updateRfq(id: string, input: UpdateRfqInput) {
    const rfq = await this.getRfqById(id);
    if (rfq.status !== "DRAFT") {
      throw new ConflictError("Only DRAFT RFQs can be edited");
    }

    const invitedVendorIds = input.invitedVendorIds
      ? await this.validateInvitedVendors(input.invitedVendorIds)
      : undefined;

    if (input.items) {
      await this.repository.replaceItems(id, input.items);
    }

    if (invitedVendorIds !== undefined) {
      await this.repository.replaceInvitedVendors(id, invitedVendorIds);
    }

    return this.repository.updateMetadata(id, input);
  }

  async updateRfqStatus(id: string, input: UpdateRfqStatusInput) {
    const rfq = await this.getRfqById(id);

    const allowed = RFQ_TRANSITIONS[rfq.status] ?? [];
    if (!allowed.includes(input.status)) {
      throw new ConflictError(
        `Cannot transition RFQ from '${rfq.status}' to '${input.status}'`
      );
    }

    return this.repository.updateStatus(id, input.status);
  }

  private async validateInvitedVendors(vendorIds?: string[]): Promise<string[]> {
    if (!vendorIds || vendorIds.length === 0) {
      return [];
    }

    const uniqueIds = [...new Set(vendorIds)];
    const found = await this.repository.findVendorsByIds(uniqueIds);

    if (found.length !== uniqueIds.length) {
      const foundIds = new Set(found.map((vendor) => vendor.id));
      const missingIds = uniqueIds.filter((id) => !foundIds.has(id));
      throw new NotFoundError(
        `The following vendor IDs do not exist: ${missingIds.join(", ")}`
      );
    }

    return uniqueIds;
  }
}