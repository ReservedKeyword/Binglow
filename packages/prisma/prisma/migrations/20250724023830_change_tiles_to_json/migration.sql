/*
  Warnings:

  - Changed the type of `tiles` on the `BoardTemplate` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "BoardTemplate" DROP COLUMN "tiles",
ADD COLUMN     "tiles" JSONB NOT NULL;
