-- AlterTable
ALTER TABLE "files" ADD COLUMN "sakaiRef" TEXT;
ALTER TABLE "files" ADD COLUMN "sakaiUrl" TEXT;
ALTER TABLE "files" ADD COLUMN "fileSource" TEXT DEFAULT 'local';
