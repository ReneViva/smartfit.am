import type { ReactNode } from "react";

import { PrivateLayout } from "../../components/layout/private-layout";
import { Button } from "../../components/ui/button";
import { requireStaffUser } from "../../lib/auth";
import { logoutAction } from "../login/actions";

export default async function RegistrationLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireStaffUser();

  return (
    <PrivateLayout
      actions={
        <form action={logoutAction}>
          <Button type="submit" variant="neutral">
            Log out
          </Button>
        </form>
      }
      description={`Signed in as ${user.name ?? user.username ?? "registration staff"}`}
      title="Registration"
    >
      {children}
    </PrivateLayout>
  );
}
