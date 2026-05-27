-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "region" TEXT,
    "product" TEXT,
    "purpose" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Activity" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Activity_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SdgAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "socialFunctions" TEXT NOT NULL,
    "publicMeaning" TEXT NOT NULL,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SdgAnalysis_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SdgMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "sdg" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "keywords" TEXT NOT NULL,
    "rationale" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SdgMatch_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "SdgAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GeneratedContent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "analysisId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "hashtags" TEXT NOT NULL,
    "imagePrompt" TEXT,
    "editedByUser" BOOLEAN NOT NULL DEFAULT false,
    "usedFallback" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GeneratedContent_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "SdgAnalysis" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Activity_companyId_idx" ON "Activity"("companyId");

-- CreateIndex
CREATE INDEX "SdgAnalysis_companyId_idx" ON "SdgAnalysis"("companyId");

-- CreateIndex
CREATE INDEX "SdgAnalysis_createdAt_idx" ON "SdgAnalysis"("createdAt");

-- CreateIndex
CREATE INDEX "SdgMatch_analysisId_idx" ON "SdgMatch"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "SdgMatch_analysisId_sdg_key" ON "SdgMatch"("analysisId", "sdg");

-- CreateIndex
CREATE INDEX "GeneratedContent_analysisId_idx" ON "GeneratedContent"("analysisId");

-- CreateIndex
CREATE INDEX "GeneratedContent_type_idx" ON "GeneratedContent"("type");
