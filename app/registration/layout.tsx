import type { Metadata } from "next";
import type { ReactNode } from "react";

import { PrivateLayout } from "../../components/layout/private-layout";
import { RegistrationNav } from "../../components/registration/registration-nav";
import { Button } from "../../components/ui/button";
import { requireStaffUser } from "../../lib/auth";
import { createPrivateMetadata } from "../../lib/seo";
import { logoutAction } from "../login/actions";

export const metadata: Metadata = createPrivateMetadata(
  "Smartfit.am Registration",
);

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
      navigation={<RegistrationNav />}
      title="Registration"
    >
      {children}
    </PrivateLayout>
  );
}
