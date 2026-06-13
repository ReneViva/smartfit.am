import { PublicLayout } from "../components/layout/public-layout";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/ui/status-badge";

export default function Home() {
  return (
    <PublicLayout>
      <section className="grid items-center gap-8 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
            Phase 1 foundation
          </p>
          <h1 className="mt-3 max-w-2xl text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            A clear visual starting point for Smartfit.am
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            The responsive layouts, brand tokens, buttons, cards, and status
            styles are ready for later project phases.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button>Primary action</Button>
            <Button variant="neutral">Neutral action</Button>
          </div>
        </div>

        <Card>
          <p className="text-sm font-semibold text-brand">Layout foundation</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            Simple, responsive, and reusable
          </h2>
          <p className="mt-3 leading-7 text-secondary">
            Public and private shells now share consistent spacing, surfaces,
            borders, and typography.
          </p>
        </Card>
      </section>

      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="text-xl font-bold text-foreground">Action colors</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Buttons include clear default, hover, active, focus, and disabled
            states.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Button variant="success">Success</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="danger">Danger</Button>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-foreground">Status colors</h2>
          <p className="mt-2 text-sm leading-6 text-secondary">
            Each status combines a color marker with readable text.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <StatusBadge status="low">Low crowd</StatusBadge>
            <StatusBadge status="medium">Medium crowd</StatusBadge>
            <StatusBadge status="high">High crowd</StatusBadge>
            <StatusBadge status="inGym">In gym</StatusBadge>
            <StatusBadge status="notInGym">Not in gym</StatusBadge>
            <StatusBadge status="active">Active</StatusBadge>
            <StatusBadge status="closeToExpiry">Close to expiry</StatusBadge>
            <StatusBadge status="expired">Expired</StatusBadge>
          </div>
        </Card>
      </section>
    </PublicLayout>
  );
}
