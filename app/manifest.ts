import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    background_color: "#f5f7fa",
    description: "Smartfit.am live gym occupancy and public information",
    display: "standalone",
    icons: [
      {
        sizes: "any",
        src: "/logo/S.svg",
        type: "image/svg+xml",
      },
    ],
    name: "Smartfit.am",
    short_name: "Smartfit",
    start_url: "/our-app",
    theme_color: "#009bdf",
  };
}
