-- Add new columns as nullable first
ALTER TABLE "Reminder" ADD COLUMN "type" TEXT;
ALTER TABLE "Reminder" ADD COLUMN "reminderTime" TIMESTAMP(3);

-- Migrate existing data
UPDATE "Reminder" r
SET
  "type" = CASE
    WHEN r."minutesBefore" = 2880 THEN '2_day'
    WHEN r."minutesBefore" = 1440 THEN '1_day'
    WHEN r."minutesBefore" IN (120, 60) THEN '1_hour'
    WHEN r."minutesBefore" = 30 THEN '30_min'
    WHEN r."minutesBefore" = 15 THEN '15_min'
    ELSE '1_hour'
  END,
  "reminderTime" = (
    SELECT (a."date" + a."time"::time)::timestamp
      + (COALESCE(a."timezoneOffset", 0) || ' minutes')::interval
      - (r."minutesBefore" || ' minutes')::interval
    FROM "Appointment" a
    WHERE a."id" = r."appointmentId"
  )
WHERE EXISTS (SELECT 1 FROM "Appointment" a WHERE a."id" = r."appointmentId");

-- Make columns required
ALTER TABLE "Reminder" ALTER COLUMN "type" SET NOT NULL;
ALTER TABLE "Reminder" ALTER COLUMN "reminderTime" SET NOT NULL;

-- Drop old column
ALTER TABLE "Reminder" DROP COLUMN "minutesBefore";
