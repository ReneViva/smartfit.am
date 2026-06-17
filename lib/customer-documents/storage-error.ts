import "server-only";

export type CustomerDocumentStorageErrorCode =
  | "configuration"
  | "delete-failed"
  | "download-failed"
  | "provider"
  | "upload-failed";

export class CustomerDocumentStorageError extends Error {
  code: CustomerDocumentStorageErrorCode;

  constructor(code: CustomerDocumentStorageErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "CustomerDocumentStorageError";
  }
}
