import { api } from "./apiClient";

export const incidentService = {
  /**
   * Retrieves all incidents and outages.
   */
  async getIncidents() {
    return api.get("/incidents");
  },

  /**
   * Declares a new incident.
   */
  async createIncident(incidentData) {
    return api.post("/incidents", incidentData);
  },

  /**
   * Updates an existing incident.
   */
  async updateIncident(id, incidentData) {
    return api.put(`/incidents/${id}`, incidentData);
  },

  /**
   * Marks an incident as resolved.
   */
  async resolveIncident(id) {
    return api.post(`/incidents/${id}/resolve`);
  },

  /**
   * Deletes an incident record.
   */
  async deleteIncident(id) {
    return api.delete(`/incidents/${id}`);
  },

  /**
   * Deletes multiple marked incident records by IDs in a single request.
   * Uses POST with JSON payload to avoid browser / reverse-proxy URL length limits.
   */
  async deleteIncidents(ids = []) {
    if (!ids || ids.length === 0) return { cleared: 0 };
    return api.post("/incidents/batch-delete", { ids });
  },

  /**
   * Resolves multiple marked incident records by IDs in a single batch request.
   */
  async resolveIncidents(ids = []) {
    if (!ids || ids.length === 0) return { resolved: 0 };
    return api.post("/incidents/batch-resolve", { ids });
  },

  /**
   * Clears all incident records across the entire system.
   */
  async clearAllIncidents() {
    return api.delete("/incidents");
  },
};
