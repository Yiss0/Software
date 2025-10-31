-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('NOTIFICATION', 'ALARM');

-- AlterTable
ALTER TABLE "Schedule" ADD COLUMN     "alertType" "AlertType" NOT NULL DEFAULT 'NOTIFICATION';
