import type { SVGProps } from "react";

export type AdminIconName =
  | "analytics"
  | "categories"
  | "coaches"
  | "content"
  | "customers"
  | "data"
  | "gallery"
  | "logs"
  | "monitor"
  | "notes"
  | "overview"
  | "packages"
  | "settings";

type AdminIconProps = SVGProps<SVGSVGElement> & {
  name: AdminIconName;
};

export function AdminIcon({ name, ...props }: AdminIconProps) {
  const common = {
    "aria-hidden": true,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
    viewBox: "0 0 24 24",
  };

  return (
    <svg {...common} {...props}>
      {name === "overview" ? (
        <>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-7" />
          <path d="M22 19H2" />
        </>
      ) : null}
      {name === "settings" ? (
        <>
          <path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z" />
          <path d="M19.4 15a1.8 1.8 0 0 0 .36 1.98l.05.05a2.1 2.1 0 0 1-2.97 2.97l-.05-.05a1.8 1.8 0 0 0-1.98-.36 1.8 1.8 0 0 0-1.08 1.65V21a2.1 2.1 0 0 1-4.2 0v-.07A1.8 1.8 0 0 0 9 19.28a1.8 1.8 0 0 0-1.98.36l-.05.05A2.1 2.1 0 0 1 4 16.72l.05-.05A1.8 1.8 0 0 0 4.4 15a1.8 1.8 0 0 0-1.65-1.08H2.7a2.1 2.1 0 0 1 0-4.2h.07A1.8 1.8 0 0 0 4.4 8 1.8 1.8 0 0 0 4.04 6l-.05-.05A2.1 2.1 0 0 1 6.96 3l.05.05A1.8 1.8 0 0 0 9 3.4a1.8 1.8 0 0 0 1.08-1.65V1.7a2.1 2.1 0 0 1 4.2 0v.07A1.8 1.8 0 0 0 15 3.4a1.8 1.8 0 0 0 1.98-.36l.05-.05A2.1 2.1 0 0 1 20 5.96l-.05.05A1.8 1.8 0 0 0 19.6 8c.18.7.8 1.2 1.52 1.2h.18a2.1 2.1 0 0 1 0 4.2h-.07A1.8 1.8 0 0 0 19.4 15Z" />
        </>
      ) : null}
      {name === "content" ? (
        <>
          <path d="M6 3h9l3 3v15H6z" />
          <path d="M15 3v4h4" />
          <path d="M9 12h6" />
          <path d="M9 16h4" />
        </>
      ) : null}
      {name === "gallery" ? (
        <>
          <rect height="14" rx="2" width="18" x="3" y="5" />
          <path d="m7 15 3-3 3 3 2-2 3 3" />
          <path d="M8.5 9.5h.01" />
        </>
      ) : null}
      {name === "coaches" ? (
        <>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M4 21a8 8 0 0 1 16 0" />
          <path d="M17.5 7.5h3" />
          <path d="M19 6v3" />
        </>
      ) : null}
      {name === "packages" ? (
        <>
          <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
          <path d="M4.5 8 12 12.2 19.5 8" />
          <path d="M12 12.2V21" />
        </>
      ) : null}
      {name === "categories" ? (
        <>
          <path d="M4 6h7" />
          <path d="M4 12h10" />
          <path d="M4 18h7" />
          <path d="m16 7 4 4-7 7H9v-4z" />
        </>
      ) : null}
      {name === "customers" ? (
        <>
          <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M2.5 20a6.5 6.5 0 0 1 13 0" />
          <path d="M17 10a2.5 2.5 0 1 0 0-5" />
          <path d="M17.5 20a5 5 0 0 0-3-4.5" />
        </>
      ) : null}
      {name === "notes" ? (
        <>
          <path d="M6 3h12v18H6z" />
          <path d="M9 8h6" />
          <path d="M9 12h6" />
          <path d="M9 16h3" />
        </>
      ) : null}
      {name === "logs" ? (
        <>
          <path d="M5 4h14v16H5z" />
          <path d="M8 8h8" />
          <path d="M8 12h8" />
          <path d="M8 16h5" />
        </>
      ) : null}
      {name === "data" ? (
        <>
          <path d="M12 3v12" />
          <path d="m7 10 5 5 5-5" />
          <path d="M5 21h14" />
        </>
      ) : null}
      {name === "analytics" ? (
        <>
          <path d="M4 19V5" />
          <path d="M9 19v-8" />
          <path d="M14 19V8" />
          <path d="M19 19v-5" />
        </>
      ) : null}
      {name === "monitor" ? (
        <>
          <rect height="11" rx="2" width="18" x="3" y="4" />
          <path d="M8 20h8" />
          <path d="M12 15v5" />
          <path d="m7 11 3-3 2 2 3-4 2 3" />
        </>
      ) : null}
    </svg>
  );
}
