import { PublicLayout } from "../../components/layout/public-layout";
import { EmptyState } from "../../components/public/empty-state";
import { GalleryGrid } from "../../components/public/gallery-grid";
import { JsonLd } from "../../components/public/json-ld";
import { PageIntro } from "../../components/public/page-intro";
import { getActiveGalleryImages } from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "View the Smartfit.am gym, equipment, training areas, and atmosphere in the public gallery.",
  path: "/gallery",
  title: "Smartfit.am Gallery — Gym, Equipment & Training Areas",
});

export default async function GalleryPage() {
  const images = await getActiveGalleryImages();

  return (
    <PublicLayout>
      <JsonLd data={createBreadcrumbJsonLd("Gallery", "/gallery")} />

      <div className="rounded-2xl border border-border bg-soft-blue px-6 py-10 sm:px-10 sm:py-14">
        <PageIntro
          description="Explore the spaces, equipment, atmosphere, and energy that make every Smartfit.am training day feel focused."
          eyebrow="Inside Smartfit.am"
          title="A place built to move"
        />
      </div>

      <section className="mt-10">
        {images.length ? (
          <GalleryGrid images={images} />
        ) : (
          <EmptyState>
            Fresh views from the gym floor will be available soon.
          </EmptyState>
        )}
      </section>
    </PublicLayout>
  );
}
