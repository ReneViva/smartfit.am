import type { ReactNode } from "react";

import { AdminNav } from "../../components/admin/admin-nav";
import { PrivateLayout } from "../../components/layout/private-layout";
import { Button } from "../../components/ui/button";
import { requireStaffRole } from "../../lib/auth";
import { logoutAction } from "../login/actions";

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const user = await requireStaffRole("ADMIN");

  return (
    <PrivateLayout
      actions={
        <form action={logoutAction}>
          <Button type="submit" variant="neutral">
            Log out
          </Button>
        </form>
      }
      description={`Signed in as ${user.name ?? user.username ?? "admin"}`}
      navigation={<AdminNav />}
      title="Admin"
    >
      {children}
    </PrivateLayout>
  );
}
