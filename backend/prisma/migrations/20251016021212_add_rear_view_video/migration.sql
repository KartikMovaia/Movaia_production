-- AlterTable
ALTER TABLE "Analysis" ADD COLUMN     "rearViewVideoUploaded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "videoRearViewFileName" TEXT,
ADD COLUMN     "videoRearViewUrl" TEXT;
