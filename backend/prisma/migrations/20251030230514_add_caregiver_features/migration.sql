-- CreateEnum
CREATE TYPE "MedicationType" AS ENUM ('PILL', 'SYRUP', 'INHALER');

-- AlterTable
ALTER TABLE "Medication" ADD COLUMN     "type" "MedicationType" NOT NULL DEFAULT 'PILL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "pushToken" TEXT;
