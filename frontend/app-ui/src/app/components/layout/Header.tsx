"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/hooks/useAuth";
import { useChatUnreadCount } from "@/lib/hooks/useChatUnreadCount";
import { NotificationBell } from "../notifications/NotificationBell";

export function Header() {
  const { user, logout } = useAuth();
  const role = user?.role ?? "GUEST";
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const chatUnreadCount = useChatUnreadCount();

  return (
    <header className="border-b bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-300 shadow-sm">
      <div className="mx-auto max-w-6xl px-4 py-3">
        {/* Main header row */}
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-sky-500 to-blue-600 shadow flex items-center justify-center">
              <span className="text-lg font-bold text-white">F</span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-900">FixingApp</p>
              <p className="hidden text-xs text-slate-700 sm:block">Xe giá tốt, chốt mua nhanh!</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-4 text-sm font-semibold text-slate-800 md:flex">
            <Link href="/" className="hover:text-sky-700">
              Trang chủ
            </Link>
            <Link href="/jobs" className="hover:text-sky-700">
              Việc làm
            </Link>
            {role !== "GUEST" && (
              <Link href="/dashboard" className="hover:text-sky-700">
                Bảng điều khiển
              </Link>
            )}
            {(role === "EMPLOYER" || role === "WORKER") && (
              <Link href="/chat" className="relative inline-flex items-center hover:text-sky-700">
                Chat
                {chatUnreadCount > 0 && (
                  <span className="ml-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                    {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                  </span>
                )}
              </Link>
            )}
            {role === "EMPLOYER" && (
              <>
                <Link href="/workers" className="hover:text-sky-700">
                  Workers
                </Link>
                <Link href="/jobs/new" className="hover:text-sky-700">
                  Đăng việc
                </Link>
              </>
            )}
            {role === "ADMIN" && (
              <Link href="/dashboard/admin" className="hover:text-sky-700">
                Admin
              </Link>
            )}
          </nav>

          {/* Right side: User actions + Hamburger */}
          <div className="flex items-center gap-2">
            {/* Desktop: User info */}
            <div className="hidden items-center gap-3 md:flex">
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

            {/* Mobile: Notification bell (if logged in) */}
            {role !== "GUEST" && (
              <div className="md:hidden">
                <NotificationBell />
              </div>
            )}

            {/* Hamburger button for mobile */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-2 text-slate-800 hover:bg-white/50 focus:outline-none focus:ring-2 focus:ring-slate-500 md:hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="mt-3 border-t border-amber-400/50 pt-3 md:hidden">
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
              >
                Trang chủ
              </Link>
              <Link
                href="/jobs"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
              >
                Việc làm
              </Link>
              {role !== "GUEST" && (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
                  >
                    Bảng điều khiển
                  </Link>
                  {(role === "EMPLOYER" || role === "WORKER") && (
                    <Link
                      href="/chat"
                      onClick={() => setMobileMenuOpen(false)}
                      className="relative rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
                    >
                      Chat
                      {chatUnreadCount > 0 && (
                        <span className="ml-2 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                          {chatUnreadCount > 99 ? "99+" : chatUnreadCount}
                        </span>
                      )}
                    </Link>
                  )}
                  {role === "EMPLOYER" && (
                    <>
                      <Link
                        href="/workers"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
                      >
                        Workers
                      </Link>
                      <Link
                        href="/jobs/new"
                        onClick={() => setMobileMenuOpen(false)}
                        className="rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
                      >
                        Đăng việc
                      </Link>
                    </>
                  )}
                  {role === "ADMIN" && (
                    <Link
                      href="/dashboard/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
                    >
                      Admin
                    </Link>
                  )}
                  <div className="mt-2 border-t border-amber-400/50 pt-2">
                    <Link
                      href="/profile"
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-semibold text-slate-800 hover:bg-white/50"
                    >
                      {user?.fullName ?? "Hồ sơ"}
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full rounded-md px-3 py-2 text-left text-sm font-semibold text-slate-800 hover:bg-white/50"
                    >
                      Đăng xuất
                    </button>
                  </div>
                </>
              )}
              {role === "GUEST" && (
                <div className="mt-2 flex flex-col gap-2 border-t border-amber-400/50 pt-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md border border-slate-700 px-3 py-2 text-center text-sm font-semibold text-slate-800 hover:bg-slate-900 hover:text-white"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register/worker"
                    onClick={() => setMobileMenuOpen(false)}
                    className="rounded-md bg-slate-900 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-slate-950"
                  >
                    Đăng ký
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}


