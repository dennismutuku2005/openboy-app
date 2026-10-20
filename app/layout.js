import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "OpenBoy - High-Frequency Cron Jobs & API Uptime Monitoring",
  description: "Monitor and execute high-frequency cron jobs, webhook batchers, and uptime health pings starting from 10 seconds to custom intervals.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#14170e] text-[#f4f5ee] font-sans">
        {children}
      </body>
    </html>
  );
}
