"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";

export function RegisterEmployerForm() {
  const router = useRouter();
  const { registerEmployer, error, status } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = status === "loading";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!phone || !password || !fullName) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      await registerEmployer({
        phone,
        password,
        fullName,
        address: address || null,
      });
      router.push("/dashboard/employer");
    } catch {
      // error state handled by useAuth
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm"
    >
      <h1 className="text-xl font-semibold text-slate-900">
        Register as Employer
      </h1>
      <p className="text-sm text-slate-600">
        Create an account to post jobs and manage applications.
      </p>

      <label className="text-sm font-medium text-slate-700">
        Phone*
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="0901234567"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Password*
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Full name*
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Address
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
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
        {isSubmitting ? "Creating account..." : "Create employer account"}
      </button>
    </form>
  );
}


