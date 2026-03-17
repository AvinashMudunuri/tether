type NotificationPrefs = {
  emailReminders?: boolean;
  smsReminders?: boolean;
  smsNumber?: string;
  pushNotifications?: boolean;
  fcmToken?: string;
};

export function shouldShowNotificationOnboarding(
  prefs: NotificationPrefs | null | undefined
): boolean {
  return prefs === undefined || prefs === null;
}
