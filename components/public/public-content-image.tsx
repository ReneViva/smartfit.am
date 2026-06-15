"use client";

import { useEffect, useState } from "react";

export function PublicContentImage({
  alt,
  className = "",
  eager = false,
  fit = "auto",
  src,
}: {
  alt: string;
  className?: string;
  eager?: boolean;
  fit?: "auto" | "contain" | "cover";
  src: string;
}) {
  const [failed, setFailed] = useState(false);
  const isSvg = /\.svg(?:$|[?#])/i.test(src);
  const isLogoLike = /(?:^|[\/_.-])logo(?:[\/_.-]|$)/i.test(src);
  const resolvedFit =
    fit === "auto" ? (isSvg || isLogoLike ? "contain" : "cover") : fit;
  const fitClass =
    resolvedFit === "contain"
      ? "bg-logo-surface object-contain p-6 sm:p-8"
      : "bg-soft-blue object-cover object-center";

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed) {
    return (
      <div
        aria-label={`${alt} image unavailable`}
        className={`flex items-center justify-center bg-soft-blue px-5 py-8 text-center text-sm font-semibold text-primary-active ${className}`}
        role="img"
      >
        Image unavailable
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={`${fitClass} ${className}`}
      loading={eager ? "eager" : "lazy"}
      onError={() => setFailed(true)}
      src={src}
    />
  );
}
