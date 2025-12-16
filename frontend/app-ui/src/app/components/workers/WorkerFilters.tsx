"use client";

import { FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SKILLS, type SkillValue } from "@/lib/constants/skills";

export function WorkerFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [skill, setSkill] = useState<SkillValue | "">(
    (searchParams.get("skill") as SkillValue) || ""
  );
  const [address, setAddress] = useState(searchParams.get("address") ?? "");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    skill ? params.set("skill", skill) : params.delete("skill");
    address ? params.set("address", address) : params.delete("address");
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end"
    >
      <label className="flex-1 text-sm font-medium text-slate-700">
        Skill
        <select
          value={skill}
          onChange={(e) => setSkill(e.target.value as SkillValue | "")}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
        >
          <option value="">-- Tất cả skill --</option>
          {SKILLS.map((skillOption) => (
            <option key={skillOption.value} value={skillOption.value}>
              {skillOption.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex-1 text-sm font-medium text-slate-700">
        Địa chỉ
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          placeholder="Nhập địa chỉ..."
        />
      </label>

      <button
        type="submit"
        className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 sm:mt-0"
      >
        Tìm kiếm
      </button>
    </form>
  );
}

