"use client";

import { useEffect, useState } from "react";

type ImageInputProps = {
  className?: string;
  defaultValue?: string;
  label: string;
  name: string;
  uploadName: string;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";

export function ImageInput({
  className = "",
  defaultValue = "",
  label,
  name,
  uploadName,
}: ImageInputProps) {
  const [file, setFile] = useState<File | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [url, setUrl] = useState(defaultValue);

  useEffect(() => {
    if (!file) {
      setObjectUrl(null);
      return;
    }

    const nextObjectUrl = URL.createObjectURL(file);
    setObjectUrl(nextObjectUrl);

    return () => URL.revokeObjectURL(nextObjectUrl);
  }, [file]);

  const previewUrl = objectUrl ?? url.trim();

  useEffect(() => {
    setPreviewFailed(false);
  }, [previewUrl]);

  return (
    <fieldset className={`min-w-0 ${className}`}>
      <legend className="text-sm font-semibold text-foreground">{label}</legend>
      <div className="mt-2 grid gap-3">
        <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
          Paste image URL
          <input
            className={inputClass}
            name={name}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://..."
            type="url"
            value={url}
          />
        </label>
        <label className="block text-xs font-semibold uppercase tracking-wide text-secondary">
          Or upload from device
          <input
            accept="image/*"
            className={inputClass}
            name={uploadName}
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            type="file"
          />
        </label>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted">
        A selected file replaces the pasted URL. Maximum file size: 5 MB.
      </p>
      <div className="mt-3 overflow-hidden rounded-xl border border-border bg-page">
        {previewUrl && !previewFailed ? (
          <img
            alt={`${label} preview`}
            className="aspect-[16/7] w-full object-contain"
            onError={() => setPreviewFailed(true)}
            src={previewUrl}
          />
        ) : (
          <div className="flex aspect-[16/7] items-center justify-center px-4 text-center text-sm font-semibold text-secondary">
            {previewUrl
              ? "Image preview unavailable."
              : "Image preview will appear here."}
          </div>
        )}
      </div>
      {file ? (
        <p className="mt-2 break-all text-xs font-semibold text-secondary">
          Selected upload: {file.name}
        </p>
      ) : url.trim() ? (
        <p className="mt-2 break-all text-xs font-semibold text-secondary">
          Previewing saved or pasted image URL.
        </p>
      ) : null}
    </fieldset>
  );
}
