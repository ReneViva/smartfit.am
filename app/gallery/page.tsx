import { PublicLayout } from "../../components/layout/public-layout";
import { EmptyState } from "../../components/public/empty-state";
import { PageIntro } from "../../components/public/page-intro";
import { Card } from "../../components/ui/card";
import { getActiveGalleryImages } from "../../lib/public-data";

export const dynamic = "force-dynamic";

export default async function GalleryPage() {
  const images = await getActiveGalleryImages();

  return (
    <PublicLayout>
      <PageIntro
        description="A public-safe look at the Smartfit.am gym, equipment, training areas, and atmosphere."
        eyebrow="Gallery"
        title="See the space"
      />

      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {images.length ? (
          images.map((image) => (
            <Card className="overflow-hidden p-0" key={image.id}>
              <img
                alt={image.altText ?? image.title ?? "Smartfit.am gallery image"}
                className="aspect-[4/3] w-full object-cover"
                src={image.imageUrl ?? ""}
              />
              {image.title ? (
                <p className="p-4 font-semibold text-foreground">
                  {image.title}
                </p>
              ) : null}
            </Card>
          ))
        ) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState>Gallery images will be available soon.</EmptyState>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
