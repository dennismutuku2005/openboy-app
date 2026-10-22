"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

  // 1. Authenticate with JWT & Load real data directly from Go API service
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
        router.push("/login");
        return;
      }

      // Load real monitors from service
      try {
        const remoteMonitors = await monitorService.getMonitors();
        if (isMounted) {
          setMonitors(Array.isArray(remoteMonitors) ? remoteMonitors : []);
        }
      } catch {
        if (isMounted) setMonitors([]);
      }

      // Load real execution logs from service
      try {
        const logsData = await executionService.getExecutions({ limit: 50 });
        if (isMounted) {
          setLogs(logsData?.logs && Array.isArray(logsData.logs) ? logsData.logs : []);
        }
      } catch {
        if (isMounted) setLogs([]);
      }

      if (isMounted) {
        setIsLoadingAuth(false);
      }
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
    try {
      const created = await monitorService.createMonitor(newMonitor);
      const mon = created || newMonitor;
      setMonitors((prev) => [mon, ...prev]);
    } catch (err) {
      console.error("Failed to persist monitor to API:", err);
      setMonitors((prev) => [newMonitor, ...prev]);
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
      setMonitors((prev) => prev.filter((m) => m.id !== id));
      try {
        await monitorService.deleteMonitor(id);
      } catch (err) {
        console.error("Failed to delete monitor:", err);
      }
    }
    closeDeleteDialog();
  };

  const togglePause = async (id) => {
    setMonitors((prev) =>
      prev.map((m) =>
        m.id === id
          ? {
              ...m,
              status: m.status === "active" ? "paused" : "active",
            }
          : m
      )
    );

    try {
      await monitorService.toggleMonitor(id);
    } catch (err) {
      console.error("Failed to toggle monitor:", err);
    }
  };

  const triggerPing = async (id) => {
    const monitor = monitors.find((m) => m.id === id);
    if (!monitor) return;

    try {
      const liveLog = await monitorService.triggerPing(id);
      if (liveLog) {
        setLogs((prev) => [liveLog, ...prev].slice(0, 50));

        setMonitors((prev) =>
          prev.map((m) => {
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
          })
        );
        setPingResultDialog({ isOpen: true, result: liveLog });
      }
    } catch (err) {
      console.error("Real probe execution failed:", err);
    }
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
