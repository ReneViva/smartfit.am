import { PublicLayout } from "../../components/layout/public-layout";
import { EmptyState } from "../../components/public/empty-state";
import { PageIntro } from "../../components/public/page-intro";
import { Card } from "../../components/ui/card";
import { getActivePackages } from "../../lib/public-data";

export const dynamic = "force-dynamic";

export default async function PackagesPage() {
  const packages = await getActivePackages();

  return (
    <PublicLayout>
      <PageIntro
        description="Explore active Smartfit.am package options and choose the training structure that fits your routine."
        eyebrow="Packages"
        title="A practical way to keep moving"
      />

      <section className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.length ? (
          packages.map((gymPackage) => (
            <Card className="flex flex-col" key={gymPackage.id}>
              <p className="text-sm font-semibold text-brand">
                {gymPackage.packageType}
              </p>
              <h2 className="mt-2 text-2xl font-bold text-foreground">
                {gymPackage.name}
              </h2>
              <p className="mt-3 text-3xl font-bold text-foreground">
                {gymPackage.price}
              </p>
              <p className="mt-1 text-sm text-secondary">
                {gymPackage.sessionCount} sessions
              </p>
              {gymPackage.description ? (
                <p className="mt-4 text-sm leading-6 text-secondary">
                  {gymPackage.description}
                </p>
              ) : null}
              <div className="mt-auto pt-5 text-sm text-secondary">
                {gymPackage.assignedCoach ? (
                  <p>
                    Coach: {gymPackage.assignedCoach.firstName}{" "}
                    {gymPackage.assignedCoach.lastName}
                  </p>
                ) : null}
                {gymPackage.timeRestrictionLabel ? (
                  <p className="mt-2 rounded-lg bg-soft-blue px-3 py-2 text-primary-active">
                    {gymPackage.timeRestrictionLabel}
                  </p>
                ) : null}
              </div>
            </Card>
          ))
        ) : (
          <div className="md:col-span-2 lg:col-span-3">
            <EmptyState>Package information will be available soon.</EmptyState>
          </div>
        )}
      </section>
    </PublicLayout>
  );
}
