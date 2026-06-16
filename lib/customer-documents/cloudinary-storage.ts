import { createHash } from "node:crypto";

import "server-only";

import { CustomerDocumentStorageError } from "./storage-error";

type CloudinaryDeliveryType = "authenticated" | "private";

type CloudinaryUploadOptions = {
  file: File;
  publicId: string;
};

type CloudinaryDeleteOptions = {
  deliveryType: string | null;
  publicId: string;
  resourceType: string | null;
};

type CloudinaryDownloadOptions = CloudinaryDeleteOptions & {
  fileExtension: string;
  format: string | null;
  ttlSeconds?: number;
};

type CloudinaryUploadResult = {
  bytes?: unknown;
  format?: unknown;
  public_id?: unknown;
  resource_type?: unknown;
  secure_url?: unknown;
  type?: unknown;
  version?: unknown;
};

type CloudinaryDestroyResult = {
  result?: unknown;
};

const DEFAULT_CUSTOMER_DOCUMENT_FOLDER = "smartfit/customer-documents";
const DEFAULT_DOWNLOAD_TTL_SECONDS = 5 * 60;

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const folder = (
    process.env.CUSTOMER_DOCUMENT_CLOUDINARY_FOLDER?.trim() ||
    DEFAULT_CUSTOMER_DOCUMENT_FOLDER
  ).replace(/^\/+|\/+$/g, "");
  const deliveryType =
    process.env.CUSTOMER_DOCUMENT_CLOUDINARY_DELIVERY_TYPE?.trim() ||
    "authenticated";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new CustomerDocumentStorageError(
      "configuration",
      "Cloudinary customer document storage is not configured.",
    );
  }

  if (deliveryType !== "authenticated" && deliveryType !== "private") {
    throw new CustomerDocumentStorageError(
      "configuration",
      "Customer document Cloudinary delivery type must be authenticated or private.",
    );
  }

  return {
    apiKey,
    apiSecret,
    cloudName,
    deliveryType: deliveryType as CloudinaryDeliveryType,
    folder,
  };
}

function signCloudinaryParams(
  params: Record<string, string>,
  apiSecret: string,
) {
  const payload = Object.entries(params)
    .filter(([, value]) => value !== "")
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");

  return createHash("sha1").update(`${payload}${apiSecret}`).digest("hex");
}

function setSignedFormParams(
  formData: FormData,
  params: Record<string, string>,
  apiKey: string,
  apiSecret: string,
) {
  for (const [key, value] of Object.entries(params)) {
    if (value) {
      formData.set(key, value);
    }
  }

  formData.set("api_key", apiKey);
  formData.set("signature", signCloudinaryParams(params, apiSecret));
}

function safeFormat(fileExtension: string, format: string | null) {
  return (format || fileExtension.replace(/^\./, "")).toLowerCase();
}

export async function uploadCustomerDocumentToCloudinary({
  file,
  publicId,
}: CloudinaryUploadOptions) {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const uploadParams = {
    folder: config.folder,
    overwrite: "false",
    public_id: publicId,
    timestamp,
    type: config.deliveryType,
  };
  const uploadData = new FormData();

  uploadData.set("file", file);
  setSignedFormParams(
    uploadData,
    uploadParams,
    config.apiKey,
    config.apiSecret,
  );

  let response: Response;

  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(
        config.cloudName,
      )}/auto/upload`,
      {
        body: uploadData,
        method: "POST",
      },
    );
  } catch {
    throw new CustomerDocumentStorageError(
      "upload-failed",
      "Cloudinary customer document upload failed.",
    );
  }

  if (!response.ok) {
    throw new CustomerDocumentStorageError(
      "upload-failed",
      "Cloudinary customer document upload failed.",
    );
  }

  const result = (await response.json()) as CloudinaryUploadResult;

  if (
    typeof result.public_id !== "string" ||
    typeof result.resource_type !== "string" ||
    result.type !== config.deliveryType
  ) {
    throw new CustomerDocumentStorageError(
      "upload-failed",
      "Cloudinary returned incomplete private document metadata.",
    );
  }

  return {
    storageDeliveryType: config.deliveryType,
    storageFolder: config.folder,
    storageFormat:
      typeof result.format === "string" ? result.format.toLowerCase() : null,
    storageKey: result.public_id,
    storagePublicId: result.public_id,
    storageResourceType: result.resource_type,
    storageVersion:
      typeof result.version === "number" ? result.version : null,
  };
}

export async function deleteCustomerDocumentFromCloudinary({
  deliveryType,
  publicId,
  resourceType,
}: CloudinaryDeleteOptions) {
  const config = getCloudinaryConfig();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const deleteParams = {
    invalidate: "true",
    public_id: publicId,
    timestamp,
    type: deliveryType || config.deliveryType,
  };
  const deleteData = new FormData();

  setSignedFormParams(
    deleteData,
    deleteParams,
    config.apiKey,
    config.apiSecret,
  );

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(
        config.cloudName,
      )}/${encodeURIComponent(resourceType || "image")}/destroy`,
      {
        body: deleteData,
        method: "POST",
      },
    );

    if (!response.ok) {
      throw new Error("Cloudinary destroy failed.");
    }

    const result = (await response.json()) as CloudinaryDestroyResult;

    if (result.result !== "ok" && result.result !== "not found") {
      throw new Error("Cloudinary destroy failed.");
    }
  } catch {
    throw new CustomerDocumentStorageError(
      "delete-failed",
      "Cloudinary customer document delete failed.",
    );
  }
}

export function createCloudinaryCustomerDocumentDownloadUrl({
  deliveryType,
  fileExtension,
  format,
  publicId,
  resourceType,
  ttlSeconds = DEFAULT_DOWNLOAD_TTL_SECONDS,
}: CloudinaryDownloadOptions) {
  const config = getCloudinaryConfig();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + Math.max(60, Math.min(ttlSeconds, 15 * 60));
  const params = {
    attachment: "true",
    expires_at: String(expiresAt),
    format: safeFormat(fileExtension, format),
    public_id: publicId,
    timestamp: String(now),
    type: deliveryType || config.deliveryType,
  };
  const signature = signCloudinaryParams(params, config.apiSecret);
  const query = new URLSearchParams({
    ...params,
    api_key: config.apiKey,
    signature,
  });

  return {
    expiresAt: new Date(expiresAt * 1000),
    url: `https://api.cloudinary.com/v1_1/${encodeURIComponent(
      config.cloudName,
    )}/${encodeURIComponent(resourceType || "image")}/download?${query.toString()}`,
  };
}
