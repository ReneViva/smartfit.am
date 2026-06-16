"use client";

import { useEffect, useState } from "react";

type CoachPhotoProps = {
  className?: string;
  fallbackClassName?: string;
  name: string;
  photoUrl: string | null;
};

export function CoachPhoto({
  className = "",
  fallbackClassName = "",
  name,
  photoUrl,
}: CoachPhotoProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [photoUrl]);

  if (photoUrl && !failed) {
    return (
      <img
        alt={name}
        className={`aspect-[4/3] w-full object-cover ${className}`}
        onError={() => setFailed(true)}
        src={photoUrl}
      />
    );
  }

  return (
    <div
      aria-label={`${name} photo unavailable`}
      className={`flex aspect-[4/3] items-center justify-center bg-logo-surface p-10 ${fallbackClassName}`}
      role="img"
    >
      <img
        alt=""
        aria-hidden="true"
        className="h-full max-h-28 w-full object-contain"
        src="/logo/S.svg"
      />
    </div>
  );
}
