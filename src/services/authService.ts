import { randomUUID } from "crypto";
import { globalPrisma } from "../lib/prisma";
import { tenantPrismaManager } from "../lib/tenantPrisma";
import { comparePassword } from "../lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../lib/jwt";
import { AppError } from "../lib/AppError";
import { REFRESH_TOKEN_TTL_DAYS } from "../config/constants";
import type { JwtPayload } from "../types/auth";
import type { PrismaClient as TenantPrismaClient } from "../generated/prisma-tenant/client";

interface LoginInput {
  email: string;
  password: string;
}

export const loginAdmin = async (data: LoginInput) => {
  const user = await globalPrisma.adminUser.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.role !== "SUPER_ADMIN" && user.role !== "GOVERNMENT_ADMIN") {
    throw new AppError("Unauthorized role", 403);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError(
      "Your account has been deactivated. Please contact the super admin.",
      403,
    );
  }

  const isPasswordValid = await comparePassword(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const { accessToken, refreshToken } = await issueAdminTokens(user);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
};

export const loginTenantAdmin = async (
  data: LoginInput,
  tenantPrisma: TenantPrismaClient,
  tenantSubdomain: string,
) => {
  const user = await tenantPrisma.user.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const isPasswordValid = await comparePassword(data.password, user.password);

  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const { accessToken, refreshToken } = await issueTenantTokens(
    user,
    tenantSubdomain,
    tenantPrisma,
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantSubdomain,
    },
  };
};

export const refreshTokens = async (
  refreshToken: string,
  expectedTenantSubdomain: string | null,
) => {
  const payload = verifyRefreshToken(refreshToken);

  if (!payload.tokenId) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (payload.tenantSubdomain && !expectedTenantSubdomain) {
    throw new AppError("Tenant subdomain required", 403);
  }

  if (expectedTenantSubdomain && !payload.tenantSubdomain) {
    throw new AppError("Main domain required for admin refresh", 403);
  }

  if (
    expectedTenantSubdomain &&
    payload.tenantSubdomain !== expectedTenantSubdomain
  ) {
    throw new AppError("Tenant mismatch", 403);
  }

  if (payload.tenantSubdomain) {
    return refreshTenantTokens(payload, refreshToken);
  }

  return refreshAdminTokens(payload, refreshToken);
};

export const logout = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);

  if (!payload.tokenId) {
    throw new AppError("Invalid refresh token", 401);
  }

  if (payload.tenantSubdomain) {
    const tenantPrisma = tenantPrismaManager.getClient(payload.tenantSubdomain);
    await tenantPrisma.refreshToken.updateMany({
      where: { tokenId: payload.tokenId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return;
  }

  await globalPrisma.adminRefreshToken.updateMany({
    where: { tokenId: payload.tokenId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
};

export const getCurrentUser = async (
  payload: JwtPayload,
  tenantSubdomainFromReq: string | null,
  tenantPrismaFromReq?: TenantPrismaClient,
) => {
  if (payload.tenantSubdomain) {
    if (
      tenantSubdomainFromReq &&
      tenantSubdomainFromReq !== payload.tenantSubdomain
    ) {
      throw new AppError("Tenant mismatch", 403);
    }

    const tenantPrisma =
      tenantPrismaFromReq ??
      tenantPrismaManager.getClient(payload.tenantSubdomain);

    const user = await tenantPrisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantSubdomain: payload.tenantSubdomain,
      },
    };
  }

  const adminUser = await globalPrisma.adminUser.findUnique({
    where: { id: payload.userId },
  });

  if (!adminUser) {
    throw new AppError("User not found", 404);
  }

  return {
    user: {
      id: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    },
  };
};

const issueAdminTokens = async (user: { id: string; role: string }) => {
  const tokenId = randomUUID();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await globalPrisma.adminRefreshToken.create({
    data: {
      tokenId,
      adminUserId: user.id,
      expiresAt,
    },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role as JwtPayload["role"],
    tenantSubdomain: null,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    role: user.role as JwtPayload["role"],
    tenantSubdomain: null,
    tokenId,
  });

  return { accessToken, refreshToken };
};

const issueTenantTokens = async (
  user: { id: string; role: string },
  tenantSubdomain: string,
  tenantPrisma: TenantPrismaClient,
) => {
  const tokenId = randomUUID();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await tenantPrisma.refreshToken.create({
    data: {
      tokenId,
      userId: user.id,
      expiresAt,
    },
  });

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role as JwtPayload["role"],
    tenantSubdomain,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    role: user.role as JwtPayload["role"],
    tenantSubdomain,
    tokenId,
  });

  return { accessToken, refreshToken };
};

const refreshAdminTokens = async (
  payload: JwtPayload,
  refreshToken: string,
) => {
  const existing = await globalPrisma.adminRefreshToken.findUnique({
    where: { tokenId: payload.tokenId! },
  });

  if (!existing || existing.revokedAt) {
    throw new AppError("Refresh token revoked", 401);
  }

  if (existing.expiresAt <= new Date()) {
    throw new AppError("Refresh token expired", 401);
  }

  const user = await globalPrisma.adminUser.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role as JwtPayload["role"],
    tenantSubdomain: null,
  });

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role },
  };
};

const refreshTenantTokens = async (
  payload: JwtPayload,
  refreshToken: string,
) => {
  const tenantSubdomain = payload.tenantSubdomain!;
  const tenantPrisma = tenantPrismaManager.getClient(tenantSubdomain);

  const existing = await tenantPrisma.refreshToken.findUnique({
    where: { tokenId: payload.tokenId! },
  });

  if (!existing || existing.revokedAt) {
    throw new AppError("Refresh token revoked", 401);
  }

  if (existing.expiresAt <= new Date()) {
    throw new AppError("Refresh token expired", 401);
  }

  const user = await tenantPrisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user) {
    throw new AppError("User not found", 404);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
    role: user.role as JwtPayload["role"],
    tenantSubdomain,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantSubdomain,
    },
  };
};
