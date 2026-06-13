import { ExportPanel } from "../../../components/admin/export-panel";

export default function DataPage() {
  return (
    <>
      <header>
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">
          Data exports
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
          Download operational data
        </h2>
        <p className="mt-3 max-w-3xl leading-7 text-secondary">
          Generate private Excel files on demand. Each export includes all
          records in its category and is created only for this download.
        </p>
      </header>

      <section className="mt-8">
        <ExportPanel />
      </section>
    </>
  );
}
