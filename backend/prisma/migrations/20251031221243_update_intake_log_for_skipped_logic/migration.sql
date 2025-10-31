/*
  Warnings:

  - A unique constraint covering the columns `[medicationId,scheduledFor]` on the table `IntakeLog` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "IntakeLog" ALTER COLUMN "actionAt" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "IntakeLog_medicationId_scheduledFor_key" ON "IntakeLog"("medicationId", "scheduledFor");
