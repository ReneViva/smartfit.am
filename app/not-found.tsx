import Link from "next/link";

import { PublicLayout } from "../components/layout/public-layout";

const primaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";
const secondaryLink =
  "inline-flex min-h-11 items-center justify-center rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-bold text-foreground transition-[border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand";

export default async function NotFound() {
  return (
    <PublicLayout>
      <section className="mx-auto grid min-h-[56vh] max-w-4xl place-items-center py-12 text-center sm:py-20">
        <div className="w-full">
          <p className="inline-flex rounded-full border border-border bg-card px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand shadow-sm">
            Smartfit.am
          </p>
          <p className="mt-8 text-7xl font-black leading-none tracking-tight text-brand sm:text-8xl">
            404
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-6xl">
            Page not found
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
            The public page you are looking for may have moved or the link may
            be mistyped. Continue from one of the main Smartfit.am pages.
          </p>
          <nav
            aria-label="Page not found recovery links"
            className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"
          >
            <Link className={primaryLink} href="/">
              Back to home
            </Link>
            <Link className={secondaryLink} href="/packages">
              Packages
            </Link>
            <Link className={secondaryLink} href="/contact">
              Contact
            </Link>
          </nav>
        </div>
      </section>
    </PublicLayout>
  );
}
