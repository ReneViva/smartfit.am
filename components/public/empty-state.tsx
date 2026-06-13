type EmptyStateProps = {
  children: string;
};

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-secondary">
      {children}
    </div>
  );
}
