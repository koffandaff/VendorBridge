import { DashboardRepository } from "./dashboard.repository.js";
import type {
  DashboardSummaryDto,
  DashboardTrendFilters,
  DashboardTrendPoint,
  VendorPerformanceDto,
} from "./dashboard.types.js";

export class DashboardService {
  constructor(private readonly repository: DashboardRepository = new DashboardRepository()) {}

  getSummary(): Promise<DashboardSummaryDto> {
    return this.repository.getSummary();
  }

  getTrends(filters: DashboardTrendFilters): Promise<DashboardTrendPoint[]> {
    return this.repository.getTrends(filters.months);
  }

  getVendorPerformance(): Promise<VendorPerformanceDto[]> {
    return this.repository.getVendorPerformance();
  }
}