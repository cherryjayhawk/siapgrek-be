-- CreateTable
CREATE TABLE "command_log" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "device_id" TEXT NOT NULL,
    "actuator" TEXT NOT NULL,
    "command_value" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'fuzzy-logic',

    CONSTRAINT "command_log_pkey" PRIMARY KEY ("id")
);
