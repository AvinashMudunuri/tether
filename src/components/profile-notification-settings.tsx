"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

type NotificationPrefs = {
  emailReminders?: boolean;
  whatsappReminders?: boolean;
  whatsappNumber?: string;
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
  const [whatsappReminders, setWhatsappReminders] = useState(
    initialPrefs.whatsappReminders ?? false
  );
  const [whatsappNumber, setWhatsappNumber] = useState(
    initialPrefs.whatsappNumber ?? ""
  );
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    if (whatsappReminders && !whatsappNumber.trim()) {
      toast.error("WhatsApp number is required for WhatsApp reminders");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({
      data: {
        notification_preferences: {
          emailReminders,
          whatsappReminders,
          whatsappNumber: whatsappReminders ? whatsappNumber.trim() : "",
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
            checked={whatsappReminders}
            onChange={(e) => setWhatsappReminders(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-green-600" aria-hidden />
            WhatsApp reminders
          </span>
        </label>
        {whatsappReminders && (
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => setWhatsappNumber(e.target.value)}
            placeholder="+91 9876543210"
            className="ml-7 w-full max-w-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            aria-label="WhatsApp number with country code"
          />
        )}
      </div>

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
