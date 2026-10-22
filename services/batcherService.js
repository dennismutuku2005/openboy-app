import { api } from "./apiClient";

export const batcherService = {
  /**
   * Retrieves all background batchers.
   */
  async getBatchers() {
    return api.get("/batchers");
  },

  /**
   * Creates a new batch job.
   */
  async createBatcher(batcherData) {
    return api.post("/batchers", batcherData);
  },

  /**
   * Updates an existing batch job.
   */
  async updateBatcher(id, batcherData) {
    return api.put(`/batchers/${id}`, batcherData);
  },

  /**
   * Deletes a batch job.
   */
  async deleteBatcher(id) {
    return api.delete(`/batchers/${id}`);
  },

  /**
   * Manually runs a batch worker immediately.
   */
  async triggerBatcher(id) {
    return api.post(`/batchers/${id}/run`);
  },
};
