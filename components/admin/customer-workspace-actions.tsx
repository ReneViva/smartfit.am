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
        onClick={() => openPanel("assign-customer-package")}
        variant="success"
      >
        Assign / Renew package
      </Button>
    </div>
  );
}
