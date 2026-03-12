"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type NotificationPrefs = {
  emailReminders?: boolean;
};

export function ProfileNotificationSettings({
  initialPrefs,
}: {
  initialPrefs: NotificationPrefs;
}) {
  const router = useRouter();
  const [emailReminders, setEmailReminders] = useState(
    initialPrefs.emailReminders ?? true
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: {
          emailReminders,
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

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">
        Notifications
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Choose how you want to be notified. On the hobby plan, email reminders
        are sent for upcoming appointments.
      </p>
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={emailReminders}
          onChange={(e) => setEmailReminders(e.target.checked)}
          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-slate-700 dark:text-slate-300">
          Email reminders for appointments (1 hour, 30 min, and 15 min before)
        </span>
      </label>
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
