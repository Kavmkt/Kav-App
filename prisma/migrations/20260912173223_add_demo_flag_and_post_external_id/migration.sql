-- AlterTable
ALTER TABLE "AdSpendSnapshot" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "MetricSnapshot" ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Post" ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "isDemo" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "Post_externalId_key" ON "Post"("externalId");
