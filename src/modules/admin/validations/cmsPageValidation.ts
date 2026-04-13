import { z } from "zod";

export const cmsPageIdParamsSchema = z.object({
  params: z.object({
    pageId: z.string().uuid(),
  }),
});

export const createCmsPageSchema = z.object({
  body: z.object({
    title: z.string().min(2),
    slug: z.string().min(2),
    content: z.string().min(1),
  }),
});

export const updateCmsPageSchema = z.object({
  body: z
    .object({
      title: z.string().min(2).optional(),
      slug: z.string().min(2).optional(),
      content: z.string().min(1).optional(),
    })
    .partial(),
  params: z.object({
    pageId: z.string().uuid(),
  }),
});
