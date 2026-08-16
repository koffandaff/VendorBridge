import { ActivityRepository } from "./activity.repository.js";
import type { PaginationMeta } from "../../core/http/response.js";
import type { ActivityQueryFilters } from "./activity.types.js";

export class ActivityService {
  constructor(private readonly repository: ActivityRepository = new ActivityRepository()) {}

  async listActivityLogs(filters: ActivityQueryFilters) {
    const { items, totalItems } = await this.repository.list(filters);
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const totalPages = Math.ceil(totalItems / limit) || 1;

    const pagination: PaginationMeta = {
      page,
      limit,
      totalItems,
      totalPages,
    };

    return { items, pagination };
  }
}