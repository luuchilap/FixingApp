"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api/employer";
import { useAuth } from "@/lib/hooks/useAuth";
import type { ApiError } from "@/lib/api/http";
import { SKILLS, type SkillValue } from "@/lib/constants/skills";

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Compress and resize image
function compressImage(file: File, maxWidth: number = 1920, maxHeight: number = 1920, quality: number = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Could not get canvas context"));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export default function NewJobPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [address, setAddress] = useState("");
  const [skill, setSkill] = useState<SkillValue | "">("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("/img_placeholder.jpg");
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
      // Backend expects images as array of strings (URLs), not objects
      const images = imageDataUrl ? [imageDataUrl] : ["/img_placeholder.jpg"];
      
      // Log payload size for debugging (without logging the full base64 string)
      const payload = {
        title,
        description,
        price,
        address,
        requiredSkill: skill || null,
        images,
      };
      
      if (imageDataUrl) {
        const imageSize = imageDataUrl.length;
        const imageSizeKB = Math.ceil(imageSize / 1024);
        const imageSizeMB = (imageSizeKB / 1024).toFixed(2);
        console.log(`Image size: ${imageSizeKB} KB (${imageSizeMB} MB) - base64 string length`);
        
        // Increased limit to 15MB to match backend
        const maxSize = 15 * 1024 * 1024; // 15MB
        if (imageSize > maxSize) {
          setError(`Image is too large (${imageSizeMB} MB). Maximum size is 15MB. Please use a smaller image.`);
          setSubmitting(false);
          return;
        }
      }
      
      const job = await createJob(payload);
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
          <input
            required
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </label>

      <label className="text-sm font-medium text-slate-700">
        Upload image
        <div className="mt-1 flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) {
                setFileName("No file chosen");
                setImageDataUrl(null);
                setPreviewUrl("/img_placeholder.jpg");
                return;
              }

              // Validate file size
              if (file.size > MAX_FILE_SIZE) {
                setError(`File size too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
                setFileName("No file chosen");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
                return;
              }

              setFileName(file.name);
              setError(null);

              try {
                // Compress and resize image before converting to base64
                const compressedDataUrl = await compressImage(file);
                setImageDataUrl(compressedDataUrl);
                setPreviewUrl(compressedDataUrl);
              } catch (err) {
                console.error("Error processing image:", err);
                setError("Failed to process image. Please try another file.");
                setFileName("No file chosen");
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }
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
          Chọn ảnh để tải lên (tối đa {MAX_FILE_SIZE / (1024 * 1024)}MB, sẽ tự động nén và resize); nếu không chọn sẽ dùng ảnh placeholder.
        </span>
      </label>
      <div className="flex items-center gap-3">
        <div className="h-20 w-20 overflow-hidden rounded-md border border-slate-200 bg-slate-50">
          <img
            src={previewUrl}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        </div>
        <p className="text-xs text-slate-600">
          Ảnh sẽ được gửi kèm trong payload (images.url); backend cần lưu trữ/ghi đè nếu muốn.
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


