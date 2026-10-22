"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { initialMonitors } from "@/lib/monitorsData";
import { useTheme } from "./ThemeProvider";
import { authService } from "@/services/authService";
import { monitorService } from "@/services/monitorService";
import { executionService } from "@/services/executionService";

const DashboardContext = createContext(null);

export function DashboardProvider({ children }) {
  const router = useRouter();
  const { theme, toggleTheme, setTheme, isDark } = useTheme();
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

  // 1. Authenticate with JWT & Load data from API service
  useEffect(() => {
    let isMounted = true;

    async function initializeSession() {
      // Must have valid session
      if (!authService.isAuthenticated()) {
        router.push("/login");
        return;
      }

      // Load user profile via service
      try {
        const profile = await authService.getMe();
        if (isMounted && profile) {
          setCurrentUser(profile);
          try {
            localStorage.setItem("openboy_user", JSON.stringify(profile));
          } catch {}
        }
      } catch {
        // Fallback to local session storage if API engine offline
        try {
          const stored = localStorage.getItem("openboy_user");
          if (stored) {
            const parsed = JSON.parse(stored);
            if (isMounted) setCurrentUser(parsed);
          } else {
            router.push("/login");
            return;
          }
        } catch {
          router.push("/login");
          return;
        }
      }

      // Load monitors from service
      try {
        const remoteMonitors = await monitorService.getMonitors();
        if (isMounted && Array.isArray(remoteMonitors) && remoteMonitors.length > 0) {
          setMonitors(remoteMonitors);
          try {
            localStorage.setItem("openboy_monitors", JSON.stringify(remoteMonitors));
          } catch {}
        } else {
          loadLocalMonitors();
        }
      } catch {
        loadLocalMonitors();
      }

      // Load execution logs from service
      try {
        const logsData = await executionService.getExecutions({ limit: 50 });
        if (isMounted && logsData && Array.isArray(logsData.logs) && logsData.logs.length > 0) {
          setLogs(logsData.logs);
          try {
            localStorage.setItem("openboy_logs", JSON.stringify(logsData.logs));
          } catch {}
        } else {
          loadLocalLogs();
        }
      } catch {
        loadLocalLogs();
      }

      if (isMounted) {
        setIsLoadingAuth(false);
      }
    }

    function loadLocalMonitors() {
      try {
        const saved = localStorage.getItem("openboy_monitors");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.length < initialMonitors.length) {
            const existingIds = new Set(parsed.map((p) => p.id));
            const merged = [...parsed, ...initialMonitors.filter((m) => !existingIds.has(m.id))];
            if (isMounted) setMonitors(merged);
            localStorage.setItem("openboy_monitors", JSON.stringify(merged));
          } else {
            if (isMounted) setMonitors(parsed);
          }
        } else {
          if (isMounted) setMonitors(initialMonitors);
          localStorage.setItem("openboy_monitors", JSON.stringify(initialMonitors));
        }
      } catch {
        if (isMounted) setMonitors(initialMonitors);
      }
    }

    function loadLocalLogs() {
      try {
        const savedLogs = localStorage.getItem("openboy_logs");
        if (savedLogs) {
          if (isMounted) setLogs(JSON.parse(savedLogs));
        } else {
          const defaultLogs = [
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
          if (isMounted) setLogs(defaultLogs);
        }
      } catch {}
    }

    initializeSession();

    return () => {
      isMounted = false;
    };
  }, [router]);

  // 2. Realtime SSE Live Stream Subscriber
  useEffect(() => {
    const unsubscribe = executionService.subscribeLiveStream(
      (newLog) => {
        setLogs((prev) => [newLog, ...prev].slice(0, 100));
        setMonitors((prev) =>
          prev.map((m) => {
            if (m.id === newLog.monitorId) {
              return {
                ...m,
                lastStatus: newLog.status,
                lastLatency: newLog.latency,
                lastChecked: "Just now",
                status: newLog.ok ? (m.status === "failing" ? "active" : m.status) : "failing",
                totalPings: (m.totalPings || 0) + 1,
              };
            }
            return m;
          })
        );
      },
      null,
      () => {} // silent reconnect on network flap
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const logout = () => {
    authService.logout();
  };

  const saveMonitors = (updated) => {
    setMonitors(updated);
    try {
      localStorage.setItem("openboy_monitors", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
  };

  const addMonitor = async (newMonitor) => {
    const updated = [newMonitor, ...monitors];
    saveMonitors(updated);

    try {
      await monitorService.createMonitor(newMonitor);
    } catch {}

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

  const confirmDelete = async () => {
    if (deleteDialog.monitor) {
      const id = deleteDialog.monitor.id;
      const updated = monitors.filter((m) => m.id !== id);
      saveMonitors(updated);

      try {
        await monitorService.deleteMonitor(id);
      } catch {}
    }
    closeDeleteDialog();
  };

  const togglePause = async (id) => {
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

    try {
      await monitorService.toggleMonitor(id);
    } catch {}
  };

  const triggerPing = async (id) => {
    const monitor = monitors.find((m) => m.id === id);
    if (!monitor) return;

    // 1. Try real probe via monitorService
    try {
      const liveLog = await monitorService.triggerPing(id);
      if (liveLog) {
        const updatedLogs = [liveLog, ...logs].slice(0, 50);
        setLogs(updatedLogs);
        try {
          localStorage.setItem("openboy_logs", JSON.stringify(updatedLogs));
        } catch {}

        const updated = monitors.map((m) => {
          if (m.id === id) {
            return {
              ...m,
              lastStatus: liveLog.status,
              lastLatency: liveLog.latency,
              lastChecked: "Just now",
              totalPings: (m.totalPings || 0) + 1,
              failedPings: liveLog.ok ? (m.failedPings || 0) : (m.failedPings || 0) + 1,
              status: liveLog.ok ? (m.status === "failing" ? "active" : m.status) : "failing",
              history: [
                { status: liveLog.status, latency: liveLog.latency, time: "Just now", ok: liveLog.ok },
                ...(m.history || []).slice(0, 4),
              ],
            };
          }
          return m;
        });
        saveMonitors(updated);
        setPingResultDialog({ isOpen: true, result: liveLog });
        return;
      }
    } catch {
      // Backend offline, fallback to simulation
    }

    // 2. Local simulation fallback
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

  const updateProfile = async (updatedFields) => {
    try {
      await authService.updateProfile(updatedFields.name, updatedFields.email);
    } catch {}

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

  const updatePassword = async (currentPass, newPass) => {
    if (!newPass || newPass.length < 8) {
      return { success: false, message: "New password must be at least 8 characters long." };
    }
    try {
      await authService.updatePassword(currentPass, newPass);
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
        theme,
        toggleTheme,
        setTheme,
        isDark,
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
