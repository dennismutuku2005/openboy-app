import { api } from "./apiClient";

const rawEngineUrl =
  process.env.NEXT_PUBLIC_ENGINE_API_URL || "https://openboyapi.cloudmint.co.ke/api";
const cleanEngineUrl = rawEngineUrl.replace(/\/+$/, "");
const baseApiUrl = cleanEngineUrl.endsWith("/api")
  ? cleanEngineUrl
  : `${cleanEngineUrl}/api`;
const STREAM_URL = `${baseApiUrl}/stream`;

export const executionService = {
  /**
   * Retrieves paginated execution audit logs.
   */
  async getExecutions(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", params.limit);
    if (params.offset) query.set("offset", params.offset);
    if (params.filter && params.filter !== "all") query.set("filter", params.filter);
    if (params.search) query.set("search", params.search);
    if (params.monitorId || params.monitor_id || params.monitor) {
      query.set("monitor_id", params.monitorId || params.monitor_id || params.monitor);
    }
    const qs = query.toString() ? `?${query.toString()}` : "";
    return api.get(`/executions${qs}`);
  },

  /**
   * Clears all execution audit logs.
   */
  async clearExecutions() {
    return api.delete("/executions");
  },

  /**
   * Deletes a single execution log entry.
   */
  async deleteExecution(id) {
    return api.delete(`/executions/${id}`);
  },

  /**
   * Fetches real-time engine telemetry cards.
   */
  async getSystemStats() {
    return api.get("/stats");
  },

  /**
   * Opens a persistent Server-Sent Events (SSE) feed for live execution dispatches.
   */
  subscribeLiveStream(onLog, onConnect, onError) {
    if (typeof window === "undefined") return () => {};

    let es = null;
    let reconnectTimer = null;

    const connect = () => {
      try {
        es = new EventSource(STREAM_URL);

        es.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === "execution" && data.log && onLog) {
              onLog(data.log);
            } else if (data.type === "connected" && onConnect) {
              onConnect(data);
            }
          } catch {}
        };

        es.onerror = (err) => {
          if (onError) onError(err);
          if (es) es.close();
          reconnectTimer = setTimeout(connect, 10000);
        };
      } catch (err) {
        if (onError) onError(err);
      }
    };

    connect();

    return () => {
      if (es) es.close();
      if (reconnectTimer) clearTimeout(reconnectTimer);
    };
  },
};
