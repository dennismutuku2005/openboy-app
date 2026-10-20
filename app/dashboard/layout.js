import { DashboardProvider } from "@/components/DashboardContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import CreateMonitorModal from "@/components/CreateMonitorModal";
import DeleteConfirmModal from "@/components/DeleteConfirmModal";
import PingResultModal from "@/components/PingResultModal";

export const metadata = {
  title: "OpenBoy Internal Console - Cron Monitors & Batchers",
  description: "Internal cron job orchestration and API uptime monitoring platform.",
};

export default function DashboardLayout({ children }) {
  return (
    <DashboardProvider>
      <div className="min-h-screen bg-[#14170e] text-[#f4f5ee] flex selection:bg-[#ffd600] selection:text-black">
        {/* Always Open Left Sidebar */}
        <DashboardSidebar />

        {/* End-to-end Left-oriented Content Pane (No Footer, Full Width) */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <DashboardNavbar />
          <main className="flex-1 p-6 sm:p-8 w-full max-w-none">
            {children}
          </main>
        </div>

        {/* Custom Modals & Dialogs (No browser alert/confirm!) */}
        <CreateMonitorModal />
        <DeleteConfirmModal />
        <PingResultModal />
      </div>
    </DashboardProvider>
  );
}
