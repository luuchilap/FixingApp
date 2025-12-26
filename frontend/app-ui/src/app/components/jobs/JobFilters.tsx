"use client";

import { FormEvent, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SKILLS, type SkillValue } from "@/lib/constants/skills";
import { AddressAutocomplete } from "./AddressAutocomplete";

type DistanceOption = "1" | "3" | "5" | "";

const DISTANCE_OPTIONS: Array<{ value: DistanceOption; label: string }> = [
  { value: "1", label: "< 1km" },
  { value: "3", label: "1-3km" },
  { value: "5", label: "3-5km" },
];

export function JobFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [skill, setSkill] = useState<SkillValue | "">(
    (searchParams.get("skill") as SkillValue) || ""
  );
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [useLocation, setUseLocation] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");
  const [locationLat, setLocationLat] = useState<number | undefined>(undefined);
  const [locationLon, setLocationLon] = useState<number | undefined>(undefined);
  const [distance, setDistance] = useState<DistanceOption>(
    (searchParams.get("distance") as DistanceOption) || ""
  );
  const [locationError, setLocationError] = useState<string | null>(null);

  // Get user's current location
  function handleGetLocation() {
    setLocationError(null);
    if (!navigator.geolocation) {
      setLocationError("Trình duyệt không hỗ trợ định vị. Vui lòng nhập địa chỉ thủ công.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocationLat(position.coords.latitude);
        setLocationLon(position.coords.longitude);
        setUseLocation(true);
        setLocationError(null);
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError("Không thể lấy vị trí. Vui lòng nhập địa chỉ thủ công.");
      }
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());

    q ? params.set("q", q) : params.delete("q");
    skill ? params.set("skill", skill) : params.delete("skill");
    minPrice ? params.set("minPrice", minPrice) : params.delete("minPrice");
    maxPrice ? params.set("maxPrice", maxPrice) : params.delete("maxPrice");
    
    // Location-based filtering
    if (useLocation && locationLat && locationLon && distance) {
      params.set("latitude", locationLat.toString());
      params.set("longitude", locationLon.toString());
      params.set("maxDistance", distance);
    } else {
      params.delete("latitude");
      params.delete("longitude");
      params.delete("maxDistance");
    }
    
    params.delete("distance"); // Remove old distance param
    params.delete("page");

    router.push(`${pathname}?${params.toString()}`);
  }

  // Reset location when distance is cleared
  useEffect(() => {
    if (!distance) {
      setUseLocation(false);
      setLocationAddress("");
      setLocationLat(undefined);
      setLocationLon(undefined);
    }
  }, [distance]);

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex-1 text-sm font-medium text-slate-700">
          Keyword
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            placeholder="Job title or description"
          />
        </label>
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
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex-1 text-sm font-medium text-slate-700">
          Min price (đ)
          <input
            type="number"
            min={0}
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
        <label className="flex-1 text-sm font-medium text-slate-700">
          Max price (đ)
          <input
            type="number"
            min={0}
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>
      </div>

      {/* Location-based search */}
      <div className="flex flex-col gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700">
            Tìm kiếm công việc gần bạn
          </label>
          <button
            type="button"
            onClick={handleGetLocation}
            className="inline-flex items-center justify-center rounded-full border border-sky-600 bg-white px-3 py-1.5 text-xs font-semibold text-sky-600 shadow-sm hover:bg-sky-50"
          >
            📍 Lấy vị trí hiện tại
          </button>
        </div>
        
        {locationError && (
          <p className="text-xs text-red-600">{locationError}</p>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-xs font-medium text-slate-600">
            Hoặc nhập địa chỉ:
          </label>
          <AddressAutocomplete
            value={locationAddress}
            onChange={(addr, lat, lng) => {
              setLocationAddress(addr);
              setLocationLat(lat);
              setLocationLon(lng);
              if (lat && lng) {
                setUseLocation(true);
                setLocationError(null);
              }
            }}
            placeholder="Nhập địa chỉ để tìm kiếm..."
          />
        </div>

        {(useLocation && (locationLat || locationAddress)) && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-600">
              Khoảng cách:
            </label>
            <select
              value={distance}
              onChange={(e) => setDistance(e.target.value as DistanceOption)}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            >
              <option value="">-- Chọn khoảng cách --</option>
              {DISTANCE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {locationLat && locationLon && (
              <p className="text-xs text-slate-500">
                Vị trí: {locationLat.toFixed(6)}, {locationLon.toFixed(6)}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
        >
          Search jobs
        </button>
      </div>
    </form>
  );
}


