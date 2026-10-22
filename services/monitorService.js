import { api } from "./apiClient";

export const monitorService = {
  /**
   * Retrieves all registered monitors with optional search and category filters.
   */
  async getMonitors(params = {}) {
    const query = new URLSearchParams();
    if (params.category && params.category !== "all") query.set("category", params.category);
    if (params.search) query.set("search", params.search);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/monitors${qs}`);
  },

  /**
   * Retrieves a single monitor by ID.
   */
  async getMonitor(id) {
    return api.get(`/monitors/${id}`);
  },

  /**
   * Creates a new health monitor.
   */
  async createMonitor(monitorData) {
    return api.post("/monitors", monitorData);
  },

  /**
   * Updates an existing monitor.
   */
  async updateMonitor(id, monitorData) {
    return api.put(`/monitors/${id}`, monitorData);
  },

  /**
   * Deletes a monitor.
   */
  async deleteMonitor(id) {
    return api.delete(`/monitors/${id}`);
  },

  /**
   * Toggles a monitor between active and paused.
   */
  async toggleMonitor(id) {
    return api.post(`/monitors/${id}/toggle`);
  },

  /**
   * Triggers an immediate synchronous probe and returns execution metrics.
   */
  async triggerPing(id) {
    return api.post(`/monitors/${id}/ping`);
  },
};
