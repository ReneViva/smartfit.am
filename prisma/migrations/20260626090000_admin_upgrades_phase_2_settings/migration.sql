ALTER TABLE "GymSettings"
ADD COLUMN "workingScheduleText" TEXT,
ADD COLUMN "telegramLink" TEXT,
ADD COLUMN "showTelegramInPublicLinks" BOOLEAN NOT NULL DEFAULT false;
