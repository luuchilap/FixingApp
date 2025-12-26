"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api/employer";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ApiError } from "@/lib/api/http";
import { SKILLS, type SkillValue } from "@/lib/constants/skills";
import { AddressAutocomplete } from "../../../components/jobs/AddressAutocomplete";

export default function NewJobPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [skill, setSkill] = useState<SkillValue | "">("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>("No file chosen");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (status === "authenticated" && user?.role !== "EMPLOYER") {
    return (
      <div className="mx-auto max-w-4xl py-8">
        <p className="text-sm text-slate-600">
          Only employers can post jobs. Please sign in as an employer.
        </p>
      </div>
    );
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price.toString());
      formData.append("address", address);
      if (latitude !== undefined) {
        formData.append("latitude", latitude.toString());
      }
      if (longitude !== undefined) {
        formData.append("longitude", longitude.toString());
      }
      if (skill) {
        formData.append("requiredSkill", skill);
      }
      
      if (selectedFile) {
        formData.append("images", selectedFile);
      }
      
      const job = await createJob(formData);
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      console.error("Error creating job:", err);
      
      // Better error handling
      let errorMessage = "Failed to create job. Please check inputs and try again.";
      
      if (err && typeof err === 'object' && 'status' in err) {
        const apiError = err as ApiError;
        errorMessage = apiError.message || errorMessage;
        
        // Add more context for specific error codes
        if (apiError.status === 400) {
          errorMessage = apiError.message || "Invalid input. Please check all fields and try again.";
        } else if (apiError.status === 401) {
          errorMessage = "Please log in to create a job.";
        } else if (apiError.status === 403) {
          errorMessage = "Only employers can create jobs.";
        } else if (apiError.status === 413) {
          errorMessage = "Image file is too large. Please use a smaller image.";
        } else if (apiError.status >= 500) {
          errorMessage = "Server error. Please try again later.";
        }
      } else if (err instanceof Error) {
        errorMessage = err.message || errorMessage;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl py-8">
      <h1 className="text-2xl font-semibold text-slate-900">Post a new job</h1>
      <p className="mt-2 text-sm text-slate-600">
        Provide details so workers can understand and apply.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm"
      >
        <label className="text-sm font-medium text-slate-700">
          Title*
          <input
            required
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Description*
          <textarea
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Price (đ)*
          <input
            required
            min={0}
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>

        <label className="text-sm font-medium text-slate-700">
          Address*
          <AddressAutocomplete
            value={address}
            onChange={(addr, lat, lng) => {
              setAddress(addr);
              setLatitude(lat);
              setLongitude(lng);
            }}
            placeholder="Nhập địa chỉ để tìm kiếm..."
            required
          />
          {latitude && longitude && (
            <p className="mt-1 text-xs text-slate-500">
              ✓ Đã xác định vị trí: {latitude.toFixed(6)}, {longitude.toFixed(6)}
            </p>
          )}
        </label>

      <label className="text-sm font-medium text-slate-700">
        Upload image
        <div className="mt-1 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setFileName("No file chosen");
                setSelectedFile(null);
                setPreviewUrl(null);
                return;
              }

              // Validate file size (10MB)
              const MAX_SIZE = 10 * 1024 * 1024;
              if (file.size > MAX_SIZE) {
                setError(`File size too large. Maximum size is 10MB.`);
                setFileName("No file chosen");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
                return;
              }

              setFileName(file.name);
              setSelectedFile(file);
              setError(null);

              // Set preview
              const reader = new FileReader();
              reader.onload = (e) => {
                setPreviewUrl(e.target?.result as string);
              };
              reader.readAsDataURL(file);
            }}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-800 hover:border-sky-500 hover:text-sky-700"
          >
            Choose file
          </button>
          <span className="text-xs text-slate-600">{fileName}</span>
        </div>
        <span className="text-xs text-slate-500">
          Chọn ảnh để tải lên (tối đa 10MB); nếu không chọn sẽ dùng ảnh placeholder.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <div className="h-20 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
              No image
            </div>
          )}
        </div>
        <p className="text-xs text-slate-600">
          Ảnh sẽ được tải lên AWS S3 và lưu URL vào database.
        </p>
      </div>

        <label className="text-sm font-medium text-slate-700">
          Required skill
          <select
            value={skill}
            onChange={(e) => setSkill(e.target.value as SkillValue | "")}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="">-- Chọn skill --</option>
            {SKILLS.map((skillOption) => (
              <option key={skillOption.value} value={skillOption.value}>
                {skillOption.label}
              </option>
            ))}
          </select>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-60"
        >
          {submitting ? "Posting..." : "Post job"}
        </button>
      </form>
    </div>
  );
}


