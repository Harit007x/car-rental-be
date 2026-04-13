import { createHash, randomUUID } from "crypto";
import { AppError } from "../../../lib/AppError";
import { REFRESH_TOKEN_TTL_DAYS } from "../../../config/constants";
import { globalPrisma } from "../../../lib/prisma";
import { comparePassword } from "../../../lib/password";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../../../lib/jwt";
import {
  adminAuthUserInclude,
  assertAdminRoleIsActive,
  buildAdminAuthUser,
} from "../../admin/utils/adminAuthUser";

interface LoginInput {
  email: string;
  password: string;
}

type GlobalUserType = "ADMIN" | "GOVERNMENT";

const hashTokenIdentifier = (tokenIdentifier: string) =>
  createHash("sha256").update(tokenIdentifier).digest("hex");

const getTokenHashFromRefreshPayload = (payload: { tokenId?: string }) => {
  if (!payload.tokenId) {
    throw new AppError("Invalid refresh token", 401);
  }

  return hashTokenIdentifier(payload.tokenId);
};

export const loginAdmin = async (data: LoginInput) => {
  const user = await globalPrisma.admin.findUnique({
    where: { email: data.email },
    include: adminAuthUserInclude,
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

  assertAdminRoleIsActive(user);

  const { accessToken, refreshToken } = await issueGlobalTokens(
    user.id,
    "ADMIN",
  );

  return {
    accessToken,
    refreshToken,
    user: buildAdminAuthUser(user),
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
  const tokenHash = getTokenHashFromRefreshPayload(payload);

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash },
  });

  if (!existing || existing.revokedAt || existing.status === "REVOKED") {
    throw new AppError("Refresh token revoked", 401);
  }

  if (existing.userType !== "ADMIN") {
    throw new AppError("Only admin refresh is allowed on this endpoint", 403);
  }

  if (existing.expiresAt <= new Date()) {
    await globalPrisma.refreshToken.update({
      where: { tokenHash },
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

  assertAdminRoleIsActive(admin);

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
  const tokenHash = getTokenHashFromRefreshPayload(payload);

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash },
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
      where: { tokenHash },
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
  const tokenHash = getTokenHashFromRefreshPayload(payload);

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash },
    select: { userType: true },
  });

  if (existing?.userType !== "ADMIN") {
    throw new AppError("Only admin logout is allowed on this endpoint", 403);
  }

  await globalPrisma.refreshToken.updateMany({
    where: { tokenHash, userType: "ADMIN", revokedAt: null },
    data: { revokedAt: new Date(), status: "REVOKED" },
  });
};

export const logoutGovernment = async (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const tokenHash = getTokenHashFromRefreshPayload(payload);

  const existing = await globalPrisma.refreshToken.findUnique({
    where: { tokenHash },
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
      tokenHash,
      userType: "GOVERNMENT",
      revokedAt: null,
    },
    data: { revokedAt: new Date(), status: "REVOKED" },
  });
};

const issueGlobalTokens = async (userId: string, userType: GlobalUserType) => {
  const tokenId = randomUUID();
  const tokenHash = hashTokenIdentifier(tokenId);
  const expiresAt = new Date(
    Date.now() + REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  );

  await globalPrisma.refreshToken.create({
    data: {
      tokenHash,
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
