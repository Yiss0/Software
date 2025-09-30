/*
  Warnings:

  - You are about to drop the column `deviceOffsetMin` on the `IntakeLog` table. All the data in the column will be lost.
  - You are about to drop the column `snoozes` on the `IntakeLog` table. All the data in the column will be lost.
  - You are about to drop the column `daysCsv` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `maxSnoozeMin` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `repeatEveryMin` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `snoozeMin` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `timeLocal` on the `Schedule` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `User` table. All the data in the column will be lost.
  - Added the required column `frequencyType` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `time` to the `Schedule` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firstName` to the `User` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lastName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Medication" ADD COLUMN "quantity" INTEGER;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_IntakeLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicationId" TEXT NOT NULL,
    "scheduleId" TEXT,
    "scheduledFor" DATETIME NOT NULL,
    "action" TEXT NOT NULL,
    "actionAt" DATETIME NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IntakeLog_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IntakeLog_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_IntakeLog" ("action", "actionAt", "createdAt", "id", "medicationId", "note", "scheduleId", "scheduledFor") SELECT "action", "actionAt", "createdAt", "id", "medicationId", "note", "scheduleId", "scheduledFor" FROM "IntakeLog";
DROP TABLE "IntakeLog";
ALTER TABLE "new_IntakeLog" RENAME TO "IntakeLog";
CREATE TABLE "new_Schedule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "medicationId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "frequencyType" TEXT NOT NULL,
    "frequencyValue" INTEGER,
    "daysOfWeek" TEXT,
    "endDate" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Schedule_medicationId_fkey" FOREIGN KEY ("medicationId") REFERENCES "Medication" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Schedule" ("active", "createdAt", "id", "medicationId", "updatedAt") SELECT "active", "createdAt", "id", "medicationId", "updatedAt" FROM "Schedule";
DROP TABLE "Schedule";
ALTER TABLE "new_Schedule" RENAME TO "Schedule";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PATIENT',
    "password" TEXT,
    "birthDate" TEXT,
    "address" TEXT,
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "medicalConditions" TEXT,
    "allergies" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "id", "password", "phone", "role", "updatedAt") SELECT "createdAt", "email", "id", "password", "phone", "role", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
