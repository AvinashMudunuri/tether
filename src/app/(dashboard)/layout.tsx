import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";
import { DashboardNav } from "@/components/dashboard-nav";
import { QuickCaptureBar } from "@/components/quick-capture-bar";
import { NotificationOnboardingModal } from "@/components/notification-onboarding-modal";
import { shouldShowNotificationOnboarding } from "@/lib/notification-onboarding";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header
        className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
        role="banner"
      >
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard"
              className="flex flex-col items-start"
            >
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                Tetherly
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
                Never miss what matters.
              </span>
            </Link>
            <DashboardNav />
            <QuickCaptureBar />
          </div>
          <UserMenu user={user} signOut={signOut} />
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-4 py-8" role="main">
        {children}
      </main>

      <NotificationOnboardingModal
        show={shouldShowNotificationOnboarding(
          user.user_metadata?.notification_preferences
        )}
      />
    </div>
  );
}
