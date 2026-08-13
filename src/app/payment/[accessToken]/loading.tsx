export default function PaymentLoading() {
  return (
    <main className="container-page py-10 md:py-14" id="main-content">
      <div className="mx-auto max-w-3xl animate-pulse space-y-4">
        <div className="h-48 rounded-[var(--radius-xl)] bg-surface-muted" />
        <div className="h-64 rounded-[var(--radius-xl)] bg-surface-muted" />
      </div>
    </main>
  );
}
