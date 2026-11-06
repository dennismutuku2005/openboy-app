import { api } from "./apiClient";

export const maintenanceService = {
  /**
   * Fetches real-time database storage telemetry, row counts, and date spans.
   */
  async getMaintenanceStats() {
    return api.get("/maintenance/stats");
  },

  /**
   * Clears execution logs with optional retention age (days) and target monitor ID filters.
   * If both are omitted, purges all execution logs across the entire system.
   */
  async clearExecutionLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.days !== undefined && params.days !== null && params.days !== "") {
      query.set("days", params.days);
    }
    if (params.monitorId || params.monitor_id) {
      query.set("monitor_id", params.monitorId || params.monitor_id);
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.delete(`/executions${qs}`);
  },

  /**
   * Resets monitor ping counters (total_pings, failed_pings) and restores baseline 100% SLA.
   * Can be targeted to a single monitor or applied globally across all monitors.
   */
  async resetMonitorCounters(monitorId = "") {
    const query = new URLSearchParams();
    if (monitorId) {
      query.set("monitor_id", monitorId);
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.post(`/maintenance/reset-monitors${qs}`);
  },
};

