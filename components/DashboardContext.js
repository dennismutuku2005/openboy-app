"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initialMonitors } from "@/lib/monitorsData";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const router = useRouter();
  const [monitors, setMonitors] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialData, setModalInitialData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  // Custom modal dialogs (no browser alert/confirm!)
  const [deleteDialog, setDeleteDialog] = useState({ isOpen: false, monitor: null });
  const [pingResultDialog, setPingResultDialog] = useState({ isOpen: false, result: null });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Auth check & load data
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("openboy_user");
      if (!storedUser) {
        router.push("/login");
        return;
      } else {
        const parsed = JSON.parse(storedUser);
        const userWithDefaults = {
          username: parsed.username || "admin",
          name: parsed.name || "Dennis Mutuku",
          email: parsed.email || `${parsed.username || "admin"}@openboy.dev`,
          apiKey: parsed.apiKey || "ob_live_8f99e3a07c1264b91",
        };
        setCurrentUser(userWithDefaults);
        try {
          localStorage.setItem("openboy_user", JSON.stringify(userWithDefaults));
        } catch {}
      }

      const saved = localStorage.getItem("openboy_monitors");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.length < initialMonitors.length) {
          const existingIds = new Set(parsed.map((p) => p.id));
          const merged = [...parsed, ...initialMonitors.filter((m) => !existingIds.has(m.id))];
          setMonitors(merged);
          localStorage.setItem("openboy_monitors", JSON.stringify(merged));
        } else {
          setMonitors(parsed);
        }
      } else {
        setMonitors(initialMonitors);
        localStorage.setItem("openboy_monitors", JSON.stringify(initialMonitors));
      }

      const savedLogs = localStorage.getItem("openboy_logs");
      if (savedLogs) {
        setLogs(JSON.parse(savedLogs));
      } else {
        const initialLogs = [
          {
            id: "log-1",
            monitorId: "mon-1",
            monitorName: "Production API Health Ping",
            url: "https://api.openboy.dev/v1/health",
            method: "GET",
            status: 200,
            statusText: "OK",
            latency: 42,
            timestamp: new Date(Date.now() - 15000).toLocaleTimeString(),
            ok: true,
          },
          {
            id: "log-2",
            monitorId: "mon-3",
            monitorName: "High-Frequency Gateway Heartbeat",
            url: "https://gateway.openboy.dev/ping",
            method: "GET",
            status: 200,
            statusText: "OK",
            latency: 28,
            timestamp: new Date(Date.now() - 5000).toLocaleTimeString(),
            ok: true,
          },
          {
            id: "log-3",
            monitorId: "mon-4",
            monitorName: "Legacy Reporting Service",
            url: "https://reports.legacy-service.internal/status",
            method: "GET",
            status: 503,
            statusText: "Service Unavailable",
            latency: 2840,
            timestamp: new Date(Date.now() - 120000).toLocaleTimeString(),
            ok: false,
            error: "Database connection pool exhausted (max_connections: 100)",
          },
        ];
        setLogs(initialLogs);
      }
    } catch {
      setMonitors(initialMonitors);
    } finally {
      setIsLoadingAuth(false);
    }
  }, [router]);

  const logout = () => {
    try {
      localStorage.removeItem("openboy_user");
    } catch {}
    router.push("/login");
  };

  const saveMonitors = (updated) => {
    setMonitors(updated);
    try {
      localStorage.setItem("openboy_monitors", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const addMonitor = (newMonitor) => {
    const updated = [newMonitor, ...monitors];
    saveMonitors(updated);

    const newLog = {
      id: "log-" + Date.now(),
      monitorId: newMonitor.id,
      monitorName: newMonitor.name,
      url: newMonitor.url,
      method: newMonitor.method,
      status: 200,
      statusText: "OK",
      latency: Math.floor(Math.random() * 35) + 20,
      timestamp: new Date().toLocaleTimeString(),
      ok: true,
    };
    const updatedLogs = [newLog, ...logs].slice(0, 50);
    setLogs(updatedLogs);
    try {
      localStorage.setItem("openboy_logs", JSON.stringify(updatedLogs));
    } catch (e) {
      console.error(e);
    }
  };

  const promptDeleteMonitor = (monitor) => {
    setDeleteDialog({ isOpen: true, monitor });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, monitor: null });
  };

  const confirmDelete = () => {
    if (deleteDialog.monitor) {
      const updated = monitors.filter((m) => m.id !== deleteDialog.monitor.id);
      saveMonitors(updated);
    }
    closeDeleteDialog();
  };

  const togglePause = (id) => {
    const updated = monitors.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          status: m.status === "active" ? "paused" : "active",
        };
      }
      return m;
    });
    saveMonitors(updated);
  };

  const triggerPing = (id) => {
    const monitor = monitors.find((m) => m.id === id);
    if (!monitor) return;

    const isError = monitor.id === "mon-4" || Math.random() < 0.05;
    const latency = isError ? 2400 + Math.floor(Math.random() * 800) : 25 + Math.floor(Math.random() * 55);
    const status = isError ? (Math.random() > 0.5 ? 500 : 503) : 200;

    const newLog = {
      id: "log-" + Date.now(),
      monitorId: monitor.id,
      monitorName: monitor.name,
      url: monitor.url,
      method: monitor.method,
      status: status,
      statusText: isError ? "Server Error" : "OK",
      latency: latency,
      timestamp: new Date().toLocaleTimeString(),
      ok: !isError,
      error: isError ? "Upstream service timeout / connection refused" : undefined,
    };

    const updatedLogs = [newLog, ...logs].slice(0, 50);
    setLogs(updatedLogs);
    try {
      localStorage.setItem("openboy_logs", JSON.stringify(updatedLogs));
    } catch (e) {
      console.error(e);
    }

    const updated = monitors.map((m) => {
      if (m.id === id) {
        return {
          ...m,
          lastStatus: status,
          lastLatency: latency,
          lastChecked: "Just now",
          totalPings: (m.totalPings || 0) + 1,
          failedPings: isError ? (m.failedPings || 0) + 1 : (m.failedPings || 0),
          status: isError ? "failing" : m.status === "failing" ? "active" : m.status,
          history: [
            { status, latency, time: "Just now", ok: !isError },
            ...(m.history || []).slice(0, 4),
          ],
        };
      }
      return m;
    });
    saveMonitors(updated);

    // Open detailed execution inspect modal
    setPingResultDialog({ isOpen: true, result: newLog });
  };

  const closePingResultDialog = () => {
    setPingResultDialog({ isOpen: false, result: null });
  };

  const openCreateModal = (initial = null) => {
    setModalInitialData(initial);
    setIsModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsModalOpen(false);
    setModalInitialData(null);
  };

  const updateProfile = (updatedFields) => {
    setCurrentUser((prev) => {
      const updated = { ...prev, ...updatedFields };
      try {
        localStorage.setItem("openboy_user", JSON.stringify(updated));
      } catch (e) {
        console.error(e);
      }
      return updated;
    });
    return { success: true, message: "Profile updated successfully." };
  };

  const updatePassword = (currentPass, newPass) => {
    if (!newPass || newPass.length < 8) {
      return { success: false, message: "New password must be at least 8 characters long." };
    }
    try {
      localStorage.setItem("openboy_password_last_changed", new Date().toISOString());
      return { success: true, message: "Security credentials updated successfully." };
    } catch (e) {
      return { success: false, message: e.message || "Failed to update password." };
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        monitors,
        logs,
        isModalOpen,
        modalInitialData,
        activeFilter,
        currentUser,
        isLoadingAuth,
        deleteDialog,
        pingResultDialog,
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        logout,
        setActiveFilter,
        openCreateModal,
        closeCreateModal,
        addMonitor,
        promptDeleteMonitor,
        closeDeleteDialog,
        confirmDelete,
        closePingResultDialog,
        togglePause,
        triggerPing,
        updateProfile,
        updatePassword,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("useDashboard must be used within DashboardProvider");
  }
  return context;
}
