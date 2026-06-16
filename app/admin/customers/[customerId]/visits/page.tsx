import Link from "next/link";
import { notFound } from "next/navigation";

import { CustomerVisitHistory } from "../../../../../components/admin/customer-visit-history";
import { getCustomerVisitHistoryForAdmin } from "../../../../../lib/admin/customer-visit-history";
import { db } from "../../../../../lib/db";

type CustomerVisitsPageProps = {
  params: Promise<{ customerId: string }>;
};

export default async function CustomerVisitsPage({
  params,
}: CustomerVisitsPageProps) {
  const { customerId } = await params;
  const [customer, visits] = await Promise.all([
    db.customer.findFirst({
      select: {
        customerCode: true,
        fullName: true,
        id: true,
      },
      where: { deletedAt: null, id: customerId },
    }),
    getCustomerVisitHistoryForAdmin(customerId),
  ]);

  if (!customer) {
    notFound();
  }

  return (
    <>
      <Link
        className="inline-flex min-h-11 items-center text-sm font-semibold text-brand hover:text-primary-hover"
        href={`/admin/customers/${encodeURIComponent(customer.id)}`}
      >
        Back to customer detail
      </Link>

      <header className="mt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Member ID: {customer.customerCode}
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          {customer.fullName}
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Admin-only visit history for this customer. Newest visits appear
          first.
        </p>
      </header>

      <div className="mt-6">
        <CustomerVisitHistory
          description="Complete stored check-in and check-out history for this customer."
          title="All Visits"
          visits={visits}
        />
      </div>
    </>
  );
}
