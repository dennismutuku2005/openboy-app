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
};
