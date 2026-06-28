-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'AGENT',
    "avatar" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "employeeCode" TEXT,
    "department" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'th',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME
);

-- CreateTable
CREATE TABLE "CustomerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "customerCode" TEXT NOT NULL,
    "firstNameTh" TEXT,
    "lastNameTh" TEXT,
    "firstNameEn" TEXT,
    "lastNameEn" TEXT,
    "idCardNumber" TEXT,
    "dateOfBirth" DATETIME,
    "gender" TEXT,
    "occupation" TEXT,
    "maritalStatus" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "addressLine" TEXT,
    "subDistrict" TEXT,
    "district" TEXT,
    "province" TEXT,
    "postalCode" TEXT,
    "country" TEXT NOT NULL DEFAULT 'TH',
    "emergencyContact" TEXT,
    "emergencyPhone" TEXT,
    "healthInfo" TEXT,
    "notes" TEXT,
    "tags" TEXT,
    "referralSource" TEXT,
    "referralById" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CustomerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'NEW',
    "interestedProduct" TEXT,
    "estimatedValue" REAL,
    "notes" TEXT,
    "followUpAt" DATETIME,
    "customerId" TEXT,
    "agentId" TEXT NOT NULL,
    "convertedAt" DATETIME,
    "lostReason" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Lead_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Lead_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "InsuranceProduct" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionTh" TEXT,
    "descriptionEn" TEXT,
    "iconName" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "InsurancePlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "nameTh" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL,
    "descriptionTh" TEXT,
    "descriptionEn" TEXT,
    "minSumInsured" REAL NOT NULL DEFAULT 0,
    "maxSumInsured" REAL,
    "minAge" INTEGER,
    "maxAge" INTEGER,
    "coverageDetails" TEXT,
    "exclusions" TEXT,
    "features" TEXT,
    "basePremium" REAL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "InsurancePlan_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "planId" TEXT,
    "minAge" INTEGER NOT NULL,
    "maxAge" INTEGER NOT NULL,
    "baseRate" REAL NOT NULL,
    "multiplier" REAL NOT NULL DEFAULT 1.0,
    "genderFactor" REAL NOT NULL DEFAULT 1.0,
    "occupationFactor" REAL NOT NULL DEFAULT 1.0,
    "effectiveFrom" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effectiveTo" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RateCard_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RateCard_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InsurancePlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "quoteNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "gender" TEXT NOT NULL,
    "occupation" TEXT,
    "sumInsured" REAL NOT NULL,
    "premium" REAL NOT NULL,
    "coverageTerm" INTEGER NOT NULL,
    "paymentFreq" TEXT NOT NULL DEFAULT 'ANNUAL',
    "startDate" DATETIME,
    "endDate" DATETIME,
    "riderOptions" TEXT,
    "breakdown" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "validUntil" DATETIME,
    "notes" TEXT,
    "rejectionReason" TEXT,
    "convertedPolicyId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Quote_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Quote_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InsurancePlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyNumber" TEXT NOT NULL,
    "quoteId" TEXT,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "coverageTerm" INTEGER NOT NULL,
    "sumInsured" REAL NOT NULL,
    "premium" REAL NOT NULL,
    "paymentFreq" TEXT NOT NULL DEFAULT 'ANNUAL',
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "nextRenewalDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "cancellationDate" DATETIME,
    "cancellationReason" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Policy_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Policy_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Policy_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Policy_planId_fkey" FOREIGN KEY ("planId") REFERENCES "InsurancePlan" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Beneficiary" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policyId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "relation" TEXT NOT NULL,
    "idCard" TEXT,
    "birthDate" DATETIME,
    "percentage" REAL NOT NULL DEFAULT 100,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Beneficiary_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Claim" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimNumber" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "agentId" TEXT,
    "incidentDate" DATETIME NOT NULL,
    "reportDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "description" TEXT NOT NULL,
    "incidentPlace" TEXT,
    "policeReportNo" TEXT,
    "claimAmount" REAL NOT NULL,
    "approvedAmount" REAL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "rejectionReason" TEXT,
    "paymentDate" DATETIME,
    "paymentRef" TEXT,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Claim_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claim_productId_fkey" FOREIGN KEY ("productId") REFERENCES "InsuranceProduct" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claim_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Claim_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaimEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "note" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimEvent_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ClaimDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "claimId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "documentType" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClaimDocument_claimId_fkey" FOREIGN KEY ("claimId") REFERENCES "Claim" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClaimDocument_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "receiptNumber" TEXT NOT NULL,
    "policyId" TEXT,
    "customerId" TEXT,
    "amount" REAL NOT NULL,
    "method" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "dueDate" DATETIME,
    "reference" TEXT,
    "notes" TEXT,
    "receivedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Payment_receivedById_fkey" FOREIGN KEY ("receivedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Commission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "rate" REAL NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FIRST_YEAR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paidAt" DATETIME,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Commission_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Commission_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "customerId" TEXT,
    "uploadedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Document_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "CustomerProfile" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "details" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_employeeCode_key" ON "User"("employeeCode");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_userId_key" ON "CustomerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CustomerProfile_customerCode_key" ON "CustomerProfile"("customerCode");

-- CreateIndex
CREATE INDEX "CustomerProfile_customerCode_idx" ON "CustomerProfile"("customerCode");

-- CreateIndex
CREATE INDEX "CustomerProfile_phone_idx" ON "CustomerProfile"("phone");

-- CreateIndex
CREATE INDEX "CustomerProfile_email_idx" ON "CustomerProfile"("email");

-- CreateIndex
CREATE INDEX "Lead_status_idx" ON "Lead"("status");

-- CreateIndex
CREATE INDEX "Lead_agentId_idx" ON "Lead"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "InsuranceProduct_code_key" ON "InsuranceProduct"("code");

-- CreateIndex
CREATE INDEX "InsuranceProduct_type_idx" ON "InsuranceProduct"("type");

-- CreateIndex
CREATE UNIQUE INDEX "InsurancePlan_code_key" ON "InsurancePlan"("code");

-- CreateIndex
CREATE INDEX "InsurancePlan_productId_idx" ON "InsurancePlan"("productId");

-- CreateIndex
CREATE INDEX "RateCard_productId_idx" ON "RateCard"("productId");

-- CreateIndex
CREATE INDEX "RateCard_planId_idx" ON "RateCard"("planId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_quoteNumber_key" ON "Quote"("quoteNumber");

-- CreateIndex
CREATE INDEX "Quote_status_idx" ON "Quote"("status");

-- CreateIndex
CREATE INDEX "Quote_customerId_idx" ON "Quote"("customerId");

-- CreateIndex
CREATE INDEX "Quote_agentId_idx" ON "Quote"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "Policy_policyNumber_key" ON "Policy"("policyNumber");

-- CreateIndex
CREATE INDEX "Policy_policyNumber_idx" ON "Policy"("policyNumber");

-- CreateIndex
CREATE INDEX "Policy_status_idx" ON "Policy"("status");

-- CreateIndex
CREATE INDEX "Policy_customerId_idx" ON "Policy"("customerId");

-- CreateIndex
CREATE INDEX "Policy_agentId_idx" ON "Policy"("agentId");

-- CreateIndex
CREATE INDEX "Beneficiary_policyId_idx" ON "Beneficiary"("policyId");

-- CreateIndex
CREATE UNIQUE INDEX "Claim_claimNumber_key" ON "Claim"("claimNumber");

-- CreateIndex
CREATE INDEX "Claim_claimNumber_idx" ON "Claim"("claimNumber");

-- CreateIndex
CREATE INDEX "Claim_status_idx" ON "Claim"("status");

-- CreateIndex
CREATE INDEX "Claim_policyId_idx" ON "Claim"("policyId");

-- CreateIndex
CREATE INDEX "ClaimDocument_claimId_idx" ON "ClaimDocument"("claimId");

-- CreateIndex
CREATE INDEX "ClaimDocument_documentId_idx" ON "ClaimDocument"("documentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_receiptNumber_key" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_receiptNumber_idx" ON "Payment"("receiptNumber");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Commission_agentId_idx" ON "Commission"("agentId");

-- CreateIndex
CREATE INDEX "Commission_status_idx" ON "Commission"("status");

-- CreateIndex
CREATE INDEX "Document_customerId_idx" ON "Document"("customerId");

-- CreateIndex
CREATE INDEX "Document_type_idx" ON "Document"("type");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_idx" ON "Notification"("userId", "isRead");

-- CreateIndex
CREATE INDEX "AuditLog_entity_idx" ON "AuditLog"("entity");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
