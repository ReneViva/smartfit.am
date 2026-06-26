"use server";

import { revalidatePath } from "next/cache";

import { requireStaffUser } from "../../lib/auth";
import {
  CustomerProfileImageError,
  deleteCustomerProfileImageFromStorage,
  uploadCustomerProfileImageToStorage,
} from "../../lib/customer-profile-image";
import { db } from "../../lib/db";
import { writeAuditLog } from "../../lib/logging";

export type CustomerProfileImageState = {
  fieldErrors?: {
    file?: string;
  };
  formError?: string;
  message?: string;
  ok: boolean;
  submissionId: number;
};

const initialActionState = {
  ok: false,
  submissionId: 0,
};

function optionalText(formData: FormData, name: string, maxLength: number) {
  const value = formData.get(name);

  return typeof value === "string"
    ? value.trim().slice(0, maxLength) || null
    : null;
}

function nextState(
  previousState: CustomerProfileImageState,
  state: Omit<CustomerProfileImageState, "submissionId">,
): CustomerProfileImageState {
  return {
    ...state,
    submissionId: previousState.submissionId + 1,
  };
}

function uploadErrorState(
  previousState: CustomerProfileImageState,
  error: unknown,
) {
  if (error instanceof CustomerProfileImageError) {
    if (
      error.code === "empty-file" ||
      error.code === "file-size" ||
      error.code === "file-type"
    ) {
      return nextState(previousState, {
        fieldErrors: { file: error.message },
        ok: false,
      });
    }

    return nextState(previousState, {
      formError:
        "The private profile photo could not be saved. Check storage configuration and try again.",
      ok: false,
    });
  }

  return nextState(previousState, {
    formError: "The private profile photo could not be saved. Please try again.",
    ok: false,
  });
}

function profileImageRevalidatePaths(customerId: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/customers");
  revalidatePath(`/admin/customers/${encodeURIComponent(customerId)}`);
  revalidatePath("/registration");
  revalidatePath("/admin/logs");
}

export async function updateCustomerProfileImageAction(
  previousState: CustomerProfileImageState = initialActionState,
  formData: FormData,
): Promise<CustomerProfileImageState> {
  const user = await requireStaffUser();
  const customerId = optionalText(formData, "customerId", 100);
  const removeRequested = formData.get("removeProfileImage") === "1";
  const file = formData.get("profileImage");
  const hasFile = file instanceof File && file.size > 0;

  if (!customerId) {
    return nextState(previousState, {
      formError: "The customer is no longer available.",
      ok: false,
    });
  }

  if (!hasFile && !removeRequested) {
    return nextState(previousState, {
      fieldErrors: { file: "Choose a JPEG or PNG profile photo." },
      ok: false,
    });
  }

  const [customer, settings] = await Promise.all([
    db.customer.findFirst({
      select: {
        customerCode: true,
        fullName: true,
        id: true,
        profileImageUrl: true,
        status: true,
      },
      where: { deletedAt: null, id: customerId },
    }),
    user.role === "REGISTRATION"
      ? db.gymSettings.findFirst({
          select: { hideInactiveCustomersFromRegistration: true },
        })
      : Promise.resolve(null),
  ]);

  if (
    !customer ||
    (user.role === "REGISTRATION" &&
      settings?.hideInactiveCustomersFromRegistration &&
      customer.status !== "ACTIVE")
  ) {
    return nextState(previousState, {
      formError: "The customer is no longer available.",
      ok: false,
    });
  }

  let uploadedKey: string | null = null;
  let nextProfileImageUrl: string | null = null;

  if (hasFile) {
    try {
      const uploaded = await uploadCustomerProfileImageToStorage(file, {
        customerId: customer.id,
      });

      uploadedKey = uploaded.storageKey;
      nextProfileImageUrl = uploaded.storageKey;
    } catch (error) {
      return uploadErrorState(previousState, error);
    }
  }

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.customer.findFirst({
        select: {
          customerCode: true,
          fullName: true,
          id: true,
          profileImageUrl: true,
        },
        where: { deletedAt: null, id: customer.id },
      });

      if (!existing) {
        throw new Error("Customer not found.");
      }

      const saved = await transaction.customer.update({
        data: {
          profileImageUrl: nextProfileImageUrl,
        },
        where: { id: existing.id },
      });

      await writeAuditLog(transaction, {
        actionType: "CUSTOMER_EDIT",
        actorId: user.id,
        customerId: existing.id,
        description: `${hasFile ? "Updated" : "Removed"} profile photo for ${existing.customerCode}: ${existing.fullName}.`,
        newValue: {
          profileImagePresent: Boolean(saved.profileImageUrl),
          updatedByRole: user.role,
        },
        oldValue: {
          profileImagePresent: Boolean(existing.profileImageUrl),
        },
        targetId: existing.id,
        targetType: "Customer",
      });
    });
  } catch {
    if (uploadedKey) {
      await deleteCustomerProfileImageFromStorage(uploadedKey).catch(() => null);
    }

    return nextState(previousState, {
      formError: "The customer profile photo could not be saved.",
      ok: false,
    });
  }

  if (customer.profileImageUrl && customer.profileImageUrl !== uploadedKey) {
    await deleteCustomerProfileImageFromStorage(customer.profileImageUrl).catch(
      () => null,
    );
  }

  profileImageRevalidatePaths(customer.id);

  return nextState(previousState, {
    message: hasFile ? "Profile photo updated." : "Profile photo removed.",
    ok: true,
  });
}
