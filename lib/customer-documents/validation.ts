import "server-only";

const MAX_DOCUMENT_SIZE_MB = 10;
const BYTES_PER_MB = 1024 * 1024;
const SAFE_ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);
const ALLOWED_EXTENSIONS = new Map([
  [".pdf", "application/pdf"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
]);
const BLOCKED_EXTENSIONS = new Set([
  ".app",
  ".bat",
  ".cmd",
  ".com",
  ".dll",
  ".exe",
  ".html",
  ".hta",
  ".jar",
  ".js",
  ".jsx",
  ".msi",
  ".php",
  ".ps1",
  ".scr",
  ".sh",
  ".svg",
  ".ts",
  ".tsx",
  ".vbs",
]);

export type CustomerDocumentValidationErrorCode =
  | "empty-file"
  | "file-size"
  | "file-type"
  | "filename";

export type CustomerDocumentValidationResult =
  | {
      ok: true;
      fileExtension: string;
      mimeType: string;
      originalFileName: string;
      sizeBytes: number;
    }
  | {
      code: CustomerDocumentValidationErrorCode;
      message: string;
      ok: false;
    };

export class CustomerDocumentValidationError extends Error {
  code: CustomerDocumentValidationErrorCode;

  constructor(code: CustomerDocumentValidationErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CustomerDocumentValidationError";
  }
}

export function getCustomerDocumentMaxFileSizeBytes() {
  const configured = Number(process.env.CUSTOMER_DOCUMENT_MAX_FILE_SIZE_MB);
  const maxMb =
    Number.isFinite(configured) && configured > 0
      ? Math.min(configured, MAX_DOCUMENT_SIZE_MB)
      : MAX_DOCUMENT_SIZE_MB;

  return Math.floor(maxMb * BYTES_PER_MB);
}

export function getCustomerDocumentAllowedMimeTypes() {
  const configured = process.env.CUSTOMER_DOCUMENT_ALLOWED_MIME_TYPES;

  if (!configured) {
    return [...SAFE_ALLOWED_MIME_TYPES];
  }

  const safeValues = configured
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => SAFE_ALLOWED_MIME_TYPES.has(value));

  return safeValues.length ? Array.from(new Set(safeValues)) : [...SAFE_ALLOWED_MIME_TYPES];
}

export function normalizeCustomerDocumentFileName(fileName: string) {
  const fallbackName = "customer-document";
  const lastSegment =
    fileName
      .normalize("NFKC")
      .split(/[\\/]/)
      .pop()
      ?.trim() || fallbackName;
  const cleaned = lastSegment
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>:"/\\|?*]+/g, "-")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "")
    .trim()
    .slice(0, 180);

  return cleaned || fallbackName;
}

export function getCustomerDocumentFileExtension(fileName: string) {
  const normalized = normalizeCustomerDocumentFileName(fileName);
  const dotIndex = normalized.lastIndexOf(".");

  return dotIndex >= 0 ? normalized.slice(dotIndex).toLowerCase() : "";
}

function hasBlockedExecutableSegment(fileName: string) {
  const segments = normalizeCustomerDocumentFileName(fileName)
    .toLowerCase()
    .split(".");

  return segments
    .slice(0, -1)
    .some((segment) => BLOCKED_EXTENSIONS.has(`.${segment}`));
}

export function validateCustomerDocumentFile(
  file: File,
): CustomerDocumentValidationResult {
  if (!(file instanceof File) || file.size <= 0) {
    return {
      code: "empty-file",
      message: "Choose a non-empty document file.",
      ok: false,
    };
  }

  if (file.size > getCustomerDocumentMaxFileSizeBytes()) {
    return {
      code: "file-size",
      message: "Customer documents must be 10 MB or smaller.",
      ok: false,
    };
  }

  const originalFileName = normalizeCustomerDocumentFileName(file.name);
  const fileExtension = getCustomerDocumentFileExtension(originalFileName);
  const mimeType = file.type.trim().toLowerCase();
  const configuredMimeTypes = new Set(getCustomerDocumentAllowedMimeTypes());
  const expectedMimeType = ALLOWED_EXTENSIONS.get(fileExtension);

  if (hasBlockedExecutableSegment(originalFileName)) {
    return {
      code: "filename",
      message: "Executable or script-like filenames are not allowed.",
      ok: false,
    };
  }

  if (!expectedMimeType) {
    return {
      code: "file-type",
      message: "Only PDF, JPG, JPEG, and PNG files are allowed.",
      ok: false,
    };
  }

  if (!configuredMimeTypes.has(mimeType) || mimeType !== expectedMimeType) {
    return {
      code: "file-type",
      message: "The document MIME type does not match an allowed file type.",
      ok: false,
    };
  }

  return {
    fileExtension,
    mimeType,
    ok: true,
    originalFileName,
    sizeBytes: file.size,
  };
}

export function assertValidCustomerDocumentFile(file: File) {
  const validation = validateCustomerDocumentFile(file);

  if (!validation.ok) {
    throw new CustomerDocumentValidationError(
      validation.code,
      validation.message,
    );
  }

  return validation;
}
