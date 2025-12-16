"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/lib/hooks/useAuth";
import { NotificationBell } from "../notifications/NotificationBell";

export function Header() {
  const { user, logout } = useAuth();
  const role = user?.role ?? "GUEST";

  return (
    <header className="border-b bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 shadow-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-10 w-10 overflow-hidden rounded-full bg-white shadow">
            <Image
              src="/img_placeholder.jpg"
              alt="Brand"
              fill
              sizes="40px"
              className="object-cover"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-slate-900">FixingApp</p>
            <p className="text-xs text-slate-700">Xe giá tốt, chốt mua nhanh!</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-4 text-sm font-semibold text-slate-800 md:flex">
          <Link href="/" className="hover:text-sky-700">
            Trang chủ
          </Link>
          <Link href="/jobs" className="hover:text-sky-700">
            Việc làm
          </Link>
          <Link href="/dashboard" className="hover:text-sky-700">
            Bảng điều khiển
          </Link>
          {role === "EMPLOYER" && (
            <Link href="/jobs/new" className="hover:text-sky-700">
              Đăng việc
            </Link>
          )}
          {role === "ADMIN" && (
            <Link href="/dashboard/admin" className="hover:text-sky-700">
              Admin
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {role !== "GUEST" && <NotificationBell />}
          {role === "GUEST" ? (
            <>
              <Link
                href="/login"
                className="rounded-full border border-slate-700 px-3 py-1 text-xs font-semibold text-slate-800 hover:bg-slate-900 hover:text-white"
              >
                Đăng nhập
              </Link>
              <Link
                href="/register/worker"
                className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-950"
              >
                Đăng ký
              </Link>
            </>
          ) : (
            <>
              <span className="rounded-full bg-white/80 px-2 py-1 text-[11px] font-semibold uppercase text-slate-700 shadow">
                {role.toLowerCase()}
              </span>
              <Link href="/profile" className="text-sm font-semibold text-slate-800 hover:text-sky-700">
                {user?.fullName ?? "Hồ sơ"}
              </Link>
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900"
              >
                Đăng xuất
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}


