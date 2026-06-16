import "server-only";

import { revalidatePath } from "next/cache";

import { requireStaffRole } from "../auth";
import { db } from "../db";
import { writeAuditLog } from "../logging";
import {
  createCustomerDocumentDownloadUrl,
  deleteCustomerDocumentFromStorage,
  type StoredCustomerDocument,
  uploadCustomerDocumentToStorage,
} from "./storage";

type UploadCustomerDocumentInput = {
  customerId: string;
  file: File;
  label?: string | null;
  notes?: string | null;
};

export class CustomerDocumentActionError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "CustomerDocumentActionError";
  }
}

function optionalText(value: string | null | undefined, maxLength: number) {
  return value?.trim().slice(0, maxLength) || null;
}

function safeDocumentValue(document: {
  createdAt: Date;
  fileExtension: string;
  id: string;
  label: string | null;
  mimeType: string;
  notes: string | null;
  originalFileName: string;
  sizeBytes: number;
  status: string;
  updatedAt: Date;
  uploadedBy: {
    name: string | null;
    username: string | null;
  };
}) {
  return {
    createdAt: document.createdAt,
    fileExtension: document.fileExtension,
    id: document.id,
    label: document.label,
    mimeType: document.mimeType,
    notes: document.notes,
    originalFileName: document.originalFileName,
    sizeBytes: document.sizeBytes,
    status: document.status,
    updatedAt: document.updatedAt,
    uploadedByName:
      document.uploadedBy.name ?? document.uploadedBy.username ?? "Admin",
  };
}

export async function listCustomerDocumentsForAdmin(customerId: string) {
  await requireStaffRole("ADMIN");

  const documents = await db.customerDocument.findMany({
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      createdAt: true,
      fileExtension: true,
      id: true,
      label: true,
      mimeType: true,
      notes: true,
      originalFileName: true,
      sizeBytes: true,
      status: true,
      updatedAt: true,
      uploadedBy: {
        select: {
          name: true,
          username: true,
        },
      },
    },
    where: { customerId },
  });

  return documents.map(safeDocumentValue);
}

export async function uploadCustomerDocumentForAdmin({
  customerId,
  file,
  label,
  notes,
}: UploadCustomerDocumentInput) {
  const user = await requireStaffRole("ADMIN");
  const customer = await db.customer.findFirst({
    select: { customerCode: true, fullName: true, id: true },
    where: { deletedAt: null, id: customerId },
  });

  if (!customer) {
    throw new CustomerDocumentActionError(
      "customer-not-found",
      "Customer not found.",
    );
  }

  let storedDocument: StoredCustomerDocument | null = null;

  try {
    const uploadedDocument = await uploadCustomerDocumentToStorage(file, {
      customerId,
    });
    storedDocument = uploadedDocument;

    const saved = await db.$transaction(async (transaction) => {
      const document = await transaction.customerDocument.create({
        data: {
          customerId,
          fileExtension: uploadedDocument.fileExtension,
          label: optionalText(label, 120),
          mimeType: uploadedDocument.mimeType,
          notes: optionalText(notes, 500),
          originalFileName: uploadedDocument.originalFileName,
          sizeBytes: uploadedDocument.sizeBytes,
          storageDeliveryType: uploadedDocument.storageDeliveryType,
          storageFolder: uploadedDocument.storageFolder,
          storageFormat: uploadedDocument.storageFormat,
          storageKey: uploadedDocument.storageKey,
          storageProvider: uploadedDocument.storageProvider,
          storagePublicId: uploadedDocument.storagePublicId,
          storageResourceType: uploadedDocument.storageResourceType,
          storedFileName: uploadedDocument.storedFileName,
          uploadedById: user.id,
        },
      });

      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_DOCUMENT_CREATE",
        actorId: user.id,
        customerId,
        description: `Uploaded customer document ${document.originalFileName} for ${customer.customerCode}: ${customer.fullName}.`,
        newValue: {
          documentId: document.id,
          fileExtension: document.fileExtension,
          label: document.label,
          mimeType: document.mimeType,
          originalFileName: document.originalFileName,
          sizeBytes: document.sizeBytes,
          storageProvider: document.storageProvider,
          status: document.status,
        },
        targetId: document.id,
        targetType: "CustomerDocument",
      });

      return document;
    });

    revalidatePath(`/admin/customers/${encodeURIComponent(customerId)}`);
    revalidatePath("/admin/logs");
    return saved;
  } catch (error) {
    if (storedDocument) {
      await deleteCustomerDocumentFromStorage(storedDocument).catch(() => null);
    }

    throw error;
  }
}

export async function archiveCustomerDocumentForAdmin(
  documentId: string,
  options: { customerId?: string } = {},
) {
  const user = await requireStaffRole("ADMIN");

  const saved = await db.$transaction(async (transaction) => {
    const existing = await transaction.customerDocument.findFirst({
      include: {
        customer: {
          select: { customerCode: true, fullName: true, id: true },
        },
      },
      where: {
        id: documentId,
        ...(options.customerId ? { customerId: options.customerId } : {}),
      },
    });

    if (!existing?.customer || existing.status === "ARCHIVED") {
      throw new CustomerDocumentActionError(
        "document-not-found",
        "Customer document not found.",
      );
    }

    const document = await transaction.customerDocument.update({
      data: {
        archivedAt: new Date(),
        archivedById: user.id,
        status: "ARCHIVED",
      },
      where: { id: documentId },
    });

    await writeAuditLog(transaction, {
      actionType: "CUSTOMER_DOCUMENT_ARCHIVE",
      actorId: user.id,
      customerId: existing.customer.id,
      description: `Archived customer document ${existing.originalFileName} for ${existing.customer.customerCode}: ${existing.customer.fullName}.`,
      newValue: {
        documentId: document.id,
        status: document.status,
      },
      oldValue: {
        documentId: existing.id,
        status: existing.status,
      },
      targetId: document.id,
      targetType: "CustomerDocument",
    });

    return document;
  });

  revalidatePath(`/admin/customers/${encodeURIComponent(saved.customerId)}`);
  revalidatePath("/admin/logs");
  return saved;
}

export async function createAdminCustomerDocumentDownloadUrl(
  documentId: string,
  options: { customerId?: string } = {},
) {
  const user = await requireStaffRole("ADMIN");
  const document = await db.customerDocument.findFirst({
    include: {
      customer: {
        select: { customerCode: true, fullName: true, id: true },
      },
    },
    where: {
      id: documentId,
      status: "ACTIVE",
      ...(options.customerId ? { customerId: options.customerId } : {}),
    },
  });

  if (!document?.customer) {
    throw new CustomerDocumentActionError(
      "document-not-found",
      "Customer document not found.",
    );
  }

  const download = createCustomerDocumentDownloadUrl(document);

  await db.$transaction(async (transaction) => {
    await writeAuditLog(transaction, {
      actionType: "CUSTOMER_DOCUMENT_DOWNLOAD",
      actorId: user.id,
      customerId: document.customer.id,
      description: `Generated private download URL for customer document ${document.originalFileName} on ${document.customer.customerCode}: ${document.customer.fullName}.`,
      newValue: {
        documentId: document.id,
        expiresAt: download.expiresAt,
        storageProvider: document.storageProvider,
      },
      targetId: document.id,
      targetType: "CustomerDocument",
    });
  });

  revalidatePath("/admin/logs");
  return download;
}
