import { AppError } from "../../../lib/AppError";
import { globalPrisma } from "../../../lib/prisma";
import { hashPassword } from "../../../lib/password";
import type {
  PaginationParams,
  PaginatedResult,
} from "../../../lib/pagination";

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
  status: true,
  mustChangePassword: true,
};

export const createGovernmentUser = async (data: CreateGovernmentUserInput) => {
  const existingEmail = await globalPrisma.governmentUser.findUnique({
    where: { email: data.email },
  });

  if (existingEmail) {
    throw new AppError("Email already in use", 409);
  }

  const existingMobile = await globalPrisma.governmentUser.findUnique({
    where: { mobile: data.mobile },
  });

  if (existingMobile) {
    throw new AppError("Mobile already in use", 409);
  }

  const hashedPassword = await hashPassword(data.password);

  return globalPrisma.governmentUser.create({
    data: {
      name: data.name,
      mobile: data.mobile,
      email: data.email,
      address: data.address,
      passwordHash: hashedPassword,
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
    deletedAt: null,
  };
  let parsedFromDate: Date | undefined;
  let parsedToDate: Date | undefined;

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

  if (filters.fromDate) {
    parsedFromDate = new Date(filters.fromDate);
    if (Number.isNaN(parsedFromDate.getTime())) {
      throw new AppError("Invalid fromDate", 400);
    }
  }

  if (filters.toDate) {
    parsedToDate = new Date(filters.toDate);
    if (Number.isNaN(parsedToDate.getTime())) {
      throw new AppError("Invalid toDate", 400);
    }
  }

  if (parsedFromDate && parsedToDate && parsedToDate < parsedFromDate) {
    throw new AppError("toDate should not be less than fromDate", 400);
  }

  if (filters.fromDate || filters.toDate) {
    where.createdAt = {};
    if (parsedFromDate) {
      where.createdAt.gte = parsedFromDate;
    }
    if (parsedToDate) {
      where.createdAt.lte = parsedToDate;
    }
  }

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.governmentUser.findMany({
      where,
      select: selectGovernmentUser,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.governmentUser.count({ where }),
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
  const user = await globalPrisma.governmentUser.findFirst({
    where: { id: userId, deletedAt: null },
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
  const existing = await globalPrisma.governmentUser.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Government user not found", 404);
  }

  if (data.email && data.email !== existing.email) {
    const emailTaken = await globalPrisma.governmentUser.findUnique({
      where: { email: data.email },
    });
    if (emailTaken) {
      throw new AppError("Email already in use", 409);
    }
  }

  if (data.mobile && data.mobile !== existing.mobile) {
    const mobileTaken = await globalPrisma.governmentUser.findUnique({
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
    updateData.passwordHash = await hashPassword(data.password);
  }

  return globalPrisma.governmentUser.update({
    where: { id: userId },
    data: updateData,
    select: selectGovernmentUser,
  });
};

export const softDeleteGovernmentUser = async (userId: string) => {
  const existing = await globalPrisma.governmentUser.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Government user not found", 404);
  }

  return globalPrisma.governmentUser.update({
    where: { id: userId },
    data: { status: "DELETED", deletedAt: new Date() },
    select: selectGovernmentUser,
  });
};

export const updateGovernmentUserStatus = async (
  userId: string,
  status: "ACTIVE" | "INACTIVE",
) => {
  const existing = await globalPrisma.governmentUser.findFirst({
    where: { id: userId, deletedAt: null },
  });

  if (!existing) {
    throw new AppError("Government user not found", 404);
  }

  return globalPrisma.governmentUser.update({
    where: { id: userId },
    data: { status },
    select: selectGovernmentUser,
  });
};
