-- AlterTable
ALTER TABLE "IntakeLog" ALTER COLUMN "scheduledFor" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "actionAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Medication" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "deletedAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "Schedule" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "createdAt" SET DATA TYPE TIMESTAMPTZ,
ALTER COLUMN "updatedAt" SET DATA TYPE TIMESTAMPTZ;

-- CreateTable
CREATE TABLE "PatientCaregiver" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "caregiverId" TEXT NOT NULL,
    "relation" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatientCaregiver_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatientCaregiver_caregiverId_idx" ON "PatientCaregiver"("caregiverId");

-- CreateIndex
CREATE INDEX "PatientCaregiver_patientId_idx" ON "PatientCaregiver"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "PatientCaregiver_patientId_caregiverId_key" ON "PatientCaregiver"("patientId", "caregiverId");

-- CreateIndex
CREATE INDEX "IntakeLog_medicationId_scheduledFor_idx" ON "IntakeLog"("medicationId", "scheduledFor");

-- CreateIndex
CREATE INDEX "Medication_patientId_idx" ON "Medication"("patientId");

-- CreateIndex
CREATE INDEX "Schedule_medicationId_idx" ON "Schedule"("medicationId");

-- AddForeignKey
ALTER TABLE "PatientCaregiver" ADD CONSTRAINT "PatientCaregiver_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PatientCaregiver" ADD CONSTRAINT "PatientCaregiver_caregiverId_fkey" FOREIGN KEY ("caregiverId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
