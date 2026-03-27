import { AppError } from "../lib/AppError";
import { globalPrisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";

interface RegisterSuperAdminInput {
  name: string;
  mobile: string;
  address: string;
  email: string;
  password: string;
}

interface UpdateAdminProfileInput {
  name?: string;
  email?: string;
}

export const registerSuperAdmin = async (data: RegisterSuperAdminInput) => {
  const existingSuperAdmin = await globalPrisma.adminUser.findFirst({
    where: { role: "SUPER_ADMIN" },
  });

  if (existingSuperAdmin) {
    throw new AppError("Super admin already exists", 409);
  }

  const existingUser = await globalPrisma.adminUser.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new AppError("Email already in use", 409);
  }

  const existingMobile = await globalPrisma.adminUser.findUnique({
    where: { mobile: data.mobile },
  });

  if (existingMobile) {
    throw new AppError("Mobile already in use", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  const user = await globalPrisma.adminUser.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      address: data.address,
      email: data.email,
      password: hashedPassword,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
    },
  });

  return {
    user: { id: user.id, email: user.email, role: user.role },
  };
};

export const getSuperAdminProfile = async (adminId: string) => {
  const admin = await globalPrisma.adminUser.findUnique({
    where: { id: adminId },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      address: true,
      role: true,
    },
  });

  if (!admin || admin.role !== "SUPER_ADMIN") {
    throw new AppError("Super admin not found", 404);
  }

  return admin;
};

export const updateSuperAdminProfile = async (
  adminId: string,
  data: UpdateAdminProfileInput,
) => {
  const existing = await globalPrisma.adminUser.findUnique({
    where: { id: adminId },
  });

  if (!existing || existing.role !== "SUPER_ADMIN") {
    throw new AppError("Super admin not found", 404);
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await globalPrisma.adminUser.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new AppError("Email already in use", 409);
    }
  }

  const updated = await globalPrisma.adminUser.update({
    where: { id: adminId },
    data: {
      name: data.name,
      email: data.email,
    },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      address: true,
      role: true,
    },
  });

  return updated;
};
