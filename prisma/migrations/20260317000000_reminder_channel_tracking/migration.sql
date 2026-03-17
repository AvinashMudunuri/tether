-- Add channel-specific sent flags
ALTER TABLE "Reminder" ADD COLUMN "emailSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reminder" ADD COLUMN "whatsappSent" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Reminder" ADD COLUMN "pushSent" BOOLEAN NOT NULL DEFAULT false;
