-- CreateEnum
CREATE TYPE "LoginStatus" AS ENUM ('SUCCESS', 'FAILED', 'LOCKED', 'PASSWORD_RESET', 'SUSPICIOUS');

-- CreateEnum
CREATE TYPE "AuthMethod" AS ENUM ('PASSWORD', 'GOOGLE', 'FACEBOOK', 'GITHUB', 'TOKEN', 'RECOVERY');

-- CreateTable
CREATE TABLE "login_histories" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "email" TEXT NOT NULL,
    "status" "LoginStatus" NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT NOT NULL,
    "userAgent" TEXT NOT NULL,
    "authMethod" "AuthMethod" NOT NULL DEFAULT 'PASSWORD',
    "details" JSONB,
    "location" JSONB,

    CONSTRAINT "login_histories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "login_histories_email_idx" ON "login_histories"("email");

-- CreateIndex
CREATE INDEX "login_histories_userId_idx" ON "login_histories"("userId");

-- CreateIndex
CREATE INDEX "login_histories_ipAddress_idx" ON "login_histories"("ipAddress");

-- CreateIndex
CREATE INDEX "login_histories_timestamp_idx" ON "login_histories"("timestamp");

-- CreateIndex
CREATE INDEX "login_histories_status_idx" ON "login_histories"("status");
