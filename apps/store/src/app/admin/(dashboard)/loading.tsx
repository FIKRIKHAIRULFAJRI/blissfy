export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-canvas px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="h-8 w-56 rounded-[var(--radius-sm)] bg-surface-muted" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              className="h-32 rounded-[var(--radius-md)] bg-surface-muted"
              key={index}
            />
          ))}
        </div>
        <div className="h-80 rounded-[var(--radius-lg)] bg-surface-muted" />
      </div>
    </main>
  );
}
