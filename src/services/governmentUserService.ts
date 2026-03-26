import { AppError } from "../lib/AppError";
import { globalPrisma } from "../lib/prisma";
import { hashPassword } from "../lib/password";
import type { PaginationParams, PaginatedResult } from "../lib/pagination";

interface CreateGovernmentUserInput {
  name: string;
  mobile: string;
  email: string;
  address: string;
  password: string;
}

interface UpdateGovernmentUserInput {
  name?: string;
  mobile?: string;
  email?: string;
  address?: string;
  password?: string;
}

type GovernmentUserFilters = {
  search?: string;
  fromDate?: string;
  toDate?: string;
};

const selectGovernmentUser = {
  id: true,
  name: true,
  mobile: true,
  email: true,
  address: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
};

export const createGovernmentUser = async (data: CreateGovernmentUserInput) => {
  const existingEmail = await globalPrisma.adminUser.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    throw new AppError("Email already in use", 409);
  }

  const existingMobile = await globalPrisma.adminUser.findUnique({
    where: { mobile: data.mobile },
  });

  if (existingMobile) {
    throw new AppError("Mobile already in use", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  return globalPrisma.adminUser.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      password: hashedPassword,
      role: "GOVERNMENT_ADMIN",
      status: "ACTIVE",
    },
    select: selectGovernmentUser,
  });
};

export const getGovernmentUsers = async (
  pagination: PaginationParams,
  filters: GovernmentUserFilters = {},
): Promise<PaginatedResult<any>> => {
  const where: any = {
    role: "GOVERNMENT_ADMIN",
    status: { not: "DELETED" },
  };

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      where.OR = [
        { name: { contains: term, mode: "insensitive" } },
        { email: { contains: term, mode: "insensitive" } },
        { mobile: { contains: term } },
      ];
    }
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt.gte = new Date(filters.fromDate);
    }
    if (filters.toDate) {
      where.createdAt.lte = new Date(filters.toDate);
    }
  }

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.adminUser.findMany({
      where,
      select: selectGovernmentUser,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.adminUser.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const getGovernmentUserById = async (userId: string) => {
  const user = await globalPrisma.adminUser.findFirst({
    where: { id: userId, role: "GOVERNMENT_ADMIN" },
    select: selectGovernmentUser,
  });

  if (!user) {
    throw new AppError("Government user not found", 404);
  }

  return user;
};

export const updateGovernmentUser = async (
  userId: string,
  data: UpdateGovernmentUserInput,
) => {
  const existing = await globalPrisma.adminUser.findFirst({
    where: { id: userId, role: "GOVERNMENT_ADMIN" },
  });

  if (!existing) {
    throw new AppError("Government user not found", 404);
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await globalPrisma.adminUser.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new AppError("Email already in use", 409);
    }
  }

  if (data.mobile && data.mobile !== existing.mobile) {
    const mobileTaken = await globalPrisma.adminUser.findUnique({
      where: { mobile: data.mobile },
    });
    if (mobileTaken) {
      throw new AppError("Mobile already in use", 409);
    }
  }

  const updateData: any = {
    name: data.name,
    mobile: data.mobile,
    email: data.email,
    address: data.address,
  };

  if (data.password) {
    updateData.password = await hashPassword(data.password);
  }

  return globalPrisma.adminUser.update({
    where: { id: userId },
    data: updateData,
    select: selectGovernmentUser,
  });
};

export const softDeleteGovernmentUser = async (userId: string) => {
  const existing = await globalPrisma.adminUser.findFirst({
    where: { id: userId, role: "GOVERNMENT_ADMIN" },
  });

  if (!existing) {
    throw new AppError("Government user not found", 404);
  }

  return globalPrisma.adminUser.update({
    where: { id: userId },
    data: { status: "DELETED" },
    select: selectGovernmentUser,
  });
};

export const updateGovernmentUserStatus = async (
  userId: string,
  status: "ACTIVE" | "INACTIVE",
) => {
  const existing = await globalPrisma.adminUser.findFirst({
    where: { id: userId, role: "GOVERNMENT_ADMIN" },
  });

  if (!existing) {
    throw new AppError("Government user not found", 404);
  }

  return globalPrisma.adminUser.update({
    where: { id: userId },
    data: { status },
    select: selectGovernmentUser,
  });
};
