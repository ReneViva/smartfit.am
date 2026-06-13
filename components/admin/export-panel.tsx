import { exportCategories } from "../../lib/admin/export-data";
import { Card } from "../ui/card";

export function ExportPanel() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {exportCategories.map((category) => (
        <Card className="flex h-full flex-col" key={category.type}>
          <h3 className="text-xl font-bold text-foreground">{category.label}</h3>
          <p className="mt-2 flex-1 text-sm leading-6 text-secondary">
            {category.description}
          </p>
          <a
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
            href={`/api/admin/export?type=${encodeURIComponent(category.type)}`}
          >
            Download Excel
          </a>
        </Card>
      ))}
    </div>
  );
}
