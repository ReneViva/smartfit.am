import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { getCurrentStaffUser, staffHome } from "../../lib/auth";
import { createPrivateMetadata } from "../../lib/seo";
import { loginAction } from "./actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = createPrivateMetadata("Smartfit.am Staff Login");

type LoginPageProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Invalid login details.",
  unavailable: "Sign in is unavailable right now. Please try again later.",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const currentUser = await getCurrentStaffUser();

  if (currentUser) {
    redirect(staffHome(currentUser.role));
  }

  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] : null;

  return (
    <main className="flex min-h-screen items-center justify-center bg-page px-5 py-10">
      <Card className="w-full max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Internal access
        </p>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Sign in to Smartfit.am
        </h1>
        <p className="mt-3 text-sm leading-6 text-secondary">
          Admin and registration staff use this shared login.
        </p>

        {errorMessage ? (
          <p
            className="mt-5 rounded-lg border border-button-danger bg-card px-4 py-3 text-sm text-button-danger"
            role="alert"
          >
            {errorMessage}
          </p>
        ) : null}

        <form action={loginAction} className="mt-6 space-y-5">
          <label className="block">
            <span className="text-sm font-semibold text-foreground">
              Username or email
            </span>
            <input
              autoComplete="username"
              className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-soft-blue"
              name="identifier"
              required
              type="text"
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-foreground">
              Password
            </span>
            <input
              autoComplete="current-password"
              className="mt-2 min-h-11 w-full rounded-lg border border-input-border bg-card px-3 py-2 text-foreground outline-none transition-colors placeholder:text-muted focus:border-brand focus:ring-2 focus:ring-soft-blue"
              name="password"
              required
              type="password"
            />
          </label>

          <Button className="w-full" pendingLabel="Signing in..." type="submit">
            Sign in
          </Button>
        </form>
      </Card>
    </main>
  );
}
