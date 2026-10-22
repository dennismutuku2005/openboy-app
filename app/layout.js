import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "OpenBoy - High-Frequency Cron Jobs & API Uptime Monitoring",
  description: "Monitor and execute high-frequency cron jobs, webhook batchers, and uptime health pings starting from 10 seconds to custom intervals.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-openboy-bg text-openboy-text-main font-sans selection:bg-[#ffd600] selection:text-black">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
