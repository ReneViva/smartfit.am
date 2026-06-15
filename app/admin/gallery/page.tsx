import { AdminExpandableCard } from "../../../components/admin/admin-expandable-card";
import { GalleryDeleteForm } from "../../../components/admin/gallery-delete-form";
import { ImageInput } from "../../../components/admin/image-input";
import { Button } from "../../../components/ui/button";
import { Card } from "../../../components/ui/card";
import { StatusBadge } from "../../../components/ui/status-badge";
import { db } from "../../../lib/db";
import { saveGalleryImageAction } from "./actions";

type GalleryPageProps = {
  searchParams: Promise<{
    error?: string;
    status?: string;
  }>;
};

const inputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-soft-blue";
const labelClass = "block text-sm font-semibold text-foreground";

const errorMessages: Record<string, string> = {
  "invalid-order": "Sort order must be a non-negative whole number.",
  "invalid-url": "Image URL must use a valid http or https URL.",
  "missing-image": "Choose an image URL or upload an image.",
  "upload-configuration":
    "Image upload is not configured. Add Cloudinary values to .env or use an image URL.",
  "upload-failed": "Image upload failed. Try again or use an image URL.",
  "upload-file-size": "Image files must be 5 MB or smaller.",
  "upload-file-type": "Choose a valid image file.",
  unavailable: "The gallery image could not be saved. Please try again.",
};

function GalleryFields({
  image,
}: {
  image?: {
    altText: string | null;
    id: string;
    imageUrl: string;
    isActive: boolean;
    sortOrder: number | null;
    title: string | null;
  };
}) {
  return (
    <>
      {image ? <input name="id" type="hidden" value={image.id} /> : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={labelClass}>
          Title
          <input
            className={inputClass}
            defaultValue={image?.title ?? ""}
            maxLength={200}
            name="title"
            placeholder="Training floor"
          />
        </label>
        <label className={labelClass}>
          Sort order
          <input
            className={inputClass}
            defaultValue={image?.sortOrder ?? ""}
            min={0}
            name="sortOrder"
            placeholder="0"
            step={1}
            type="number"
          />
        </label>
        <label className={`${labelClass} sm:col-span-2`}>
          Alt text
          <input
            className={inputClass}
            defaultValue={image?.altText ?? ""}
            maxLength={300}
            name="altText"
            placeholder="Describe the image for accessibility"
          />
        </label>
        <ImageInput
          className="sm:col-span-2"
          defaultValue={image?.imageUrl ?? ""}
          label="Gallery image"
          name="imageUrl"
          uploadName="imageUpload"
        />
      </div>
      <label className="mt-4 flex items-center gap-3 rounded-lg bg-neutral px-4 py-3 text-sm font-semibold text-foreground">
        <input defaultChecked={image?.isActive ?? true} name="isActive" type="checkbox" />
        Active and visible in the public gallery
      </label>
    </>
  );
}

export default async function AdminGalleryPage({
  searchParams,
}: GalleryPageProps) {
  const [images, params] = await Promise.all([
    db.galleryImage.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    searchParams,
  ]);
  const errorMessage = params.error ? errorMessages[params.error] : null;

  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Gallery
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Manage public gallery
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Add gym photos by public URL or Cloudinary upload, control their
          display order, and choose which images appear publicly.
        </p>
      </header>

      {params.status ? (
        <p className="mt-6 rounded-xl border border-status-low bg-card px-4 py-3 text-sm font-semibold text-foreground">
          {params.status === "deleted" ? "Gallery image removed." : "Gallery image saved."}
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

      <Card className="mt-8 max-w-3xl">
        <h3 className="text-xl font-bold text-foreground">Add image</h3>
        <p className="mt-2 text-sm leading-6 text-secondary">
          Preview the URL or selected file before saving.
        </p>
        <form action={saveGalleryImageAction} className="mt-5">
          <GalleryFields />
          <Button className="mt-5" type="submit">
            Add to gallery
          </Button>
        </form>
      </Card>

      <section className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-brand">
              Existing images
            </p>
            <h3 className="mt-2 text-2xl font-bold text-foreground">
              {images.length} gallery {images.length === 1 ? "image" : "images"}
            </h3>
          </div>
        </div>

        {images.length ? (
          <div className="mt-5 grid gap-4 xl:grid-cols-2">
            {images.map((image) => (
              <AdminExpandableCard
                key={image.id}
                summary={
                  <div>
                    <div className="relative overflow-hidden bg-soft-blue">
                      <img
                        alt={image.altText ?? image.title ?? "Gallery image"}
                        className="aspect-[16/7] w-full object-cover transition-transform duration-500 group-hover:scale-[1.025] motion-reduce:transform-none"
                        src={image.imageUrl}
                      />
                      <StatusBadge
                        className="absolute right-3 top-3 bg-card/95 px-2.5 py-1 text-xs shadow-sm"
                        status={image.isActive ? "active" : "notInGym"}
                      >
                        {image.isActive ? "Visible" : "Hidden"}
                      </StatusBadge>
                    </div>
                    <div className="p-5">
                      <div className="flex min-w-0 items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h4 className="truncate text-lg font-bold text-foreground">
                            {image.title || "Untitled gallery image"}
                          </h4>
                          <p className="mt-2 line-clamp-2 text-sm leading-6 text-secondary">
                            {image.altText || "No alt text provided."}
                          </p>
                        </div>
                        <span className="shrink-0 rounded-lg bg-neutral px-2.5 py-1.5 text-xs font-bold text-secondary">
                          Order {image.sortOrder ?? "auto"}
                        </span>
                      </div>
                    </div>
                  </div>
                }
              >
                <div className="mb-5">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">
                    Editing gallery image
                  </p>
                  <h4 className="mt-1 text-lg font-bold text-foreground">
                    {image.title || image.altText || "Untitled gallery image"}
                  </h4>
                </div>
                <div>
                  <form action={saveGalleryImageAction}>
                    <GalleryFields image={image} />
                    <Button type="submit">Save changes</Button>
                  </form>
                  <div className="mt-3">
                    <GalleryDeleteForm
                      imageId={image.id}
                      imageTitle={image.title ?? image.altText ?? "this image"}
                    />
                  </div>
                </div>
              </AdminExpandableCard>
            ))}
          </div>
        ) : (
          <p className="mt-5 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
            No gallery images have been added yet.
          </p>
        )}
      </section>
    </>
  );
}
