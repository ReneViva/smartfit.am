import { PublicLayout } from "../../components/layout/public-layout";
import { EmptyState } from "../../components/public/empty-state";
import { PageIntro } from "../../components/public/page-intro";
import { Card } from "../../components/ui/card";
import { getActiveCoaches } from "../../lib/public-data";

export const dynamic = "force-dynamic";

export default async function CoachesPage() {
  const coaches = await getActiveCoaches();

  return (
    <PublicLayout>
      <PageIntro
        description="Meet the active coaches who help Smartfit.am members train with focus and confidence."
        eyebrow="Coaches"
        title="Guidance for your goals"
      />

      <section className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {coaches.length ? (
          coaches.map((coach) => (
            <Card className="overflow-hidden p-0" key={coach.id}>
              {coach.photoUrl ? (
                <img
                  alt={`${coach.firstName} ${coach.lastName}`}
                  className="aspect-[4/3] w-full object-cover"
                  src={coach.photoUrl}
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center bg-soft-blue text-4xl font-bold text-brand">
                  {coach.firstName.charAt(0)}
                  {coach.lastName.charAt(0)}
                </div>
              )}
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
