import { AppError } from "../../../lib/AppError";
import { globalPrisma } from "../../../lib/prisma";
import type {
  PaginationParams,
  PaginatedResult,
} from "../../../lib/pagination";

interface SubscriptionFeatureInput {
  featureId: string;
  order?: number;
}

interface CreateSubscriptionInput {
  name: string;
  description: string;
  features: SubscriptionFeatureInput[];
  price: number;
}

interface UpdateSubscriptionInput {
  name?: string;
  description?: string;
  features?: SubscriptionFeatureInput[];
  price?: number;
  status?: "ENABLED" | "DISABLED";
}

const selectSubscriptionList = {
  id: true,
  name: true,
  description: true,
  price: true,
  status: true,
  createdAt: true,
};

const selectSubscription = {
  id: true,
  name: true,
  description: true,
  price: true,
  status: true,
  createdAt: true,
  subscriptionFeatures: {
    orderBy: { order: "asc" as const },
    select: {
      order: true,
      feature: {
        select: {
          id: true,
          key: true,
          name: true,
          description: true,
        },
      },
    },
  },
};

const normalizeFeatures = (features: SubscriptionFeatureInput[] = []) => {
  const normalized = features.map((item, index) => {
    if (typeof item === "string") {
      return {
        featureId: item,
        order: index,
      };
    }

    return {
      featureId: item.featureId,
      order: item.order ?? index,
    };
  });

  const featureIds = normalized.map((item) => item.featureId);
  const uniqueFeatureIds = [...new Set(featureIds)];

  if (featureIds.length !== uniqueFeatureIds.length) {
    throw new AppError("Duplicate features are not allowed", 400);
  }

  return normalized;
};

const ensureFeaturesExist = async (featureIds: string[]) => {
  if (featureIds.length === 0) {
    return;
  }

  const existingFeatures = await globalPrisma.feature.findMany({
    where: {
      id: { in: featureIds },
    },
    select: { id: true },
  });

  if (existingFeatures.length !== featureIds.length) {
    throw new AppError("One or more features do not exist", 400);
  }
};

const serializeSubscription = (subscription: any) => ({
  id: subscription.id,
  name: subscription.name,
  description: subscription.description,
  price: subscription.price,
  status: subscription.status,
  createdAt: subscription.createdAt,
  features: (subscription.subscriptionFeatures || []).map((item: any) => ({
    id: item.feature.id,
    key: item.feature.key,
    name: item.feature.name,
    description: item.feature.description,
    order: item.order,
  })),
});

export const getAllFeatures = async () => {
  return globalPrisma.feature.findMany({
    select: {
      id: true,
      key: true,
      name: true,
      description: true,
    },
    orderBy: {
      name: "asc",
    },
  });
};

export const createSubscription = async (data: CreateSubscriptionInput) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new AppError("Subscription name already exists", 409);
  }

  const features = normalizeFeatures(data.features);
  await ensureFeaturesExist(features.map((item) => item.featureId));

  return await globalPrisma.subscription.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      status: "ENABLED",
      subscriptionFeatures: {
        create: features.map((item) => ({
          featureId: item.featureId,
          order: item.order,
        })),
      },
    },
    select: selectSubscriptionList,
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
      select: selectSubscriptionList,
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

  return serializeSubscription(subscription);
};

export const updateSubscription = async (
  subscriptionId: string,
  data: UpdateSubscriptionInput,
) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!existing || existing.deletedAt) {
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

  const updateData: any = {
    name: data.name,
    description: data.description,
    price: data.price,
    status: data.status,
  };

  if (data.features && data.features.length > 0) {
    const features = normalizeFeatures(data.features);
    await ensureFeaturesExist(features.map((item) => item.featureId));

    updateData.subscriptionFeatures = {
      deleteMany: {},
      create: features.map((item) => ({
        featureId: item.featureId,
        order: item.order,
      })),
    };
  }

  return await globalPrisma.subscription.update({
    where: { id: subscriptionId },
    data: updateData,
    select: selectSubscriptionList,
  });
};

export const updateSubscriptionStatus = async (
  subscriptionId: string,
  status: "ENABLED" | "DISABLED",
) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError("Subscription not found", 404);
  }

  return await globalPrisma.subscription.update({
    where: { id: subscriptionId },
    data: { status },
    select: selectSubscriptionList,
  });
};

export const softDeleteSubscription = async (subscriptionId: string) => {
  const existing = await globalPrisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!existing || existing.deletedAt) {
    throw new AppError("Subscription not found", 404);
  }

  return await globalPrisma.subscription.update({
    where: { id: subscriptionId },
    data: { deletedAt: new Date(), status: "DELETED" },
    select: selectSubscriptionList,
  });
};
