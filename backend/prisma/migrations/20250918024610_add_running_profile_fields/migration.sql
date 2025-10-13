-- AlterTable
ALTER TABLE "User" ADD COLUMN     "gender" TEXT,
ADD COLUMN     "injuryHistory" JSONB,
ADD COLUMN     "personalBest" JSONB,
ADD COLUMN     "primaryGoal" TEXT,
ADD COLUMN     "unitPreference" TEXT;
