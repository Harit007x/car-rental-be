import { Request, Response, NextFunction } from "express";
import { getPaginationParams } from "../lib/pagination";
import * as cmsPageService from "../services/cmsPageService";

export const createCmsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = await cmsPageService.createCmsPage(req.body);
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

export const getCmsPages = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await cmsPageService.getCmsPages(pagination);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getCmsPageById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = await cmsPageService.getCmsPageById(req.params.pageId);
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

export const updateCmsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = await cmsPageService.updateCmsPage(
      req.params.pageId,
      req.body,
    );
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};

export const deleteCmsPage = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const page = await cmsPageService.deleteCmsPage(req.params.pageId);
    res.json({ success: true, data: page });
  } catch (error) {
    next(error);
  }
};
