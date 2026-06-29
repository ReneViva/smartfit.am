import type { Metadata } from "next";
import type { ReactNode } from "react";

import { AdminIcon } from "../../components/admin/admin-icons";
import { AdminNav } from "../../components/admin/admin-nav";
import { PrivateLayout } from "../../components/layout/private-layout";
import { Button } from "../../components/ui/button";
import { requireStaffRole } from "../../lib/auth";
import { createPrivateMetadata } from "../../lib/seo";
import { logoutAction } from "../login/actions";

export const metadata: Metadata = createPrivateMetadata("Smartfit.am Admin");

export default async function AdminLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  await requireStaffRole("ADMIN");

  return (
    <PrivateLayout
      actions={
        <form action={logoutAction}>
          <Button pendingLabel="Logging out..." type="submit" variant="neutral">
            Log out
          </Button>
        </form>
      }
      description="Signed in Admin"
      navigation={<AdminNav />}
      sidebarFooter={
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-page p-3 shadow-sm lg:block lg:p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-soft-blue text-primary-active">
              <AdminIcon className="size-5" name="monitor" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-foreground">
                Smartfit.am
              </p>
              <p className="mt-0.5 text-xs font-semibold leading-4 text-secondary">
                Gym Management Platform
              </p>
            </div>
          </div>
          <span className="inline-flex shrink-0 rounded-full bg-brand px-2.5 py-1 text-xs font-bold text-white lg:mt-3">
            v20.0
          </span>
        </div>
      }
      title="Admin"
    >
      {children}
    </PrivateLayout>
  );
}
