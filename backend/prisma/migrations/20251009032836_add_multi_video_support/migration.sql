/*
  Warnings:

  - You are about to drop the column `aiInsights` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `cadence` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `footStrike` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `groundContactTime` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `injuryRiskScore` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `metricsJson` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `performanceScore` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `recommendations` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `strideLength` on the `Analysis` table. All the data in the column will be lost.
  - You are about to drop the column `verticalOscillation` on the `Analysis` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Analysis" DROP COLUMN "aiInsights",
DROP COLUMN "cadence",
DROP COLUMN "footStrike",
DROP COLUMN "groundContactTime",
DROP COLUMN "injuryRiskScore",
DROP COLUMN "metricsJson",
DROP COLUMN "performanceScore",
DROP COLUMN "recommendations",
DROP COLUMN "strideLength",
DROP COLUMN "verticalOscillation",
ADD COLUMN     "leftToRightVideoUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "normalVideoUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rightToLeftVideoUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoLeftToRightDuration" DOUBLE PRECISION,
ADD COLUMN     "videoLeftToRightFileName" TEXT,
ADD COLUMN     "videoLeftToRightFileSize" INTEGER,
ADD COLUMN     "videoLeftToRightUrl" TEXT,
ADD COLUMN     "videoRightToLeftDuration" DOUBLE PRECISION,
ADD COLUMN     "videoRightToLeftFileName" TEXT,
ADD COLUMN     "videoRightToLeftFileSize" INTEGER,
ADD COLUMN     "videoRightToLeftUrl" TEXT;
