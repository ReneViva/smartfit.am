import type { ReactNode } from "react";

import { getPublicSettings } from "../../lib/public-data";
import { PublicFooter } from "./public-footer";
import { PublicHeader } from "./public-header";

type PublicLayoutProps = {
  children: ReactNode;
  fullWidth?: boolean;
};

export async function PublicLayout({
  children,
  fullWidth = false,
}: PublicLayoutProps) {
  const settings = await getPublicSettings();

  return (
    <div className="public-site min-h-screen bg-page">
      <PublicHeader />

      <main
        className={
          fullWidth
            ? "w-full overflow-hidden"
            : "mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 sm:py-14"
        }
      >
        {children}
      </main>

      <PublicFooter
        address={settings?.address ?? null}
        contactNumber={settings?.contactNumber ?? null}
        gymName={settings?.gymName ?? "Smartfit.am"}
        instagramLink={settings?.instagramLink ?? null}
        mapLink={settings?.mapLink ?? null}
        whatsappLink={settings?.whatsappLink ?? null}
      />
    </div>
  );
}
