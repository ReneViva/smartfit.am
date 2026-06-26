import { randomUUID } from "node:crypto";

import "server-only";

import {
  deleteObject,
  downloadObject,
  normalizeObjectPrefix,
  ObjectStorageError,
  safeObjectKeySegment,
  uploadObject,
} from "./storage/object-storage";

const MAX_PROFILE_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const CUSTOMER_PROFILE_IMAGE_STORAGE_PREFIX = "customer-profile-images";
const ALLOWED_EXTENSIONS = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
]);
const ALLOWED_MIME_TYPES = new Set(ALLOWED_EXTENSIONS.values());

export type CustomerProfileImageErrorCode =
  | "configuration"
  | "delete-failed"
  | "download-failed"
  | "empty-file"
  | "file-size"
  | "file-type"
  | "provider"
  | "upload-failed";

export class CustomerProfileImageError extends Error {
  code: CustomerProfileImageErrorCode;

  constructor(code: CustomerProfileImageErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CustomerProfileImageError";
  }
}

type ProfileImageValidationResult =
  | {
      fileExtension: string;
      mimeType: string;
      ok: true;
      originalFileName: string;
      sizeBytes: number;
    }
  | {
      code: CustomerProfileImageErrorCode;
      message: string;
      ok: false;
    };

export type StoredCustomerProfileImage = {
  fileExtension: string;
  mimeType: string;
  originalFileName: string;
  sizeBytes: number;
  storageKey: string;
};

export type CustomerProfileImageDownload = {
  body: Uint8Array;
  mimeType: string;
  sizeBytes: number;
};

function normalizeProfileImageFileName(fileName: string) {
  const fallbackName = "customer-profile-photo";
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

function profileImageFileExtension(fileName: string) {
  const normalized = normalizeProfileImageFileName(fileName);
  const dotIndex = normalized.lastIndexOf(".");

  return dotIndex >= 0 ? normalized.slice(dotIndex).toLowerCase() : "";
}

function storageProvider() {
  const provider = process.env.STORAGE_PROVIDER?.trim().toLowerCase();

  if (provider === "r2") {
    return provider;
  }

  throw new CustomerProfileImageError(
    "provider",
    "Unsupported customer profile image storage provider.",
  );
}

function toProfileImageError(
  error: unknown,
  fallbackCode: "delete-failed" | "download-failed" | "upload-failed",
) {
  if (error instanceof CustomerProfileImageError) {
    return error;
  }

  if (error instanceof ObjectStorageError) {
    const code =
      error.code === "configuration" || error.code === "provider"
        ? error.code
        : fallbackCode;

    return new CustomerProfileImageError(code, error.message);
  }

  return new CustomerProfileImageError(
    fallbackCode,
    "Customer profile image storage operation failed.",
  );
}

function buildCustomerProfileImageStorageKey(
  customerId: string,
  originalFileName: string,
  fileExtension: string,
) {
  const prefix = normalizeObjectPrefix(CUSTOMER_PROFILE_IMAGE_STORAGE_PREFIX);
  const customerSegment = safeObjectKeySegment(customerId, "customer");
  const baseName = safeObjectKeySegment(
    originalFileName.replace(/\.[^.]+$/, ""),
    "profile-photo",
  );

  return `${prefix}/${customerSegment}/${Date.now()}-${randomUUID()}-${baseName}${fileExtension}`;
}

export function validateCustomerProfileImageFile(
  file: File,
): ProfileImageValidationResult {
  if (!(file instanceof File) || file.size <= 0) {
    return {
      code: "empty-file",
      message: "Choose a non-empty JPEG or PNG profile photo.",
      ok: false,
    };
  }

  if (file.size > MAX_PROFILE_IMAGE_SIZE_BYTES) {
    return {
      code: "file-size",
      message: "Customer profile photos must be 5 MB or smaller.",
      ok: false,
    };
  }

  const originalFileName = normalizeProfileImageFileName(file.name);
  const fileExtension = profileImageFileExtension(originalFileName);
  const mimeType = file.type.trim().toLowerCase();
  const expectedMimeType = ALLOWED_EXTENSIONS.get(fileExtension);

  if (
    !expectedMimeType ||
    !ALLOWED_MIME_TYPES.has(mimeType) ||
    mimeType !== expectedMimeType
  ) {
    return {
      code: "file-type",
      message: "Only JPEG and PNG profile photos are allowed.",
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

export function assertValidCustomerProfileImageFile(file: File) {
  const validation = validateCustomerProfileImageFile(file);

  if (!validation.ok) {
    throw new CustomerProfileImageError(
      validation.code,
      validation.message,
    );
  }

  return validation;
}

export async function uploadCustomerProfileImageToStorage(
  file: File,
  options: { customerId: string },
): Promise<StoredCustomerProfileImage> {
  const validation = assertValidCustomerProfileImageFile(file);
  const provider = storageProvider();
  const storageKey = buildCustomerProfileImageStorageKey(
    options.customerId,
    validation.originalFileName,
    validation.fileExtension,
  );

  if (provider === "r2") {
    try {
      const result = await uploadObject({
        access: "private",
        body: new Uint8Array(await file.arrayBuffer()),
        cacheControl: "private, no-store",
        contentType: validation.mimeType,
        key: storageKey,
      });

      return {
        fileExtension: validation.fileExtension,
        mimeType: validation.mimeType,
        originalFileName: validation.originalFileName,
        sizeBytes: validation.sizeBytes,
        storageKey: result.key,
      };
    } catch (error) {
      throw toProfileImageError(error, "upload-failed");
    }
  }

  throw new CustomerProfileImageError(
    "provider",
    "Unsupported customer profile image storage provider.",
  );
}

export async function deleteCustomerProfileImageFromStorage(
  storageKey: string | null,
) {
  if (!storageKey) {
    return;
  }

  if (storageProvider() === "r2") {
    try {
      await deleteObject(storageKey);
      return;
    } catch (error) {
      throw toProfileImageError(error, "delete-failed");
    }
  }

  throw new CustomerProfileImageError(
    "provider",
    "Unsupported customer profile image storage provider.",
  );
}

export async function downloadCustomerProfileImageFromStorage(
  storageKey: string,
): Promise<CustomerProfileImageDownload> {
  if (storageProvider() === "r2") {
    try {
      const result = await downloadObject(storageKey);
      const mimeType = result.contentType.split(";")[0]?.trim().toLowerCase();

      if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
        throw new CustomerProfileImageError(
          "download-failed",
          "Stored customer profile image is not a supported image type.",
        );
      }

      return {
        body: result.body,
        mimeType,
        sizeBytes: result.contentLength,
      };
    } catch (error) {
      throw toProfileImageError(error, "download-failed");
    }
  }

  throw new CustomerProfileImageError(
    "provider",
    "Unsupported customer profile image storage provider.",
  );
}
