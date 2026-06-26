"use client";

import { Button } from "../ui/button";

function openPanel(panelId: string) {
  const panel = document.getElementById(panelId);

  if (panel instanceof HTMLDetailsElement) {
    panel.open = true;
  }

  panel?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function CustomerWorkspaceActions() {
  return (
    <div className="mt-5 flex flex-wrap gap-2">
      <Button onClick={() => openPanel("edit-customer-profile")}>
        Edit customer profile
      </Button>
      <Button
        onClick={() => openPanel("customer-notes")}
        variant="neutral"
      >
        Add customer note
      </Button>
      <Button
        onClick={() => openPanel("customer-packages")}
        variant="success"
      >
        Membership & Services
      </Button>
      <Button
        onClick={() => openPanel("customer-documents")}
        variant="neutral"
      >
        Documents
      </Button>
      <Button
        onClick={() => openPanel("customer-package-history")}
        variant="neutral"
      >
        Package history
      </Button>
      <Button
        onClick={() => openPanel("customer-visits")}
        variant="neutral"
      >
        Recent visits
      </Button>
    </div>
  );
}
