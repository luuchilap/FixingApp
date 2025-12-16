"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createJob } from "@/lib/api/employer";
import { useAuth } from "@/lib/hooks/useAuth";

export default function NewJobPage() {
  const router = useRouter();
  const { user, status } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [address, setAddress] = useState("");
  const [skill, setSkill] = useState("");
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
      const job = await createJob({
        title,
        description,
        price,
        address,
        requiredSkill: skill || null,
        images: [
          {
            type: "IMAGE",
            url: imageDataUrl ?? "/img_placeholder.jpg",
          },
        ],
      });
      router.push(`/jobs/${job.id}`);
    } catch (err) {
      setError("Failed to create job. Please check inputs and try again.");
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
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              setFileName(file.name);
              const reader = new FileReader();
              reader.onload = (ev) => {
                const result = ev.target?.result;
                if (typeof result === "string") {
                  setImageDataUrl(result);
                  setPreviewUrl(result);
                }
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
          Chọn ảnh để tải lên (sẽ nhúng base64 vào payload); nếu không chọn sẽ dùng ảnh placeholder.
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
          <input
            type="text"
            value={skill}
            onChange={(e) => setSkill(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
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


