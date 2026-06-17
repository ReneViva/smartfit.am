import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import "server-only";

export type ObjectStorageErrorCode =
  | "configuration"
  | "delete-failed"
  | "download-failed"
  | "provider"
  | "upload-failed";

export class ObjectStorageError extends Error {
  code: ObjectStorageErrorCode;

  constructor(code: ObjectStorageErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "ObjectStorageError";
  }
}

type ObjectAccess = "private" | "public";

type ObjectStorageConfig = {
  bucketName: string;
  endpoint: string;
  publicBaseUrl: string | null;
  region: string;
};

type UploadObjectOptions = {
  access: ObjectAccess;
  body: Uint8Array;
  cacheControl?: string;
  contentType: string;
  key: string;
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ObjectStorageError(
      "configuration",
      "Object storage is not configured.",
    );
  }

  return value;
}

function normalizeBaseUrl(value: string | undefined) {
  const baseUrl = value?.trim().replace(/\/+$/g, "");

  if (!baseUrl) {
    return null;
  }

  try {
    const url = new URL(baseUrl);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    return url.toString().replace(/\/+$/g, "");
  } catch {
    return null;
  }
}

function getObjectStorageConfig(options: { requirePublicUrl: boolean }) {
  const provider = process.env.STORAGE_PROVIDER?.trim().toLowerCase();

  if (provider !== "r2") {
    throw new ObjectStorageError(
      "provider",
      "Unsupported object storage provider.",
    );
  }

  const config: ObjectStorageConfig = {
    bucketName: requiredEnv("CLOUD_NAME"),
    endpoint: requiredEnv("STORAGE_ENDPOINT"),
    publicBaseUrl: normalizeBaseUrl(process.env.STORAGE_PUBLIC_BASE_URL),
    region: requiredEnv("STORAGE_REGION"),
  };

  try {
    const endpointUrl = new URL(config.endpoint);

    if (
      endpointUrl.protocol !== "http:" &&
      endpointUrl.protocol !== "https:"
    ) {
      throw new Error("Invalid endpoint protocol.");
    }
  } catch {
    throw new ObjectStorageError(
      "configuration",
      "Object storage endpoint is not valid.",
    );
  }

  if (options.requirePublicUrl && !config.publicBaseUrl) {
    throw new ObjectStorageError(
      "configuration",
      "Public object storage URL is not configured.",
    );
  }

  return config;
}

function createObjectStorageClient(config: ObjectStorageConfig) {
  return new S3Client({
    credentials: {
      accessKeyId: requiredEnv("ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("SECRET_ACCESS_KEY"),
    },
    endpoint: config.endpoint,
    forcePathStyle: true,
    region: config.region,
  });
}

function publicObjectUrl(baseUrl: string, key: string) {
  const encodedKey = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");

  return `${baseUrl}/${encodedKey}`;
}

export function safeObjectKeySegment(value: string, fallback = "file") {
  return (
    value
      .normalize("NFKC")
      .toLowerCase()
      .replace(/\.[^.]+$/g, "")
      .replace(/[^a-z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || fallback
  );
}

export function normalizeObjectPrefix(prefix: string) {
  return prefix
    .normalize("NFKC")
    .toLowerCase()
    .split("/")
    .map((segment) => safeObjectKeySegment(segment, "files"))
    .filter(Boolean)
    .join("/");
}

export async function uploadObject({
  access,
  body,
  cacheControl,
  contentType,
  key,
}: UploadObjectOptions) {
  const config = getObjectStorageConfig({
    requirePublicUrl: access === "public",
  });
  const client = createObjectStorageClient(config);

  try {
    await client.send(
      new PutObjectCommand({
        Body: body,
        Bucket: config.bucketName,
        CacheControl: cacheControl,
        ContentType: contentType,
        Key: key,
      }),
    );
  } catch {
    throw new ObjectStorageError("upload-failed", "Object upload failed.");
  }

  return {
    key,
    publicUrl:
      access === "public" && config.publicBaseUrl
        ? publicObjectUrl(config.publicBaseUrl, key)
        : null,
  };
}

export async function deleteObject(key: string) {
  const config = getObjectStorageConfig({ requirePublicUrl: false });
  const client = createObjectStorageClient(config);

  try {
    await client.send(
      new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );
  } catch {
    throw new ObjectStorageError("delete-failed", "Object delete failed.");
  }
}

export async function downloadObject(key: string) {
  const config = getObjectStorageConfig({ requirePublicUrl: false });
  const client = createObjectStorageClient(config);

  try {
    const result = await client.send(
      new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
      }),
    );

    if (!result.Body) {
      throw new Error("Object body missing.");
    }

    const body = await result.Body.transformToByteArray();

    return {
      body,
      contentLength: result.ContentLength ?? body.byteLength,
      contentType: result.ContentType ?? "application/octet-stream",
    };
  } catch {
    throw new ObjectStorageError("download-failed", "Object download failed.");
  }
}
