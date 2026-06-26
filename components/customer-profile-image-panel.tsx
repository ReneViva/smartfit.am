"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

import {
  updateCustomerProfileImageAction,
  type CustomerProfileImageState,
} from "../app/customer-profile-image/actions";
import { Button } from "./ui/button";

const initialState: CustomerProfileImageState = {
  ok: false,
  submissionId: 0,
};

function initials(name: string) {
  const parts = name
    .split(/\s+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    parts
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SF"
  );
}

function profileImageSrc(customerId: string, version: string) {
  const params = new URLSearchParams({ v: version });

  return `/api/internal/customer-profile-image/${encodeURIComponent(customerId)}?${params.toString()}`;
}

export function CustomerProfileImagePanel({
  customerId,
  customerName,
  hasProfileImage,
  mode = "admin",
  version,
}: {
  customerId: string;
  customerName: string;
  hasProfileImage: boolean;
  mode?: "admin" | "registration";
  version: string;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [state, formAction, isPending] = useActionState(
    updateCustomerProfileImageAction,
    initialState,
  );
  const compact = mode === "registration";
  const avatarSize = compact ? "h-24 w-24" : "h-28 w-28";

  useEffect(() => {
    if (state.submissionId > 0) {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (state.ok) {
        router.refresh();
      }
    }
  }, [router, state.ok, state.submissionId]);

  return (
    <div
      className={`flex min-w-0 gap-4 ${compact ? "flex-col" : "flex-col sm:flex-row sm:items-start"}`}
    >
      <div
        className={`${avatarSize} shrink-0 overflow-hidden rounded-full border border-border bg-card shadow-sm`}
      >
        {hasProfileImage ? (
          <img
            alt={`${customerName} profile photo`}
            className="h-full w-full object-cover"
            src={profileImageSrc(customerId, version)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-brand text-3xl font-bold text-white">
            {initials(customerName)}
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <form
          action={formAction}
          className="grid gap-3"
        >
          <input name="customerId" type="hidden" value={customerId} />
          <label className="block text-sm font-semibold text-foreground">
            Profile photo
            <input
              accept="image/jpeg,image/png,.jpg,.jpeg,.png"
              aria-describedby={
                state.fieldErrors?.file
                  ? "profile-photo-file-error"
                  : "profile-photo-file-hint"
              }
              aria-invalid={state.fieldErrors?.file ? true : undefined}
              className="mt-2 block min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-neutral file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-foreground hover:file:bg-neutral-hover"
              disabled={isPending}
              name="profileImage"
              ref={fileInputRef}
              type="file"
            />
          </label>
          {state.fieldErrors?.file ? (
            <p
              className="text-sm font-semibold text-button-danger"
              id="profile-photo-file-error"
              role="alert"
            >
              {state.fieldErrors.file}
            </p>
          ) : (
            <p className="text-sm text-secondary" id="profile-photo-file-hint">
              JPEG or PNG, up to 5 MB.
            </p>
          )}
          {state.formError ? (
            <p
              className="rounded-lg border border-status-high bg-page px-3 py-2 text-sm font-semibold text-foreground"
              role="alert"
            >
              {state.formError}
            </p>
          ) : null}
          {state.message ? (
            <p className="rounded-lg border border-status-low bg-page px-3 py-2 text-sm font-semibold text-foreground">
              {state.message}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <Button disabled={isPending} type="submit">
              {isPending ? "Saving..." : hasProfileImage ? "Change photo" : "Upload photo"}
            </Button>
          </div>
        </form>

        {hasProfileImage ? (
          <form action={formAction} className="mt-3">
            <input name="customerId" type="hidden" value={customerId} />
            <input name="removeProfileImage" type="hidden" value="1" />
            <Button disabled={isPending} type="submit" variant="neutral">
              Remove photo
            </Button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
