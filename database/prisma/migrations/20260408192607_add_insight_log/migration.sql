/*
  Warnings:

  - You are about to drop the `anomaly_record` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "anomaly_record";

-- CreateTable
CREATE TABLE "insight_log" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_query" TEXT NOT NULL,
    "system_response" TEXT NOT NULL,
    "input_tokens" INTEGER NOT NULL,
    "output_tokens" INTEGER NOT NULL,
    "tools_called" JSONB,

    CONSTRAINT "insight_log_pkey" PRIMARY KEY ("id")
);
