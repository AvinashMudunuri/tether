"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, Smartphone } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useFirebasePush } from "@/hooks/use-firebase-push";

type NotificationPrefs = {
  emailReminders?: boolean;
  smsReminders?: boolean;
  smsNumber?: string;
  whatsappReminders?: boolean;
  whatsappNumber?: string;
  pushNotifications?: boolean;
  fcmToken?: string;
};

export function ProfileNotificationSettings({
  initialPrefs,
}: {
  initialPrefs: NotificationPrefs;
}) {
  const router = useRouter();
  const { requestToken, loading: pushLoading, error: pushError, isSupported: pushSupported } = useFirebasePush();
  const [emailReminders, setEmailReminders] = useState(
    initialPrefs.emailReminders ?? true
  );
  const [smsReminders, setSmsReminders] = useState(
    initialPrefs.smsReminders ?? initialPrefs.whatsappReminders ?? false
  );
  const [smsNumber, setSmsNumber] = useState(
    initialPrefs.smsNumber ?? initialPrefs.whatsappNumber ?? ""
  );
  const [pushNotifications, setPushNotifications] = useState(
    initialPrefs.pushNotifications ?? false
  );
  const [fcmToken, setFcmToken] = useState(initialPrefs.fcmToken ?? "");
  const [loading, setLoading] = useState(false);

  async function handleEnablePush() {
    const token = await requestToken();
    if (token) {
      setFcmToken(token);
      setPushNotifications(true);
      await savePrefs(true, token);
    } else if (pushError) {
      toast.error(pushError);
    }
  }

  async function savePrefs(push: boolean, token: string) {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: {
          emailReminders,
          smsReminders,
          smsNumber: smsReminders ? smsNumber.trim() : "",
          pushNotifications: push,
          fcmToken: push ? token : "",
        },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Notification settings saved");
      router.refresh();
    }
  }

  async function handleSave() {
    if (smsReminders && !smsNumber.trim()) {
      toast.error("Phone number is required for SMS reminders");
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
      toast.success("Notification settings saved");
      router.refresh();
    }
  }

  async function handlePushToggle(checked: boolean) {
    if (checked) {
      await handleEnablePush();
    } else {
      setPushNotifications(false);
      setFcmToken("");
      setLoading(true);
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: {
          emailReminders,
          smsReminders,
          smsNumber: smsReminders ? smsNumber.trim() : "",
          pushNotifications: false,
          fcmToken: "",
        },
      },
      });
      setLoading(false);
      if (error) toast.error(error.message);
      else {
        toast.success("Push notifications disabled");
        router.refresh();
      }
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
        <Bell className="w-4 h-4" aria-hidden />
        Notifications
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Choose how you want to receive appointment reminders. You can enable both.
      </p>

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
            className="ml-7 w-full max-w-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
          Push notifications are not available in this browser. Try Safari on iOS or Chrome on desktop.
        </p>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save settings"}
      </button>
    </div>
  );
}
