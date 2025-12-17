"use client";

import { FormEvent, useState, useRef, useEffect } from "react";

interface MessageInputProps {
  onSend: (content: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({
  onSend,
  disabled = false,
  placeholder = "Nhập tin nhắn...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [content]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmedContent = content.trim();
    if (trimmedContent && !disabled) {
      onSend(trimmedContent);
      setContent("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex items-end gap-2 border-t border-slate-200 bg-white p-4"
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-sky-500 focus:outline-none focus:ring-1 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-500"
        style={{ maxHeight: "120px", minHeight: "40px" }}
      />
      <button
        type="submit"
        disabled={!content.trim() || disabled}
        className="flex-shrink-0 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
      >
        Gửi
      </button>
    </form>
  );
}

