import { checkOutAction } from "../../app/registration/actions";
import { Button } from "../ui/button";

export function CheckOutPanel({
  compact,
  customerCode,
  customerId,
  showAllPackages,
}: {
  compact: boolean;
  customerCode: string;
  customerId: string;
  showAllPackages: boolean;
}) {
  return (
    <section className="mt-4 rounded-2xl border border-status-medium bg-card p-5 shadow-sm sm:p-6">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-button-warning">
        Check out
      </p>
      <h3 className="mt-2 text-2xl font-bold text-foreground">
        Register customer exit
      </h3>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
        Check-out closes the open gym visit and decreases occupancy by the same
        party size recorded at check-in. It does not deduct package sessions or
        guest passes.
      </p>
      <form action={checkOutAction} className="mt-5">
        <input name="customerCode" type="hidden" value={customerCode} />
        <input name="customerId" type="hidden" value={customerId} />
        <input
          name="showAllPackages"
          type="hidden"
          value={showAllPackages ? "1" : "0"}
        />
        {compact ? <input name="view" type="hidden" value="compact" /> : null}
        <Button className="w-full sm:w-auto" type="submit" variant="warning">
          Check out customer
        </Button>
      </form>
    </section>
  );
}
