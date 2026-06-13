import type { ReactNode } from "react";

import { PrivateLayout } from "../../components/layout/private-layout";
import { Button } from "../../components/ui/button";
import { requireStaffRole } from "../../lib/auth";
import { logoutAction } from "../login/actions";

export default async function RegistrationLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireStaffRole("REGISTRATION");

  return (
    <PrivateLayout
      actions={
        <form action={logoutAction}>
          <Button variant="neutral">Log out</Button>
        </form>
      }
      description={`Signed in as ${user.name ?? user.username ?? "registration staff"}`}
      title="Registration"
    >
      {children}
    </PrivateLayout>
  );
}
