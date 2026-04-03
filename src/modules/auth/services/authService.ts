import { randomUUID } from "crypto";
import { AppError } from "../../../lib/AppError";
import { REFRESH_TOKEN_TTL_DAYS } from "../../../config/constants";
import { globalPrisma } from "../../../lib/prisma";
import { comparePassword } from "../../../lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../lib/jwt";

interface LoginInput {
  email: string;
  password: string;
}

type GlobalUserType = "ADMIN" | "GOVERNMENT";

export const loginAdmin = async (data: LoginInput) => {
  const user = await globalPrisma.admin.findUnique({
    where: { email: data.email },
    include: {
      role: {
        select: {
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.deletedAt || user.status !== "ACTIVE") {
    throw new AppError(
      "Your account has been deactivated. Please contact the super admin.",
      403,
    );
  }

  const isPasswordValid = await comparePassword(
    data.password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  ensureAdminRoleIsActive(user);

  const { accessToken, refreshToken } = await issueGlobalTokens(
    user.id,
    "ADMIN",
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    },
  };
};

export const loginGovernmentUser = async (data: LoginInput) => {
  const user = await globalPrisma.governmentUser.findUnique({
    where: { email: data.email },
  });

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.deletedAt || user.status !== "ACTIVE") {
    throw new AppError(
      "Your account has been deactivated. Please contact the super admin.",
      403,
    );
  }

  const isPasswordValid = await comparePassword(
    data.password,
    user.passwordHash,
  );
  if (!isPasswordValid) {
    throw new AppError("Invalid email or password", 401);
  }

  const { accessToken, refreshToken } = await issueGlobalTokens(
    user.id,
    "GOVERNMENT",
  );

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

export const refreshAdminTokens = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload.tokenId) {
    throw new AppError("Invalid refresh token", 401);
  }

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash: payload.tokenId },
  });

  if (!existing || existing.revokedAt || existing.status === "REVOKED") {
    throw new AppError("Refresh token revoked", 401);
  }

  if (existing.userType !== "ADMIN") {
    throw new AppError("Only admin refresh is allowed on this endpoint", 403);
  }

  if (existing.expiresAt <= new Date()) {
    await globalPrisma.refreshToken.update({
      where: { tokenHash: payload.tokenId },
      data: { status: "EXPIRED" },
    });
    throw new AppError("Refresh token expired", 401);
  }

  const user = await getGlobalUserByType(existing.userType, existing.userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const admin = await globalPrisma.admin.findFirst({
    where: { id: user.id, deletedAt: null, status: "ACTIVE" },
    include: {
      role: {
        select: {
          status: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!admin) {
    throw new AppError("User not found", 404);
  }

  ensureAdminRoleIsActive(admin);

  const accessToken = generateAccessToken({
    userId: user.id,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      isSuperAdmin: user.isSuperAdmin,
    },
  };
};

export const refreshGovernmentTokens = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload.tokenId) {
    throw new AppError("Invalid refresh token", 401);
  }

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash: payload.tokenId },
  });

  if (!existing || existing.revokedAt || existing.status === "REVOKED") {
    throw new AppError("Refresh token revoked", 401);
  }

  if (existing.userType !== "GOVERNMENT") {
    throw new AppError(
      "Only government refresh is allowed on this endpoint",
      403,
    );
  }

  if (existing.expiresAt <= new Date()) {
    await globalPrisma.refreshToken.update({
      where: { tokenHash: payload.tokenId },
      data: { status: "EXPIRED" },
    });
    throw new AppError("Refresh token expired", 401);
  }

  const user = await getGlobalUserByType(existing.userType, existing.userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  const accessToken = generateAccessToken({
    userId: user.id,
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
    },
  };
};

export const logoutAdmin = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload.tokenId) {
    throw new AppError("Invalid refresh token", 401);
  }

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash: payload.tokenId },
    select: { userType: true },
  });

  if (existing?.userType !== "ADMIN") {
    throw new AppError("Only admin logout is allowed on this endpoint", 403);
  }

  await globalPrisma.refreshToken.updateMany({
    where: { tokenHash: payload.tokenId, userType: "ADMIN", revokedAt: null },
    data: { revokedAt: new Date(), status: "REVOKED" },
  });
};

export const logoutGovernment = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  if (!payload.tokenId) {
    throw new AppError("Invalid refresh token", 401);
  }

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash: payload.tokenId },
    select: { userType: true },
  });

  if (existing?.userType !== "GOVERNMENT") {
    throw new AppError(
      "Only government user logout is allowed on this endpoint",
      403,
    );
  }

  await globalPrisma.refreshToken.updateMany({
    where: {
      tokenHash: payload.tokenId,
      userType: "GOVERNMENT",
      revokedAt: null,
    },
    data: { revokedAt: new Date(), status: "REVOKED" },
  });
};

const issueGlobalTokens = async (userId: string, userType: GlobalUserType) => {
  const tokenId = randomUUID();
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await globalPrisma.refreshToken.create({
    data: {
      tokenHash: tokenId,
      userId,
      userType,
      expiresAt,
    },
  });

  const accessToken = generateAccessToken({
    userId,
  });

  const refreshToken = generateRefreshToken({
    userId,
    tokenId,
  });

  return { accessToken, refreshToken };
};

const getGlobalUserByType = async (
  userType: GlobalUserType,
  userId: string,
) => {
  if (userType === "ADMIN") {
    const user = await globalPrisma.admin.findFirst({
      where: { id: userId, deletedAt: null, status: "ACTIVE" },
      select: { id: true, email: true, isSuperAdmin: true },
    });

    return user ? { ...user } : null;
  }

  const user = await globalPrisma.governmentUser.findFirst({
    where: { id: userId, deletedAt: null, status: "ACTIVE" },
    select: { id: true, email: true },
  });

  return user ? { ...user, isSuperAdmin: false } : null;
};

const ensureAdminRoleIsActive = (admin: {
  isSuperAdmin: boolean;
  roleId: string | null;
  role: { status: string; deletedAt: Date | null } | null;
}) => {
  if (admin.isSuperAdmin) {
    return;
  }

  if (!admin.roleId) {
    return;
  }

  if (!admin.role || admin.role.deletedAt || admin.role.status !== "ACTIVE") {
    throw new AppError(
      "Your role has been deactivated. Please contact the super admin.",
      403,
    );
  }
};
