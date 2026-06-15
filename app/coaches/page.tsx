import { PublicLayout } from "../../components/layout/public-layout";
import { CoachPhoto } from "../../components/public/coach-photo";
import { EmptyState } from "../../components/public/empty-state";
import { JsonLd } from "../../components/public/json-ld";
import { PageIntro } from "../../components/public/page-intro";
import { Card } from "../../components/ui/card";
import { getActiveCoaches } from "../../lib/public-data";
import {
  createBreadcrumbJsonLd,
  createPublicMetadata,
} from "../../lib/seo";

export const dynamic = "force-dynamic";
export const metadata = createPublicMetadata({
  description:
    "Meet Smartfit.am coaches, explore their training specialties, and find practical fitness support for your goals.",
  path: "/coaches",
  title: "Smartfit.am Coaches — Trainers, Specialties & Fitness Support",
});

export default async function CoachesPage() {
  const coaches = await getActiveCoaches();

  return (
    <PublicLayout>
      <JsonLd data={createBreadcrumbJsonLd("Coaches", "/coaches")} />

      <PageIntro
        description="Meet the active coaches who help Smartfit.am members train with focus and confidence."
        eyebrow="Coaches"
        title="Guidance for your goals"
      />

      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.length ? (
          coaches.map((coach) => (
            <Card className="public-interactive-card overflow-hidden p-0" key={coach.id}>
              <CoachPhoto
                name={`${coach.firstName} ${coach.lastName}`}
                photoUrl={coach.photoUrl}
              />
              <div className="p-6">
                <p className="text-sm font-semibold text-brand">
                  {coach.specialty}
                </p>
                <h2 className="mt-2 text-xl font-bold text-foreground">
                  {coach.firstName} {coach.lastName}
                </h2>
                {coach.description ? (
                  <p className="mt-3 text-sm leading-6 text-secondary">
                    {coach.description}
                  </p>
                ) : null}
              </div>
            </Card>
          ))
        ) : (
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState>Coach profiles will be available soon.</EmptyState>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
