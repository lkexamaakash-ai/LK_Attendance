import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ManagementProvider } from "@/context/ManagementContext";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "LK Academy",
  description: "LK Academy: attendance, students and payroll for every branch.",
  applicationName: "LK Academy",
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "LK Academy",
    statusBarStyle: "default",
  },
};

export const viewport = {
  themeColor: "#6f1f31",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ManagementProvider>
          <main>
            {children}
          </main>
          <Toaster position={"top-center"} />
        </ManagementProvider>
      </body>
    </html>
  );
}
