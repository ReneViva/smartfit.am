import Link from "next/link";

import { SmartfitLogo } from "../brand/smartfit-logo";

type PublicFooterProps = {
  address: string | null;
  contactNumber: string | null;
  gymName: string;
  instagramLink: string | null;
  mapLink: string | null;
  whatsappLink: string | null;
};

const footerLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/coaches", label: "Coaches" },
  { href: "/packages", label: "Packages" },
  { href: "/gallery", label: "Gallery" },
  { href: "/contact", label: "Contact" },
];

function phoneHref(value: string | null) {
  const dialable = value?.replace(/[^\d+*#,;]/g, "");
  return dialable ? `tel:${dialable}` : null;
}

export function PublicFooter({
  address,
  contactNumber,
  gymName,
  instagramLink,
  mapLink,
  whatsappLink,
}: PublicFooterProps) {
  const callLink = phoneHref(contactNumber);
  const contactLinks = [
    callLink ? { href: callLink, label: contactNumber ?? "Call" } : null,
    whatsappLink ? { href: whatsappLink, label: "WhatsApp" } : null,
    instagramLink ? { href: instagramLink, label: "Instagram" } : null,
    mapLink ? { href: mapLink, label: "Directions" } : null,
  ].filter((link): link is { href: string; label: string } => Boolean(link));

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[1.3fr_0.7fr_1fr]">
        <div>
          <Link
            aria-label="Smartfit.am home"
            className="inline-flex rounded-lg bg-logo-surface px-2 py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            href="/"
          >
            <SmartfitLogo className="h-12 w-auto max-w-44 object-contain" />
          </Link>
          <p className="mt-5 max-w-sm text-sm leading-7 text-secondary">
            A focused, welcoming place to train, build healthy habits, and
            keep moving toward stronger days.
          </p>
          {address ? (
            <p className="mt-4 max-w-sm [overflow-wrap:anywhere] text-sm leading-6 text-secondary">
              {address}
            </p>
          ) : null}
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
            Explore
          </p>
          <nav className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm font-semibold">
            {footerLinks.map((link) => (
              <Link
                className="w-fit text-secondary transition-colors hover:text-brand"
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-brand">
            Plan your visit
          </p>
          <Link
            className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white transition-[background-color,transform] hover:-translate-y-0.5 hover:bg-primary-hover"
            href="/our-app"
          >
            Check live occupancy
          </Link>
          {contactLinks.length ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {contactLinks.map((link) => (
                <a
                  className="inline-flex min-h-10 max-w-full items-center rounded-full border border-border bg-page px-3 py-2 text-center text-sm font-semibold text-secondary [overflow-wrap:anywhere] transition-[background-color,border-color,color,transform] hover:-translate-y-0.5 hover:border-brand hover:bg-soft-blue hover:text-brand"
                  href={link.href}
                  key={link.label}
                  rel={link.href.startsWith("http") ? "noreferrer" : undefined}
                  target={link.href.startsWith("http") ? "_blank" : undefined}
                >
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-5 py-5 text-xs text-muted sm:px-8">
          <span>
            © {new Date().getFullYear()} {gymName}. All rights reserved.
          </span>
          <span>Move. Train. Feel stronger.</span>
        </div>
      </div>
    </footer>
  );
}
