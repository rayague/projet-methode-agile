export function AppBackground() {
  return (
    <div
      aria-hidden="true"
      className="app-background pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      <div className="absolute inset-0 app-grid opacity-70" />
      <div
        className="aurora-blob animate-aurora-one -left-40 -top-44 size-[32rem]"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--accent-rgb), 0.55), transparent 68%)",
        }}
      />
      <div
        className="aurora-blob animate-aurora-two -right-32 top-[-6rem] size-[28rem]"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--accent-2-rgb), 0.45), transparent 68%)",
        }}
      />
      <div
        className="aurora-blob animate-aurora-one bottom-[-16rem] left-1/3 size-[34rem] opacity-30"
        style={{
          background:
            "radial-gradient(circle, rgba(var(--accent-rgb), 0.45), transparent 70%)",
        }}
      />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_20%,#05050a_88%)]" />
    </div>
  );
}
