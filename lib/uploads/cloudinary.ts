import { createHash } from "node:crypto";

import "server-only";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

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

export async function uploadImageFromForm(
  formData: FormData,
  fieldName: string,
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

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();
  const folder =
    process.env.CLOUDINARY_UPLOAD_FOLDER?.trim() || "smartfit-am";

  if (!cloudName || !apiKey || !apiSecret) {
    throw new ImageUploadError(
      "configuration",
      "Cloudinary upload is not configured.",
    );
  }

  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = createHash("sha1")
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest("hex");
  const uploadData = new FormData();

  uploadData.set("api_key", apiKey);
  uploadData.set("file", image);
  uploadData.set("folder", folder);
  uploadData.set("signature", signature);
  uploadData.set("timestamp", timestamp);

  let response: Response;

  try {
    response = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      {
        body: uploadData,
        method: "POST",
      },
    );
  } catch {
    throw new ImageUploadError("failed", "Cloudinary upload failed.");
  }

  if (!response.ok) {
    throw new ImageUploadError("failed", "Cloudinary upload failed.");
  }

  const result = (await response.json()) as { secure_url?: unknown };

  if (typeof result.secure_url !== "string" || !result.secure_url) {
    throw new ImageUploadError("failed", "Cloudinary returned no image URL.");
  }

  return result.secure_url;
}
