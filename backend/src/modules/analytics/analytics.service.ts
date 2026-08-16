import { AnalyticsRepository } from "./analytics.repository.js";

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository = new AnalyticsRepository()) {}

  async getStats() {
    return this.repository.getStats();
  }

  async getReportsOverview() {
    return this.repository.getReportsOverview();
  }
}