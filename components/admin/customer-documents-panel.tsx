"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";

import {
  archiveCustomerDocumentUiAction,
  type CustomerDocumentUploadState,
  uploadCustomerDocumentUiAction,
} from "../../app/admin/customers/[customerId]/documents/actions";
import { Button } from "../ui/button";
import { StatusBadge } from "../ui/status-badge";

type CustomerDocumentView = {
  createdAt: string;
  fileExtension: string;
  id: string;
  label: string | null;
  mimeType: string;
  notes: string | null;
  originalFileName: string;
  sizeBytes: number;
  status: string;
  updatedAt: string;
  uploadedByName: string;
};

const initialUploadState: CustomerDocumentUploadState = {
  ok: false,
  submissionId: 0,
  values: {
    label: "",
    notes: "",
  },
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";
const downloadClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-neutral px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-neutral-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

function displayDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function displayFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayFileType(document: CustomerDocumentView) {
  const extension = document.fileExtension.replace(/^\./, "").toUpperCase();
  return extension || document.mimeType;
}

export function CustomerDocumentsPanel({
  customerId,
  documents,
}: {
  customerId: string;
  documents: CustomerDocumentView[];
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploadState, uploadAction, isUploading] = useActionState(
    uploadCustomerDocumentUiAction,
    initialUploadState,
  );
  const [archiveMessage, setArchiveMessage] = useState<string | null>(null);
  const [pendingArchiveId, setPendingArchiveId] = useState<string | null>(null);
  const [isArchiving, startArchiveTransition] = useTransition();

  useEffect(() => {
    if (uploadState.ok && uploadState.submissionId > 0) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [router, uploadState.ok, uploadState.submissionId]);

  function archiveDocument(document: CustomerDocumentView) {
    if (
      !window.confirm(
        `Archive ${document.originalFileName}? The document metadata will remain in the private admin record.`,
      )
    ) {
      return;
    }

    setArchiveMessage(null);
    setPendingArchiveId(document.id);
    startArchiveTransition(async () => {
      const result = await archiveCustomerDocumentUiAction(
        customerId,
        document.id,
      );
      setArchiveMessage(result.message);
      setPendingArchiveId(null);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <details
      className="scroll-mt-6 rounded-2xl border border-border bg-card shadow-sm open:border-brand"
      id="customer-documents"
      open={documents.length > 0}
    >
      <summary className="cursor-pointer list-none rounded-2xl p-5 transition-colors hover:bg-soft-blue sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand">
                Customer documents
              </p>
              <span className="rounded-full bg-soft-blue px-2.5 py-1 text-xs font-bold text-primary-active">
                {documents.length}
              </span>
            </div>
            <h3 className="mt-2 text-xl font-bold text-foreground">
              Private Admin-only files
            </h3>
            <p className="mt-1 text-sm text-secondary">
              Private Admin-only files such as contracts and doctor receipts.
            </p>
          </div>
          <span className="rounded-lg bg-neutral px-4 py-2 text-sm font-semibold text-foreground">
            Open documents / Upload
          </span>
        </div>
      </summary>

      <div className="animate-panel-in border-t border-border p-5 sm:p-6">
        <form
          action={uploadAction}
          className="rounded-xl border border-border bg-page p-4"
          encType="multipart/form-data"
          key={uploadState.submissionId}
          ref={formRef}
        >
          <input name="customerId" type="hidden" value={customerId} />

          {uploadState.formError ? (
            <p
              className="mb-4 rounded-lg border border-status-high bg-card px-3 py-2 text-sm font-semibold text-foreground"
              role="alert"
            >
              {uploadState.formError}
            </p>
          ) : null}
          {uploadState.message ? (
            <p className="mb-4 rounded-lg border border-status-low bg-card px-3 py-2 text-sm font-semibold text-foreground">
              {uploadState.message}
            </p>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(12rem,0.8fr)]">
            <label className={labelClass}>
              Document file
              <input
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                aria-describedby={
                  uploadState.fieldErrors?.file
                    ? "customer-document-file-error"
                    : "customer-document-file-hint"
                }
                aria-invalid={uploadState.fieldErrors?.file ? true : undefined}
                className={`${inputClass} file:mr-4 file:rounded-md file:border-0 file:bg-neutral file:px-3 file:py-2 file:text-sm file:font-semibold file:text-foreground`}
                name="file"
                required
                type="file"
              />
              {uploadState.fieldErrors?.file ? (
                <span
                  className="mt-2 block text-sm font-semibold text-button-danger"
                  id="customer-document-file-error"
                  role="alert"
                >
                  {uploadState.fieldErrors.file}
                </span>
              ) : (
                <span
                  className="mt-2 block text-xs leading-5 text-secondary"
                  id="customer-document-file-hint"
                >
                  PDF, JPG, JPEG, or PNG. Maximum 10 MB.
                </span>
              )}
            </label>

            <label className={labelClass}>
              Label / type
              <input
                className={inputClass}
                defaultValue={uploadState.values.label}
                maxLength={120}
                name="label"
                placeholder="Contract, Doctor Receipt, Other"
              />
            </label>

            <label className={`${labelClass} lg:col-span-2`}>
              Internal note
              <textarea
                className="mt-2 min-h-20 w-full resize-y rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue"
                defaultValue={uploadState.values.notes}
                maxLength={500}
                name="notes"
                placeholder="Optional short admin-only description"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs leading-5 text-secondary">
              Uploads are validated on the server and stored through the
              private document provider.
            </p>
            <Button disabled={isUploading} type="submit">
              {isUploading ? "Uploading..." : "Upload document"}
            </Button>
          </div>
        </form>

        {archiveMessage ? (
          <p
            className="mt-4 rounded-lg border border-border bg-page px-3 py-2 text-sm font-semibold text-foreground"
            role="status"
          >
            {archiveMessage}
          </p>
        ) : null}

        <div className="mt-5">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h4 className="text-lg font-bold text-foreground">
                Document list
              </h4>
              <p className="mt-1 text-sm text-secondary">
                Newest first. Archived documents stay in the private admin
                record.
              </p>
            </div>
            <span className="text-sm font-semibold text-secondary">
              {documents.length} total
            </span>
          </div>

          {documents.length ? (
            <div className="mt-4 space-y-3">
              {documents.map((document) => {
                const isArchived = document.status === "ARCHIVED";

                return (
                  <article
                    className="rounded-xl border border-border bg-page p-4"
                    key={document.id}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-foreground">
                          {document.originalFileName}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-primary-active">
                          {displayFileType(document)} -{" "}
                          {displayFileSize(document.sizeBytes)}
                        </p>
                      </div>
                      <StatusBadge
                        className="text-xs"
                        status={isArchived ? "notInGym" : "active"}
                      >
                        {isArchived ? "Archived" : "Active"}
                      </StatusBadge>
                    </div>

                    <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <dt className="font-semibold text-secondary">
                          Uploaded
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {displayDateTime(document.createdAt)}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-secondary">
                          Uploaded by
                        </dt>
                        <dd className="mt-1 text-foreground">
                          {document.uploadedByName}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-secondary">Label</dt>
                        <dd className="mt-1 text-foreground">
                          {document.label || "Not labeled"}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-semibold text-secondary">Type</dt>
                        <dd className="mt-1 text-foreground">
                          {document.mimeType}
                        </dd>
                      </div>
                    </dl>

                    {document.notes ? (
                      <p className="mt-4 whitespace-pre-wrap break-words rounded-lg border border-border bg-card px-3 py-2 text-sm leading-6 text-foreground">
                        {document.notes}
                      </p>
                    ) : null}

                    <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-border pt-4">
                      {isArchived ? null : (
                        <>
                          <Link
                            className={downloadClass}
                            href={`/admin/customers/${encodeURIComponent(customerId)}/documents/${encodeURIComponent(document.id)}/download`}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Download
                          </Link>
                          <Button
                            disabled={isArchiving}
                            onClick={() => archiveDocument(document)}
                            variant="danger"
                          >
                            {isArchiving && pendingArchiveId === document.id
                              ? "Archiving..."
                              : "Archive"}
                          </Button>
                        </>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-border bg-page px-5 py-8 text-center text-sm text-secondary">
              No customer documents have been uploaded yet.
            </p>
          )}
        </div>
      </div>
    </details>
  );
}
