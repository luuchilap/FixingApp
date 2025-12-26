"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/hooks/useAuth";
import { SKILLS, type SkillValue } from "@/lib/constants/skills";
import { AddressAutocomplete } from "../jobs/AddressAutocomplete";

export function RegisterWorkerForm() {
  const router = useRouter();
  const { registerWorker, error, status } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [address, setAddress] = useState("");
  const [skill, setSkill] = useState<SkillValue | "">("");
  const [formError, setFormError] = useState<string | null>(null);

  const isSubmitting = status === "loading";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    if (!phone || !password || !fullName || !skill) {
      setFormError("Please fill in all required fields.");
      return;
    }

    try {
      await registerWorker({
        phone,
        password,
        fullName,
        address: address || null,
        skill,
      });
      router.push("/dashboard/worker");
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
        Register as Worker
      </h1>
      <p className="text-sm text-slate-600">
        Create a worker account to find local jobs that match your skills.
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
        <AddressAutocomplete
          value={address}
          onChange={(addr) => setAddress(addr)}
          placeholder="Nhập địa chỉ..."
        />
      </label>

      <label className="text-sm font-medium text-slate-700">
        Main skill*
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value as SkillValue | "")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          required
        >
          <option value="">-- Chọn skill --</option>
          {SKILLS.map((skillOption) => (
            <option key={skillOption.value} value={skillOption.value}>
              {skillOption.label}
            </option>
          ))}
        </select>
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
        {isSubmitting ? "Creating account..." : "Create worker account"}
      </button>
    </form>
  );
}


