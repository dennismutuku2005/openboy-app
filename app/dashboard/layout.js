import { DashboardProvider } from "@/components/DashboardContext";
import DashboardSidebar from "@/components/DashboardSidebar";
import DashboardNavbar from "@/components/DashboardNavbar";
import DashboardFooter from "@/components/DashboardFooter";
import CreateMonitorModal from "@/components/CreateMonitorModal";

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

        {/* Main Content Pane */}
        <div className="flex-1 flex flex-col min-w-0 min-h-screen">
          <DashboardNavbar />
          <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full">
            {children}
          </main>
          <DashboardFooter />
        </div>

        {/* Global Modal */}
        <CreateMonitorModal />
      </div>
    </DashboardProvider>
  );
}
