import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AdminAuthProvider } from "@/components/context/AdminAuthContext";
import { Toaster } from "sonner";
import TokenRefreshHandler from "@/components/TokenRefreshHandler";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Vulcan Admin Dashboard",
  description: "Admin dashboard for Vulcan Academy",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AdminAuthProvider>
          <TokenRefreshHandler />
          {children}
          <Toaster />
        </AdminAuthProvider>
      </body>
    </html>
  );
}

