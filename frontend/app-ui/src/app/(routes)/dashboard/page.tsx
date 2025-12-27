"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";

export default function DashboardLandingPage() {
  const { user, status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && user) {
      // Redirect to role-specific dashboard
      if (user.role === "WORKER") {
        router.replace("/dashboard/worker");
      } else if (user.role === "EMPLOYER") {
        router.replace("/dashboard/employer");
      } else if (user.role === "ADMIN") {
        router.replace("/dashboard/admin");
      }
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [user, status, router]);

  // Show loading state while redirecting
  return (
    <div className="mx-auto max-w-5xl py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-2 text-slate-600">Đang chuyển hướng...</p>
    </div>
  );
}


