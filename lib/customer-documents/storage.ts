import { randomUUID } from "node:crypto";

import "server-only";

import {
  createCloudinaryCustomerDocumentDownloadUrl,
  deleteCustomerDocumentFromCloudinary,
  uploadCustomerDocumentToCloudinary,
} from "./cloudinary-storage";
import { CustomerDocumentStorageError } from "./storage-error";
import { assertValidCustomerDocumentFile } from "./validation";

export type CustomerDocumentStorageProvider = "cloudinary";

export type CustomerDocumentStorageReference = {
  fileExtension: string;
  storageDeliveryType: string | null;
  storageFormat: string | null;
  storageKey: string;
  storageProvider: string;
  storagePublicId: string | null;
  storageResourceType: string | null;
};

export type StoredCustomerDocument = CustomerDocumentStorageReference & {
  mimeType: string;
  originalFileName: string;
  sizeBytes: number;
  storageFolder: string | null;
  storedFileName: string;
};

function safeStorageSegment(value: string) {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function getCustomerDocumentStorageProvider(): CustomerDocumentStorageProvider {
  const provider =
    process.env.CUSTOMER_DOCUMENT_STORAGE_PROVIDER?.trim().toLowerCase() ||
    "cloudinary";

  if (provider === "cloudinary") {
    return provider;
  }

  throw new CustomerDocumentStorageError(
    "provider",
    "Unsupported customer document storage provider.",
  );
}

export function buildCustomerDocumentStorageKey(
  customerId: string,
  originalFileName: string,
) {
  const baseName =
    safeStorageSegment(originalFileName.replace(/\.[^.]+$/, "")) || "document";
  const customerSegment = safeStorageSegment(customerId) || "customer";

  return `${customerSegment}/${Date.now()}-${randomUUID()}-${baseName}`;
}

export async function uploadCustomerDocumentToStorage(
  file: File,
  options: { customerId: string },
): Promise<StoredCustomerDocument> {
  const validation = assertValidCustomerDocumentFile(file);
  const provider = getCustomerDocumentStorageProvider();
  const storedFileName = buildCustomerDocumentStorageKey(
    options.customerId,
    validation.originalFileName,
  );

  if (provider === "cloudinary") {
    const result = await uploadCustomerDocumentToCloudinary({
      file,
      publicId: storedFileName,
    });

    return {
      fileExtension: validation.fileExtension,
      mimeType: validation.mimeType,
      originalFileName: validation.originalFileName,
      sizeBytes: validation.sizeBytes,
      storageDeliveryType: result.storageDeliveryType,
      storageFolder: result.storageFolder,
      storageFormat: result.storageFormat,
      storageKey: result.storageKey,
      storageProvider: provider,
      storagePublicId: result.storagePublicId,
      storageResourceType: result.storageResourceType,
      storedFileName,
    };
  }

  throw new CustomerDocumentStorageError(
    "provider",
    "Unsupported customer document storage provider.",
  );
}

export async function deleteCustomerDocumentFromStorage(
  document: CustomerDocumentStorageReference,
) {
  if (document.storageProvider === "cloudinary") {
    await deleteCustomerDocumentFromCloudinary({
      deliveryType: document.storageDeliveryType,
      publicId: document.storagePublicId ?? document.storageKey,
      resourceType: document.storageResourceType,
    });
    return;
  }

  throw new CustomerDocumentStorageError(
    "provider",
    "Unsupported customer document storage provider.",
  );
}

export function createCustomerDocumentDownloadUrl(
  document: CustomerDocumentStorageReference,
  options: { ttlSeconds?: number } = {},
) {
  if (document.storageProvider === "cloudinary") {
    return createCloudinaryCustomerDocumentDownloadUrl({
      deliveryType: document.storageDeliveryType,
      fileExtension: document.fileExtension,
      format: document.storageFormat,
      publicId: document.storagePublicId ?? document.storageKey,
      resourceType: document.storageResourceType,
      ttlSeconds: options.ttlSeconds,
    });
  }

  throw new CustomerDocumentStorageError(
    "provider",
    "Unsupported customer document storage provider.",
  );
}
