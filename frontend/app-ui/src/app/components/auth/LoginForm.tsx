"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";

export function LoginForm() {
  const router = useRouter();
  const { login, error, status } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = status === "loading";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!phone || !password) {
      setFormError("Please enter phone and password.");
      return;
    }

    try {
      const res = await login({ phone, password });
      const role = res.user.role;

      if (role === "EMPLOYER") {
        router.push("/dashboard/employer");
      } else if (role === "WORKER") {
        router.push("/dashboard/worker");
      } else if (role === "ADMIN") {
        router.push("/dashboard/admin");
      } else {
        router.push("/");
      }
    } catch {
      // error already stored in hook
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      <h1 className="text-xl font-semibold text-slate-900">Log in</h1>
      <p className="text-sm text-slate-600">
        Use the phone number and password you registered with.
      </p>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          Sample Accounts for Testing
        </p>
        <div className="space-y-1.5 text-xs text-slate-600">
          <div>
            <span className="font-medium text-slate-700">Employer:</span>{" "}
            <span className="font-mono">0901234567</span> /{" "}
            <span className="font-mono">password123</span>
          </div>
          <div>
            <span className="font-medium text-slate-700">Worker:</span>{" "}
            <span className="font-mono">0913456789</span> /{" "}
            <span className="font-mono">password123</span>
          </div>
        </div>
      </div>

      <label className="text-sm font-medium text-slate-700">
        Phone
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="0901234567"
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Password
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        />
      </label>

      {(formError || error) && (
        <p className="text-sm text-red-600">
          {formError ?? error ?? "Something went wrong"}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}


