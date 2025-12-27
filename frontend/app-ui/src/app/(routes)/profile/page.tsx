"use client";

import { FormEvent, useEffect, useState } from "react";
import { useAuth } from "../../../lib/hooks/useAuth";
import { AddressAutocomplete } from "../../components/jobs/AddressAutocomplete";

export default function ProfilePage() {
  const { user, status, updateProfile, error } = useAuth();
  const [fullName, setFullName] = useState(user?.fullName ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.fullName);
      setAddress(user.address ?? "");
    }
  }, [user]);

  if (status === "idle" || status === "loading") {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-5xl py-8">
        <p className="text-sm text-slate-600">
          You need to log in to view and edit your profile.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSavedMessage(null);
    await updateProfile({ fullName, address });
    setSavedMessage("Profile saved successfully.");
  }

  return (
    <div className="mx-auto max-w-5xl py-8">
      <form
        onSubmit={handleSubmit}
        className="mx-auto flex w-full max-w-md flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <h1 className="text-xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-600">
          Update your basic information. More detailed worker/employer settings
          will be added later.
        </p>

        <label className="text-sm font-medium text-slate-700">
          Phone
          <input
            type="tel"
            value={user.phone}
            disabled
            className="mt-1 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Full name
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
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

        {error && <p className="text-sm text-red-600">{error}</p>}
        {savedMessage && (
          <p className="text-sm text-emerald-600">{savedMessage}</p>
        )}

        <button
          type="submit"
          className="mt-2 inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          Save changes
        </button>
      </form>
    </div>
  );
}


