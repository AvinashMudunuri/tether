"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useFirebasePush } from "@/hooks/use-firebase-push";

export function NotificationOnboardingModal({
  show,
}: {
  show: boolean;
}) {
  const router = useRouter();
  const { requestToken, loading: pushLoading, error: pushError, isSupported: pushSupported } = useFirebasePush();
  const [emailReminders, setEmailReminders] = useState(true);
  const [smsReminders, setSmsReminders] = useState(false);
  const [smsNumber, setSmsNumber] = useState("");
  const [pushNotifications, setPushNotifications] = useState(false);
  const [fcmToken, setFcmToken] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleEnablePush() {
    const token = await requestToken();
    if (token) {
      setFcmToken(token);
      setPushNotifications(true);
    } else if (pushError) {
      toast.error(pushError);
    }
  }

  async function handleContinue() {
    if (smsReminders && !smsNumber.trim()) {
      toast.error("Phone number is required for SMS reminders");
      return;
    }
    if (!emailReminders && !smsReminders && !pushNotifications) {
      toast.error("Please select at least one notification option");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: {
          emailReminders,
          smsReminders,
          smsNumber: smsReminders ? smsNumber.trim() : "",
          pushNotifications,
          fcmToken: pushNotifications ? fcmToken : "",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Notification preferences saved");
      router.refresh();
    }
  }

  async function handlePushToggle(checked: boolean) {
    if (checked) {
      await handleEnablePush();
    } else {
      setPushNotifications(false);
      setFcmToken("");
    }
  }

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-labelledby="onboarding-title"
    >
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full">
        <h2
          id="onboarding-title"
          className="text-xl font-semibold text-slate-900 dark:text-white mb-1"
        >
          Set up reminders
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
          Choose how you want to receive appointment reminders. Select at least one option.
        </p>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={emailReminders}
              onChange={(e) => setEmailReminders(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-700 dark:text-slate-300">
              Email reminders
            </span>
          </label>

          <div className="space-y-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={smsReminders}
                onChange={(e) => setSmsReminders(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-slate-600" aria-hidden />
                SMS reminders
              </span>
            </label>
            {smsReminders && (
              <input
                type="tel"
                value={smsNumber}
                onChange={(e) => setSmsNumber(e.target.value)}
                placeholder="+91 9876543210"
                className="ml-7 w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                aria-label="Phone number with country code"
              />
            )}
          </div>

          {pushSupported ? (
            <>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushNotifications}
                  onChange={(e) => handlePushToggle(e.target.checked)}
                  disabled={pushLoading || loading}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 disabled:opacity-50"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-blue-600" aria-hidden />
                  Push notifications (browser)
                </span>
              </label>
              {pushLoading && (
                <p className="text-sm text-slate-500">Requesting permission…</p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-400" aria-hidden />
              Push notifications are not available in this browser.
            </p>
          )}
        </div>

        <button
          onClick={handleContinue}
          disabled={loading}
          className="mt-6 w-full px-4 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50"
        >
          {loading ? "Saving…" : "Continue"}
        </button>
      </div>
    </div>
  );
}
