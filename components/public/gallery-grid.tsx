import { PublicContentImage } from "./public-content-image";

export type PublicGalleryImage = {
  altText: string | null;
  id: string;
  imageUrl: string;
  title: string | null;
};

export function GalleryGrid({
  compact = false,
  images,
}: {
  compact?: boolean;
  images: PublicGalleryImage[];
}) {
  return (
    <div
      className={`gallery-bento-grid grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
        compact ? "gallery-bento-grid--compact" : ""
      }`}
    >
      {images.map((image, index) => (
        <figure
          className={`gallery-bento-item group relative min-h-64 overflow-hidden rounded-2xl border border-border bg-card shadow-sm ${
            compact && index > 4 ? "hidden" : ""
          }`}
          key={image.id}
        >
          <PublicContentImage
            alt={image.altText ?? image.title ?? "Smartfit.am gallery image"}
            className="absolute inset-0 size-full transition-transform duration-500 group-hover:scale-105"
            src={image.imageUrl}
          />
          <div className="gallery-caption absolute inset-x-0 bottom-0 flex min-h-24 items-end bg-black/65 px-5 py-4 text-white opacity-100 transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
            <figcaption className="text-base font-bold">
              {image.title ?? image.altText ?? "Smartfit.am"}
            </figcaption>
          </div>
        </figure>
      ))}
    </div>
  );
}
