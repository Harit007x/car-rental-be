import { AppError } from "../lib/AppError";
import { globalPrisma } from "../lib/prisma";
import type { PaginationParams, PaginatedResult } from "../lib/pagination";

interface CreateSubscriptionInput {
  name: string;
  description: string;
  features: string[];
  price: number;
}

interface UpdateSubscriptionInput {
  name?: string;
  description?: string;
  features?: string[];
  price?: number;
}

const selectSubscription = {
  id: true,
  name: true,
  description: true,
  features: true,
  price: true,
  status: true,
};

export const createSubscription = async (data: CreateSubscriptionInput) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new AppError("Subscription name already exists", 409);
  }

  return globalPrisma.subscription.create({
    data: {
      name: data.name,
      description: data.description,
      features: data.features,
      price: data.price,
      status: "ENABLED",
    },
    select: selectSubscription,
  });
};

export const getSubscriptions = async (
  pagination: PaginationParams,
): Promise<PaginatedResult<any>> => {
  const where: any = {
    status: { not: "DELETED" },
  };

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.subscription.findMany({
      where,
      select: selectSubscription,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.subscription.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const getSubscriptionById = async (subscriptionId: string) => {
  const subscription = await globalPrisma.subscription.findUnique({
    where: { id: subscriptionId },
    select: selectSubscription,
  });

  if (!subscription || subscription.status === "DELETED") {
    throw new AppError("Subscription not found", 404);
  }

  return subscription;
};

export const updateSubscription = async (
  subscriptionId: string,
  data: UpdateSubscriptionInput,
) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!existing || existing.status === "DELETED") {
    throw new AppError("Subscription not found", 404);
  }

  if (data.name && data.name !== existing.name) {
    const nameTaken = await globalPrisma.subscription.findUnique({
      where: { name: data.name },
    });

    if (nameTaken) {
      throw new AppError("Subscription name already exists", 409);
    }
  }

  return globalPrisma.subscription.update({
    where: { id: subscriptionId },
    data,
    select: selectSubscription,
  });
};

export const updateSubscriptionStatus = async (
  subscriptionId: string,
  status: "ENABLED" | "DISABLED",
) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!existing || existing.status === "DELETED") {
    throw new AppError("Subscription not found", 404);
  }

  return globalPrisma.subscription.update({
    where: { id: subscriptionId },
    data: { status },
    select: selectSubscription,
  });
};

export const softDeleteSubscription = async (subscriptionId: string) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!existing || existing.status === "DELETED") {
    throw new AppError("Subscription not found", 404);
  }

  return globalPrisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: "DELETED" },
    select: selectSubscription,
  });
};
