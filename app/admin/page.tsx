import { Card } from "../../components/ui/card";

export default function AdminPage() {
  return (
    <Card>
      <p className="text-sm font-semibold text-brand">Protected placeholder</p>
      <h2 className="mt-2 text-xl font-bold text-foreground">
        Admin workspace
      </h2>
      <p className="mt-3 text-sm leading-6 text-secondary">
        Admin features will be added in their assigned project phases.
      </p>
    </Card>
  );
}
