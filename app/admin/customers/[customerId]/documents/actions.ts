"use server";

import {
  archiveCustomerDocumentForAdmin,
  CustomerDocumentActionError,
  uploadCustomerDocumentForAdmin,
} from "../../../../../lib/customer-documents/actions";
import { CustomerDocumentStorageError } from "../../../../../lib/customer-documents/storage-error";
import { CustomerDocumentValidationError } from "../../../../../lib/customer-documents/validation";

export type CustomerDocumentUploadState = {
  fieldErrors?: {
    file?: string;
  };
  formError?: string;
  message?: string;
  ok: boolean;
  submissionId: number;
  values: {
    label: string;
    notes: string;
  };
};

export type CustomerDocumentMutationResult = {
  message: string;
  ok: boolean;
};

function draftText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function optionalText(formData: FormData, name: string, maxLength: number) {
  return draftText(formData, name, maxLength).trim() || null;
}

function nextState(
  previousState: CustomerDocumentUploadState,
  state: Omit<CustomerDocumentUploadState, "submissionId" | "values">,
  values: CustomerDocumentUploadState["values"],
): CustomerDocumentUploadState {
  return {
    ...state,
    submissionId: previousState.submissionId + 1,
    values,
  };
}

function isRedirectError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: unknown }).digest).startsWith("NEXT_REDIRECT")
  );
}

function safeUploadError(
  error: unknown,
): Pick<CustomerDocumentUploadState, "fieldErrors" | "formError"> {
  if (error instanceof CustomerDocumentValidationError) {
    return {
      fieldErrors: {
        file: error.message,
      },
    };
  }

  if (
    error instanceof CustomerDocumentStorageError ||
    error instanceof CustomerDocumentActionError
  ) {
    if (error.code === "customer-not-found") {
      return {
        formError: "The customer is no longer available.",
      };
    }

    return {
      formError:
        "The private document could not be saved. Check the file and try again.",
    };
  }

  return {
    formError: "The private document could not be saved. Please try again.",
  };
}

export async function uploadCustomerDocumentUiAction(
  previousState: CustomerDocumentUploadState,
  formData: FormData,
): Promise<CustomerDocumentUploadState> {
  const values = {
    label: draftText(formData, "label", 120),
    notes: draftText(formData, "notes", 500),
  };
  const customerId = optionalText(formData, "customerId", 100);
  const file = formData.get("file");

  if (!customerId) {
    return nextState(
      previousState,
      {
        formError: "The customer is no longer available.",
        ok: false,
      },
      values,
    );
  }

  if (!(file instanceof File) || file.size <= 0) {
    return nextState(
      previousState,
      {
        fieldErrors: {
          file: "Choose a PDF, JPG, JPEG, or PNG file.",
        },
        ok: false,
      },
      values,
    );
  }

  try {
    await uploadCustomerDocumentForAdmin({
      customerId,
      file,
      label: values.label,
      notes: values.notes,
    });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return nextState(
      previousState,
      {
        ...safeUploadError(error),
        ok: false,
      },
      values,
    );
  }

  return nextState(
    previousState,
    {
      message: "Document uploaded.",
      ok: true,
    },
    { label: "", notes: "" },
  );
}

export async function archiveCustomerDocumentUiAction(
  customerId: string,
  documentId: string,
): Promise<CustomerDocumentMutationResult> {
  try {
    await archiveCustomerDocumentForAdmin(documentId, { customerId });
  } catch (error) {
    if (isRedirectError(error)) {
      throw error;
    }

    return {
      message: "The document could not be archived. Please try again.",
      ok: false,
    };
  }

  return {
    message: "Document archived.",
    ok: true,
  };
}
