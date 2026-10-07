/*
  Warnings:

  - You are about to drop the column `actualHours` on the `Activity` table. All the data in the column will be lost.
  - You are about to drop the column `estimatedHours` on the `Activity` table. All the data in the column will be lost.
  - Added the required column `date` to the `Activity` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Activity` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ActivityStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'MONTHLY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActivityCategory" ADD VALUE 'LAB';
ALTER TYPE "ActivityCategory" ADD VALUE 'PROJECT_SUPERVISION';
ALTER TYPE "ActivityCategory" ADD VALUE 'ADMINISTRATION';

-- AlterTable
ALTER TABLE "Activity" DROP COLUMN "actualHours",
DROP COLUMN "estimatedHours",
ADD COLUMN     "actualMinutes" INTEGER,
ADD COLUMN     "courseId" TEXT,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "estimatedMinutes" INTEGER,
ADD COLUMN     "isArchived" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isRecurring" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recurrenceEndDate" TIMESTAMP(3),
ADD COLUMN     "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "status" "ActivityStatus" NOT NULL DEFAULT 'PLANNED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "Activity" ADD CONSTRAINT "Activity_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;
