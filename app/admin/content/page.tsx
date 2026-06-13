import { PublicContentType } from "@prisma/client";

import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { ImageInput } from "../../../components/admin/image-input";
import { db } from "../../../lib/db";
import { savePublicContentAction } from "./actions";

type ContentPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

const errorMessages: Record<string, string> = {
  "invalid-date": "Start and end dates must be valid.",
  "invalid-date-order": "End date cannot be earlier than start date.",
  "invalid-required": "A valid content type and title are required.",
  "invalid-url": "Image URL must use a valid http or https URL.",
  "upload-configuration":
    "Image upload is not configured. Add Cloudinary values to .env or use an image URL.",
  "upload-failed": "Image upload failed. Try again or use an image URL.",
  "upload-file-size": "Image files must be 5 MB or smaller.",
  "upload-file-type": "Choose a valid image file.",
  unavailable: "Public content could not be saved. Please try again.",
};

function dateTimeValue(value: Date | null) {
  if (!value) {
    return "";
  }

  const localValue = new Date(value.getTime() - value.getTimezoneOffset() * 60000);
  return localValue.toISOString().slice(0, 16);
}

function ContentFields({
  content,
}: {
  content?: {
    body: string | null;
    endsAt: Date | null;
    id: string;
    imageUrl: string | null;
    isActive: boolean;
    startsAt: Date | null;
    title: string;
    type: PublicContentType;
  };
}) {
  return (
    <>
      {content ? <input name="id" type="hidden" value={content.id} /> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <label className={labelClass}>
          Type
          <select
            className={inputClass}
            defaultValue={content?.type ?? PublicContentType.OFFER}
            name="type"
            required
          >
            {Object.values(PublicContentType).map((type) => (
              <option key={type} value={type}>
                {type.toLowerCase().replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Title
          <input
            className={inputClass}
            defaultValue={content?.title ?? ""}
            maxLength={200}
            name="title"
            required
          />
        </label>
        <label className={`${labelClass} md:col-span-2`}>
          Body / description
          <textarea
            className={`${inputClass} min-h-28`}
            defaultValue={content?.body ?? ""}
            maxLength={5000}
            name="body"
          />
        </label>
        <label className={labelClass}>
          Start date
          <input
            className={inputClass}
            defaultValue={dateTimeValue(content?.startsAt ?? null)}
            name="startsAt"
            type="datetime-local"
          />
        </label>
        <label className={labelClass}>
          End date
          <input
            className={inputClass}
            defaultValue={dateTimeValue(content?.endsAt ?? null)}
            name="endsAt"
            type="datetime-local"
          />
        </label>
        <ImageInput
          className="md:col-span-2"
          defaultValue={content?.imageUrl ?? ""}
          label="Content image"
          name="imageUrl"
          uploadName="imageUpload"
        />
      </div>
      <label className="mt-5 flex items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
        <input defaultChecked={content?.isActive ?? true} name="isActive" type="checkbox" />
        Active and visible during its date range
      </label>
    </>
  );
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const [content, params] = await Promise.all([
    db.publicContent.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        body: true,
        endsAt: true,
        id: true,
        imageUrl: true,
        isActive: true,
        startsAt: true,
        title: true,
        type: true,
      },
      where: { deletedAt: null },
    }),
    searchParams,
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Public content
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Manage homepage content
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Create and update offers, promotions, discounts, news,
          announcements, and hero content. Active content appears publicly
          within its optional date range.
        </p>
      </header>

      {params.status === "saved" ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          Public content saved.
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

      <Card className="mt-8">
        <h3 className="text-xl font-bold text-foreground">
          Create public content
        </h3>
        <form action={savePublicContentAction} className="mt-5">
          <ContentFields />
          <Button className="mt-5" type="submit">
            Create content
          </Button>
        </form>
      </Card>

      <section className="mt-10">
        <h3 className="text-2xl font-bold text-foreground">Existing content</h3>
        {content.length ? (
          <div className="mt-5 space-y-6">
            {content.map((item) => (
              <Card key={item.id}>
                <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold uppercase tracking-wide text-brand">
                    {item.type.toLowerCase().replaceAll("_", " ")}
                  </p>
                  <span className="rounded-full bg-neutral px-3 py-1 text-xs font-semibold text-secondary">
                    {item.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <form action={savePublicContentAction}>
                  <ContentFields content={item} />
                  <Button className="mt-5" type="submit">
                    Save changes
                  </Button>
                </form>
              </Card>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            No public content has been created yet.
          </p>
        )}
      </section>
    </>
  );
}
