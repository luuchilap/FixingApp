import type { Metadata } from "next";
import "./globals.css";
import { MainShell } from "./components/layout/MainShell";
import { AuthProvider } from "../lib/hooks/useAuth";

export const metadata: Metadata = {
  title: "FixingApp",
  description: "Job matching platform for workers, employers, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <AuthProvider>
          <MainShell>{children}</MainShell>
        </AuthProvider>
      </body>
    </html>
  );
}
