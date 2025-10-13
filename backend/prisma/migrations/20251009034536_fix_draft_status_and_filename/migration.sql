-- AlterEnum
ALTER TYPE "AnalysisStatus" ADD VALUE 'DRAFT';

-- AlterTable
ALTER TABLE "Analysis" ALTER COLUMN "videoFileName" DROP NOT NULL;
