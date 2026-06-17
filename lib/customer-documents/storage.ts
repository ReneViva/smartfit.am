import { randomUUID } from "node:crypto";

import "server-only";

import {
  deleteObject,
  downloadObject,
  normalizeObjectPrefix,
  ObjectStorageError,
  safeObjectKeySegment,
  uploadObject,
} from "../storage/object-storage";
import { CustomerDocumentStorageError } from "./storage-error";
import { assertValidCustomerDocumentFile } from "./validation";

export type CustomerDocumentStorageProvider = "r2";

export type CustomerDocumentStorageReference = {
  fileExtension: string;
  storageDeliveryType: string | null;
  storageFormat: string | null;
  storageKey: string;
  storageProvider: string;
  storagePublicId: string | null;
  storageResourceType: string | null;
};

export type CustomerDocumentDownloadReference =
  CustomerDocumentStorageReference & {
    mimeType: string;
    originalFileName: string;
    sizeBytes: number;
  };

export type CustomerDocumentDownload = {
  body: Uint8Array;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
};

export type StoredCustomerDocument = CustomerDocumentStorageReference & {
  mimeType: string;
  originalFileName: string;
  sizeBytes: number;
  storageFolder: string | null;
  storedFileName: string;
};

const CUSTOMER_DOCUMENT_STORAGE_PREFIX = "customer-documents";

function toCustomerDocumentStorageError(
  error: unknown,
  fallbackCode: "delete-failed" | "download-failed" | "upload-failed",
) {
  if (error instanceof CustomerDocumentStorageError) {
    return error;
  }

  if (error instanceof ObjectStorageError) {
    const code =
      error.code === "configuration" || error.code === "provider"
        ? error.code
        : fallbackCode;

    return new CustomerDocumentStorageError(code, error.message);
  }

  return new CustomerDocumentStorageError(
    fallbackCode,
    "Customer document storage operation failed.",
  );
}

export function getCustomerDocumentStorageProvider(): CustomerDocumentStorageProvider {
  const provider = process.env.STORAGE_PROVIDER?.trim().toLowerCase();

  if (provider === "r2") {
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
  fileExtension: string,
) {
  const baseName = safeObjectKeySegment(
    originalFileName.replace(/\.[^.]+$/, ""),
    "document",
  );
  const customerSegment = safeObjectKeySegment(customerId, "customer");
  const prefix = normalizeObjectPrefix(CUSTOMER_DOCUMENT_STORAGE_PREFIX);

  return `${prefix}/${customerSegment}/${Date.now()}-${randomUUID()}-${baseName}${fileExtension}`;
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
    validation.fileExtension,
  );

  if (provider === "r2") {
    try {
      const result = await uploadObject({
        access: "private",
        body: new Uint8Array(await file.arrayBuffer()),
        cacheControl: "private, no-store",
        contentType: validation.mimeType,
        key: storedFileName,
      });

      return {
        fileExtension: validation.fileExtension,
        mimeType: validation.mimeType,
        originalFileName: validation.originalFileName,
        sizeBytes: validation.sizeBytes,
        storageDeliveryType: "private",
        storageFolder: CUSTOMER_DOCUMENT_STORAGE_PREFIX,
        storageFormat: validation.fileExtension.replace(/^\./, ""),
        storageKey: result.key,
        storageProvider: provider,
        storagePublicId: null,
        storageResourceType: null,
        storedFileName,
      };
    } catch (error) {
      throw toCustomerDocumentStorageError(error, "upload-failed");
    }
  }

  throw new CustomerDocumentStorageError(
    "provider",
    "Unsupported customer document storage provider.",
  );
}

export async function deleteCustomerDocumentFromStorage(
  document: CustomerDocumentStorageReference,
) {
  if (document.storageProvider === "r2") {
    try {
      await deleteObject(document.storageKey);
    } catch (error) {
      throw toCustomerDocumentStorageError(error, "delete-failed");
    }

    return;
  }

  throw new CustomerDocumentStorageError(
    "provider",
    "Unsupported customer document storage provider.",
  );
}

export async function downloadCustomerDocumentFromStorage(
  document: CustomerDocumentDownloadReference,
): Promise<CustomerDocumentDownload> {
  if (document.storageProvider === "r2") {
    try {
      const result = await downloadObject(document.storageKey);

      return {
        body: result.body,
        fileName: document.originalFileName,
        mimeType: document.mimeType || result.contentType,
        sizeBytes: document.sizeBytes || result.contentLength,
      };
    } catch (error) {
      throw toCustomerDocumentStorageError(error, "download-failed");
    }
  }

  throw new CustomerDocumentStorageError(
    "provider",
    "Unsupported customer document storage provider.",
  );
}
