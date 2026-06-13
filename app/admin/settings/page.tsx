import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { ImageInput } from "../../../components/admin/image-input";
import { db } from "../../../lib/db";
import { saveSettingsAction } from "./actions";

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";
const toggleFields = [
  {
    defaultChecked: true,
    label: "Show phone",
    name: "showPhoneInPublicApp",
  },
  {
    defaultChecked: true,
    label: "Show WhatsApp",
    name: "showWhatsappInPublicApp",
  },
  {
    defaultChecked: true,
    label: "Show Instagram",
    name: "showInstagramInPublicApp",
  },
  {
    defaultChecked: true,
    label: "Show location",
    name: "showLocationInPublicApp",
  },
  {
    defaultChecked: true,
    label: "Show motivational text",
    name: "showMotivationalTextInPublicApp",
  },
  {
    defaultChecked: false,
    label: "Hide inactive customers from registration",
    name: "hideInactiveCustomersFromRegistration",
  },
] as const;

const errorMessages: Record<string, string> = {
  "invalid-thresholds":
    "Thresholds must be non-negative whole numbers, and green cannot exceed yellow.",
  "invalid-url": "Logo and public links must use valid http or https URLs.",
  "missing-name": "Gym name is required.",
  "upload-configuration":
    "Image upload is not configured. Add Cloudinary values to .env or use an image URL.",
  "upload-failed": "Image upload failed. Try again or use an image URL.",
  "upload-file-size": "Image files must be 5 MB or smaller.",
  "upload-file-type": "Choose a valid image file.",
  unavailable: "Settings could not be saved. Please try again.",
};

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const [settings, params] = await Promise.all([
    db.gymSettings.findFirst(),
    searchParams,
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Settings
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Gym and public app settings
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          These values control public contact information, live occupancy
          status, and the no-login Our App page.
        </p>
      </header>

      {params.status === "saved" ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          Settings saved.
        </p>
      ) : null}
      {errorMessage ? (
        <p
          className="mt-6 rounded-xl border border-status-high bg-card px-4 py-3 text-sm font-semibold text-foreground"
          role="alert"
        >
          {errorMessage}
        </p>
      ) : null}

      <form action={saveSettingsAction} className="mt-8 space-y-6">
        <Card>
          <h3 className="text-xl font-bold text-foreground">Gym information</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className={labelClass}>
              Gym name
              <input
                className={inputClass}
                defaultValue={settings?.gymName ?? "Smartfit.am"}
                maxLength={120}
                name="gymName"
                required
              />
            </label>
            <ImageInput
              defaultValue={settings?.logoUrl ?? ""}
              label="Gym logo"
              name="logoUrl"
              uploadName="logoUpload"
            />
            <label className={labelClass}>
              Contact number
              <input
                className={inputClass}
                defaultValue={settings?.contactNumber ?? ""}
                name="contactNumber"
              />
            </label>
            <label className={labelClass}>
              Address
              <input
                className={inputClass}
                defaultValue={settings?.address ?? ""}
                name="address"
              />
            </label>
            <label className={labelClass}>
              Working days
              <input
                className={inputClass}
                defaultValue={settings?.workingDays ?? ""}
                name="workingDays"
              />
            </label>
            <label className={labelClass}>
              Working hours
              <input
                className={inputClass}
                defaultValue={settings?.workingHours ?? ""}
                name="workingHours"
              />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-foreground">Public links</h3>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <label className={labelClass}>
              WhatsApp URL
              <input
                className={inputClass}
                defaultValue={settings?.whatsappLink ?? ""}
                name="whatsappLink"
                placeholder="https://..."
                type="url"
              />
            </label>
            <label className={labelClass}>
              Instagram URL
              <input
                className={inputClass}
                defaultValue={settings?.instagramLink ?? ""}
                name="instagramLink"
                placeholder="https://..."
                type="url"
              />
            </label>
            <label className={`${labelClass} md:col-span-2`}>
              Map URL
              <input
                className={inputClass}
                defaultValue={settings?.mapLink ?? ""}
                name="mapLink"
                placeholder="https://..."
                type="url"
              />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-foreground">
            Occupancy thresholds
          </h3>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Green applies up to the green maximum. Yellow applies after green
            and up to the yellow maximum. Higher counts display red.
          </p>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className={labelClass}>
              Green maximum
              <input
                className={inputClass}
                defaultValue={settings?.occupancyGreenMax ?? 20}
                min={0}
                name="occupancyGreenMax"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={labelClass}>
              Yellow maximum
              <input
                className={inputClass}
                defaultValue={settings?.occupancyYellowMax ?? 40}
                min={0}
                name="occupancyYellowMax"
                required
                step={1}
                type="number"
              />
            </label>
          </div>
        </Card>

        <Card>
          <h3 className="text-xl font-bold text-foreground">
            Public app display
          </h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {toggleFields.map(({ defaultChecked, label, name }) => (
              <label
                className="flex items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground"
                key={name}
              >
                <input
                  defaultChecked={
                    settings ? Boolean(settings[name]) : defaultChecked
                  }
                  name={name}
                  type="checkbox"
                />
                {label}
              </label>
            ))}
          </div>
          <label className={`${labelClass} mt-5`}>
            Motivational text
            <textarea
              className={`${inputClass} min-h-28`}
              defaultValue={settings?.motivationalText ?? ""}
              maxLength={1000}
              name="motivationalText"
            />
          </label>
        </Card>

        <Button type="submit">Save settings</Button>
      </form>
    </>
  );
}
