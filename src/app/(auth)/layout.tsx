export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Tetherly
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Never miss what matters.
        </p>
      </div>
      <main id="main-content" className="w-full max-w-md" role="main">
        {children}
      </main>
    </div>
  );
}
