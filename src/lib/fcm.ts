import admin from "firebase-admin";
import { readFileSync } from "fs";
import { resolve } from "path";

function getServiceAccount(): admin.ServiceAccount {
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (path) {
    const fullPath = resolve(process.cwd(), path);
    const content = readFileSync(fullPath, "utf-8");
    return JSON.parse(content) as admin.ServiceAccount;
  }
  const json = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_PATH is required for push notifications"
    );
  }
  return JSON.parse(json) as admin.ServiceAccount;
}

function getMessaging() {
  if (!admin.apps.length) {
    const parsed = getServiceAccount();
    admin.initializeApp({ credential: admin.credential.cert(parsed) });
  }
  return admin.messaging();
}

export async function sendPushNotification(params: {
  token: string;
  title: string;
  body: string;
  url?: string;
}): Promise<void> {
  const { token, title, body, url } = params;

  const message: admin.messaging.Message = {
    token,
    notification: {
      title,
      body,
    },
    data: url ? { url } : undefined,
    webpush: {
      fcmOptions: url ? { link: url } : undefined,
    },
  };

  await getMessaging().send(message);
}
