"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireStaffRole } from "../../../lib/auth";
import { db } from "../../../lib/db";
import { writeAuditLog } from "../../../lib/logging";
import { normalizeMapEmbedUrl } from "../../../lib/map-embed";
import {
  imageUploadErrorCode,
  uploadImageFromForm,
} from "../../../lib/uploads/storage";

const SETTINGS_PATH = "/admin/settings";

function optionalText(formData: FormData, name: string, maxLength = 500) {
  const value = formData.get(name);

  if (typeof value !== "string") {
    return null;
  }

  return value.trim().slice(0, maxLength) || null;
}

function optionalPublicUrl(formData: FormData, name: string) {
  const value = optionalText(formData, name, 1000);

  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function threshold(formData: FormData, name: string) {
  const value = formData.get(name);
  const parsed = typeof value === "string" ? Number(value) : Number.NaN;

  return Number.isInteger(parsed) && parsed >= 0 ? parsed : null;
}

export async function saveSettingsAction(formData: FormData) {
  const user = await requireStaffRole("ADMIN");
  const gymName = optionalText(formData, "gymName", 120);
  const greenMax = threshold(formData, "occupancyGreenMax");
  const yellowMax = threshold(formData, "occupancyYellowMax");
  const rawUrlFields = [
    "logoUrl",
    "ourAppLogoLightUrl",
    "ourAppLogoDarkUrl",
    "whatsappLink",
    "instagramLink",
    "mapLink",
  ] as const;
  const rawMapEmbedValue = optionalText(formData, "mapEmbedUrl", 5000);
  const mapEmbedUrl = normalizeMapEmbedUrl(rawMapEmbedValue);
  const urls = Object.fromEntries(
    rawUrlFields.map((field) => [field, optionalPublicUrl(formData, field)]),
  ) as Record<(typeof rawUrlFields)[number], string | null>;

  if (!gymName) {
    redirect(`${SETTINGS_PATH}?error=missing-name`);
  }

  if (greenMax === null || yellowMax === null || greenMax > yellowMax) {
    redirect(`${SETTINGS_PATH}?error=invalid-thresholds`);
  }

  const uploadedLogoUrl = await uploadImageFromForm(
    formData,
    "logoUpload",
    { prefix: "logos" },
  ).catch((error) => {
    redirect(`${SETTINGS_PATH}?error=upload-${imageUploadErrorCode(error)}`);
  });
  const uploadedOurAppLogoLightUrl = await uploadImageFromForm(
    formData,
    "ourAppLogoLightUpload",
    { prefix: "logos/our-app" },
  ).catch((error) => {
    redirect(`${SETTINGS_PATH}?error=upload-${imageUploadErrorCode(error)}`);
  });
  const uploadedOurAppLogoDarkUrl = await uploadImageFromForm(
    formData,
    "ourAppLogoDarkUpload",
    { prefix: "logos/our-app" },
  ).catch((error) => {
    redirect(`${SETTINGS_PATH}?error=upload-${imageUploadErrorCode(error)}`);
  });
  const uploadedUrls: Partial<
    Record<(typeof rawUrlFields)[number], string | null>
  > = {
    logoUrl: uploadedLogoUrl,
    ourAppLogoDarkUrl: uploadedOurAppLogoDarkUrl,
    ourAppLogoLightUrl: uploadedOurAppLogoLightUrl,
  };
  const hasInvalidUrl = rawUrlFields.some((field) => {
    if (uploadedUrls[field]) {
      return false;
    }

    const rawValue = optionalText(formData, field, 1000);
    return Boolean(rawValue && !urls[field]);
  });

  if (hasInvalidUrl) {
    redirect(`${SETTINGS_PATH}?error=invalid-url`);
  }

  if (rawMapEmbedValue && !mapEmbedUrl) {
    redirect(`${SETTINGS_PATH}?error=invalid-map-embed`);
  }

  const data = {
    address: optionalText(formData, "address"),
    allowRegistrationPackageFreeze:
      formData.get("allowRegistrationPackageFreeze") === "on",
    contactNumber: optionalText(formData, "contactNumber", 120),
    gymName,
    hideInactiveCustomersFromRegistration:
      formData.get("hideInactiveCustomersFromRegistration") === "on",
    instagramLink: urls.instagramLink,
    logoUrl: uploadedLogoUrl ?? urls.logoUrl,
    mapEmbedUrl,
    mapLink: urls.mapLink,
    motivationalText: optionalText(formData, "motivationalText", 1000),
    occupancyGreenMax: greenMax,
    occupancyYellowMax: yellowMax,
    ourAppLogoDarkUrl:
      uploadedOurAppLogoDarkUrl ?? urls.ourAppLogoDarkUrl,
    ourAppLogoLightUrl:
      uploadedOurAppLogoLightUrl ?? urls.ourAppLogoLightUrl,
    showInstagramInPublicApp:
      formData.get("showInstagramInPublicApp") === "on",
    showLocationInPublicApp:
      formData.get("showLocationInPublicApp") === "on",
    showMotivationalTextInPublicApp:
      formData.get("showMotivationalTextInPublicApp") === "on",
    showPhoneInPublicApp: formData.get("showPhoneInPublicApp") === "on",
    showPublicAnalyticsOnOurApp:
      formData.get("showPublicAnalyticsOnOurApp") === "on",
    showWhatsappInPublicApp:
      formData.get("showWhatsappInPublicApp") === "on",
    whatsappLink: urls.whatsappLink,
    workingDays: optionalText(formData, "workingDays", 200),
    workingHours: optionalText(formData, "workingHours", 200),
  };

  try {
    await db.$transaction(async (transaction) => {
      const existing = await transaction.gymSettings.findFirst();
      const saved = existing
        ? await transaction.gymSettings.update({
            data,
            where: { id: existing.id },
          })
        : await transaction.gymSettings.create({
            data: {
              ...data,
              id: "default",
            },
          });

      await writeAuditLog(transaction, {
        actionType: "SETTINGS_EDIT",
        actorId: user.id,
        description: "Updated gym settings.",
        newValue: saved,
        oldValue: existing ?? undefined,
        targetId: saved.id,
        targetType: "GymSettings",
      });
    });
  } catch {
    redirect(`${SETTINGS_PATH}?error=unavailable`);
  }

  revalidatePath("/");
  revalidatePath("/contact");
  revalidatePath("/our-app");
  revalidatePath("/admin");
  revalidatePath("/registration");
  revalidatePath("/registration/rules");
  revalidatePath(SETTINGS_PATH);
  redirect(`${SETTINGS_PATH}?status=saved`);
}
