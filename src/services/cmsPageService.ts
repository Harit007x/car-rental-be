import { AppError } from "../lib/AppError";
import { globalPrisma } from "../lib/prisma";
import type { PaginationParams, PaginatedResult } from "../lib/pagination";

interface CreateCmsPageInput {
  title: string;
  slug: string;
  content: string;
}

interface UpdateCmsPageInput {
  title?: string;
  slug?: string;
  content?: string;
}

type CmsPageFilters = {
  search?: string;
};

const selectCmsPage = {
  id: true,
  title: true,
  slug: true,
  content: true,
};

export const createCmsPage = async (data: CreateCmsPageInput) => {
  const existing = await globalPrisma.cmsPage.findUnique({
    where: { slug: data.slug },
  });

  if (existing) {
    throw new AppError("CMS page slug already exists", 409);
  }

  return globalPrisma.cmsPage.create({
    data: {
      title: data.title,
      slug: data.slug,
      content: data.content,
    },
    select: selectCmsPage,
  });
};

export const getCmsPages = async (
  pagination: PaginationParams,
): Promise<PaginatedResult<any>> => {
  const where: any = {};

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.cmsPage.findMany({
      where,
      select: selectCmsPage,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.cmsPage.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const getCmsPageById = async (pageId: string) => {
  const page = await globalPrisma.cmsPage.findUnique({
    where: { id: pageId },
    select: selectCmsPage,
  });

  if (!page) {
    throw new AppError("CMS page not found", 404);
  }

  return page;
};

export const updateCmsPage = async (
  pageId: string,
  data: UpdateCmsPageInput,
) => {
  const existing = await globalPrisma.cmsPage.findUnique({
    where: { id: pageId },
  });

  if (!existing) {
    throw new AppError("CMS page not found", 404);
  }

  if (data.slug && data.slug !== existing.slug) {
    const slugTaken = await globalPrisma.cmsPage.findUnique({
      where: { slug: data.slug },
    });

    if (slugTaken) {
      throw new AppError("CMS page slug already exists", 409);
    }
  }

  return globalPrisma.cmsPage.update({
    where: { id: pageId },
    data,
    select: selectCmsPage,
  });
};

export const deleteCmsPage = async (pageId: string) => {
  const existing = await globalPrisma.cmsPage.findUnique({
    where: { id: pageId },
  });

  if (!existing) {
    throw new AppError("CMS page not found", 404);
  }

  return globalPrisma.cmsPage.delete({ where: { id: pageId } });
};
