import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-white/80">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs">
          © {new Date().getFullYear()} FixingApp. All rights reserved.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/support" className="hover:text-sky-600">
            Support
          </Link>
          <Link href="/about" className="hover:text-sky-600">
            About
          </Link>
          <Link href="/download" className="hover:text-sky-600">
            Get the mobile app
          </Link>
        </div>
      </div>
    </footer>
  );
}


