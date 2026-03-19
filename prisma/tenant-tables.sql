-- Tenant schema DDL template
-- Run after: CREATE SCHEMA IF NOT EXISTS "tenant_<id>";
-- All tables are created within the tenant's schema (set by search_path)

-- Enums (match prisma/tenant-schema.prisma)
CREATE TYPE "Role" AS ENUM ('RENTAL_ADMIN');
CREATE TYPE "CustomerStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "DeliveryPartnerStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ACCOUNT_DELETED');
CREATE TYPE "PartnerDocumentType" AS ENUM ('DRIVING_LICENSE');
CREATE TYPE "CustomerDocumentType" AS ENUM ('DRIVING_LICENSE', 'SIGNED_CONTRACT');

CREATE TABLE IF NOT EXISTS "User" (
  "id"                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"              TEXT         NOT NULL UNIQUE,
  "password"           TEXT         NOT NULL,
  "role"               "Role"       NOT NULL DEFAULT 'RENTAL_ADMIN',
  "mustChangePassword" BOOLEAN      NOT NULL DEFAULT true,
  "isEmailVerified"    BOOLEAN      NOT NULL DEFAULT false,
  "createdAt"          TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt"          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "RefreshToken" (
  "id"        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId"    UUID         NOT NULL REFERENCES "User"("id"),
  "tokenId"   TEXT         NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ  NOT NULL,
  "revokedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "DeliveryPartner" (
  "id"        UUID                    PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"      TEXT                    NOT NULL,
  "phone"     TEXT                    NOT NULL UNIQUE,
  "email"     TEXT,
  "address"   TEXT                    NOT NULL,
  "dob"       TIMESTAMPTZ,
  "status"    "DeliveryPartnerStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMPTZ             NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "DeliveryPartnerDocument" (
  "id"         UUID                  PRIMARY KEY DEFAULT gen_random_uuid(),
  "partnerId"  UUID                  NOT NULL REFERENCES "DeliveryPartner"("id"),
  "type"       "PartnerDocumentType" NOT NULL,
  "fileUrl"    TEXT                  NOT NULL,
  "uploadedAt" TIMESTAMPTZ           NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Customer" (
  "id"           UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"         TEXT             NOT NULL,
  "mobileNumber" TEXT             NOT NULL,
  "email"        TEXT,
  "address"      TEXT             NOT NULL,
  "status"       "CustomerStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt"    TIMESTAMPTZ      NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "CustomerDocument" (
  "id"         UUID                   PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerId" UUID                   NOT NULL REFERENCES "Customer"("id"),
  "type"       "CustomerDocumentType" NOT NULL,
  "fileUrl"    TEXT                   NOT NULL,
  "uploadedAt" TIMESTAMPTZ            NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "ServiceLocation" (
  "id"        UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  "city"      TEXT         NOT NULL,
  "state"     TEXT         NOT NULL,
  "country"   TEXT         NOT NULL,
  "createdAt" TIMESTAMPTZ  NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS "RefreshToken_userId_idx" ON "RefreshToken"("userId");
CREATE INDEX IF NOT EXISTS "DeliveryPartnerDocument_partnerId_idx" ON "DeliveryPartnerDocument"("partnerId");
CREATE INDEX IF NOT EXISTS "CustomerDocument_customerId_idx" ON "CustomerDocument"("customerId");
