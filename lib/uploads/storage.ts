import { randomUUID } from "node:crypto";

import "server-only";

import {
  normalizeObjectPrefix,
  ObjectStorageError,
  safeObjectKeySegment,
  uploadObject,
} from "../storage/object-storage";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Map([
  ["image/avif", ".avif"],
  ["image/gif", ".gif"],
  ["image/jpeg", ".jpg"],
  ["image/png", ".png"],
  ["image/svg+xml", ".svg"],
  ["image/webp", ".webp"],
]);

export type ImageUploadErrorCode =
  | "configuration"
  | "failed"
  | "file-size"
  | "file-type";

export class ImageUploadError extends Error {
  code: ImageUploadErrorCode;

  constructor(code: ImageUploadErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ImageUploadError";
  }
}

export function imageUploadErrorCode(error: unknown): ImageUploadErrorCode {
  return error instanceof ImageUploadError ? error.code : "failed";
}

function imageExtension(file: File) {
  const normalizedName = file.name.normalize("NFKC").trim().toLowerCase();
  const extension = normalizedName.match(/\.[a-z0-9]{2,10}$/)?.[0];

  return extension ?? IMAGE_EXTENSIONS.get(file.type.toLowerCase()) ?? ".img";
}

function buildImageObjectKey(file: File, prefix: string) {
  const objectPrefix = normalizeObjectPrefix(prefix) || "images";
  const baseName = safeObjectKeySegment(file.name, "image");

  return `${objectPrefix}/${Date.now()}-${randomUUID()}-${baseName}${imageExtension(file)}`;
}

export async function uploadImageFromForm(
  formData: FormData,
  fieldName: string,
  options: { prefix?: string } = {},
) {
  const image = formData.get(fieldName);

  if (!(image instanceof File) || image.size === 0) {
    return null;
  }

  if (!image.type.startsWith("image/")) {
    throw new ImageUploadError("file-type", "Only image files can be uploaded.");
  }

  if (image.size > MAX_IMAGE_SIZE_BYTES) {
    throw new ImageUploadError(
      "file-size",
      "Image files must be 5 MB or smaller.",
    );
  }

  try {
    const uploaded = await uploadObject({
      access: "public",
      body: new Uint8Array(await image.arrayBuffer()),
      cacheControl: "public, max-age=31536000, immutable",
      contentType: image.type || "application/octet-stream",
      key: buildImageObjectKey(image, options.prefix ?? "images"),
    });

    if (!uploaded.publicUrl) {
      throw new ObjectStorageError(
        "configuration",
        "Public object storage URL is not configured.",
      );
    }

    return uploaded.publicUrl;
  } catch (error) {
    if (
      error instanceof ObjectStorageError &&
      (error.code === "configuration" || error.code === "provider")
    ) {
      throw new ImageUploadError(
        "configuration",
        "Image upload storage is not configured.",
      );
    }

    throw new ImageUploadError("failed", "Image upload failed.");
  }
}
