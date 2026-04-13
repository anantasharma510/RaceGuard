-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "body" TEXT,
    "concurrency" INTEGER NOT NULL,
    "totalRequests" INTEGER NOT NULL,
    "invariantRule" TEXT,
    "status" TEXT NOT NULL DEFAULT 'running',
    "summary" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME
);

-- CreateTable
CREATE TABLE "RequestEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testRunId" TEXT NOT NULL,
    "requestNumber" INTEGER NOT NULL,
    "payload" TEXT,
    "statusCode" INTEGER,
    "responseBody" TEXT,
    "latencyMs" INTEGER,
    "isViolation" BOOLEAN NOT NULL DEFAULT false,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RequestEvent_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InvariantCheck" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testRunId" TEXT NOT NULL,
    "requestEventId" TEXT NOT NULL,
    "rule" TEXT NOT NULL,
    "actualValue" TEXT,
    "passed" BOOLEAN NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "InvariantCheck_requestEventId_fkey" FOREIGN KEY ("requestEventId") REFERENCES "RequestEvent" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reproducer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "testRunId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Reproducer_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "InvariantCheck_requestEventId_key" ON "InvariantCheck"("requestEventId");

-- CreateIndex
CREATE UNIQUE INDEX "Reproducer_testRunId_key" ON "Reproducer"("testRunId");
