import { PublicContentType } from "@prisma/client";

import { AdminExpandableCard } from "../../../components/admin/admin-expandable-card";
import { ImageInput } from "../../../components/admin/image-input";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { db } from "../../../lib/db";
import {
  movePublicContentAction,
  savePublicContentAction,
} from "./actions";

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
  "invalid-order": "Content order could not be changed.",
  "invalid-required": "A valid content type and title are required.",
  "invalid-url":
    "Image URLs must use http or https. CTA URLs may use http, https, or an internal path like /packages.",
  "upload-configuration":
    "Image upload storage is not configured. Add storage values to .env or use an image URL.",
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

const summaryDateFormat = new Intl.DateTimeFormat("en", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

function contentTypeLabel(type: PublicContentType) {
  return type.toLowerCase().replaceAll("_", " ");
}

function contentDateRange(startsAt: Date | null, endsAt: Date | null) {
  if (startsAt && endsAt) {
    return `${summaryDateFormat.format(startsAt)} - ${summaryDateFormat.format(endsAt)}`;
  }

  if (startsAt) {
    return `Starts ${summaryDateFormat.format(startsAt)}`;
  }

  if (endsAt) {
    return `Ends ${summaryDateFormat.format(endsAt)}`;
  }

  return "No date restrictions";
}

function ContentFields({
  content,
}: {
  content?: {
    body: string | null;
    ctaLabel: string | null;
    ctaUrl: string | null;
    endsAt: Date | null;
    id: string;
    imageUrl: string | null;
    isActive: boolean;
    startsAt: Date | null;
    title: string;
    type: PublicContentType;
    visibleOnApp: boolean;
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
          CTA URL
          <input
            className={inputClass}
            defaultValue={content?.ctaUrl ?? ""}
            maxLength={1000}
            name="ctaUrl"
            placeholder="https://... or /packages"
          />
          <span className="mt-2 block text-sm font-normal leading-6 text-secondary">
            Optional destination link for this promotion, offer, news, or
            announcement.
          </span>
        </label>
        <label className={labelClass}>
          CTA label
          <input
            className={inputClass}
            defaultValue={content?.ctaLabel ?? ""}
            maxLength={80}
            name="ctaLabel"
            placeholder="Learn more"
          />
          <span className="mt-2 block text-sm font-normal leading-6 text-secondary">
            Optional button text. If this is empty, the homepage card becomes
            clickable and Our App uses a default label.
          </span>
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
      <label className="mt-3 flex items-start gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
        <input
          className="mt-1"
          defaultChecked={content?.visibleOnApp ?? false}
          name="visibleOnApp"
          type="checkbox"
        />
        <span>
          Visible on Our App
          <span className="mt-1 block text-sm font-normal leading-6 text-secondary">
            Marks this content for the Our App announcement display.
          </span>
        </span>
      </label>
    </>
  );
}

function MoveContentControls({
  id,
  isFirst,
  isLast,
  orderPosition,
}: {
  id: string;
  isFirst: boolean;
  isLast: boolean;
  orderPosition: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="text-sm font-semibold text-secondary">
        Order position {orderPosition}
      </span>
      <div className="flex flex-wrap gap-2">
        <form action={movePublicContentAction}>
          <input name="id" type="hidden" value={id} />
          <input name="direction" type="hidden" value="up" />
          <Button
            className="min-h-9 px-3 py-2"
            disabled={isFirst}
            pendingLabel="Moving..."
            type="submit"
            variant="neutral"
          >
            Move Up
          </Button>
        </form>
        <form action={movePublicContentAction}>
          <input name="id" type="hidden" value={id} />
          <input name="direction" type="hidden" value="down" />
          <Button
            className="min-h-9 px-3 py-2"
            disabled={isLast}
            pendingLabel="Moving..."
            type="submit"
            variant="neutral"
          >
            Move Down
          </Button>
        </form>
      </div>
    </div>
  );
}

export default async function ContentPage({ searchParams }: ContentPageProps) {
  const [content, params] = await Promise.all([
    db.publicContent.findMany({
      orderBy: [
        { sortOrder: "asc" },
        { createdAt: "asc" },
        { id: "asc" },
      ],
      select: {
        body: true,
        ctaLabel: true,
        ctaUrl: true,
        endsAt: true,
        id: true,
        imageUrl: true,
        isActive: true,
        sortOrder: true,
        startsAt: true,
        title: true,
        type: true,
        visibleOnApp: true,
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
          <Button className="mt-5" pendingLabel="Creating..." type="submit">
            Create content
          </Button>
        </form>
      </Card>

      <section className="mt-10">
        <h3 className="text-2xl font-bold text-foreground">Existing content</h3>
        {content.length ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {content.map((item, index) => (
              <div className="space-y-2" key={item.id}>
                <AdminExpandableCard
                  summary={
                    <div className="grid min-w-0 gap-4 p-5 sm:grid-cols-[6.5rem_minmax(0,1fr)]">
                      <div className="overflow-hidden rounded-xl border border-border bg-soft-blue">
                        {item.imageUrl ? (
                          <img
                            alt=""
                            className="aspect-[4/3] h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transform-none"
                            src={item.imageUrl}
                          />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center px-3 text-center text-xs font-semibold text-secondary">
                            No image
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-neutral px-2.5 py-1 text-xs font-bold text-secondary">
                            Order {index + 1}
                          </span>
                          <span className="rounded-full bg-soft-blue px-2.5 py-1 text-xs font-bold capitalize text-primary-active">
                            {contentTypeLabel(item.type)}
                          </span>
                          <StatusBadge
                            className="px-2.5 py-1 text-xs"
                            status={item.isActive ? "active" : "notInGym"}
                          >
                            {item.isActive ? "Active" : "Inactive"}
                          </StatusBadge>
                          {item.visibleOnApp ? (
                            <StatusBadge
                              className="px-2.5 py-1 text-xs"
                              status="active"
                            >
                              Our App
                            </StatusBadge>
                          ) : null}
                        </div>
                        <h4 className="mt-3 line-clamp-2 text-lg font-bold text-foreground">
                          {item.title}
                        </h4>
                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">
                          {item.body || "No description provided."}
                        </p>
                        <p className="mt-3 text-xs font-semibold text-muted">
                          {contentDateRange(item.startsAt, item.endsAt)}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-secondary">
                          <span className="rounded-full border border-border bg-page px-2.5 py-1">
                            {item.ctaUrl ? "CTA URL set" : "No CTA URL"}
                          </span>
                          {item.ctaLabel ? (
                            <span className="rounded-full border border-border bg-page px-2.5 py-1">
                              CTA: {item.ctaLabel}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <div className="mb-5">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                      Editing content
                    </p>
                    <h4 className="mt-1 text-lg font-bold text-foreground">
                      {item.title}
                    </h4>
                  </div>
                  <form action={savePublicContentAction}>
                    <ContentFields content={item} />
                    <Button
                      className="mt-5"
                      pendingLabel="Saving..."
                      type="submit"
                    >
                      Save changes
                    </Button>
                  </form>
                </AdminExpandableCard>
                <MoveContentControls
                  id={item.id}
                  isFirst={index === 0}
                  isLast={index === content.length - 1}
                  orderPosition={index + 1}
                />
              </div>
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
