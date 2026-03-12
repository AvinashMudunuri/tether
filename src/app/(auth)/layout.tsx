export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <main id="main-content" className="w-full max-w-md" role="main">
        {children}
      </main>
    </div>
  );
}
