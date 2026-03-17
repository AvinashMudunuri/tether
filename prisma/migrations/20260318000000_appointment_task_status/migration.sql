-- Appointment: add status
ALTER TABLE "Appointment" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'scheduled';

-- Task: add status, migrate from completed, drop completed
ALTER TABLE "Task" ADD COLUMN "status" TEXT;
UPDATE "Task" SET "status" = CASE WHEN "completed" = true THEN 'completed' ELSE 'pending' END;
ALTER TABLE "Task" ALTER COLUMN "status" SET NOT NULL;
ALTER TABLE "Task" ALTER COLUMN "status" SET DEFAULT 'pending';
ALTER TABLE "Task" DROP COLUMN "completed";
