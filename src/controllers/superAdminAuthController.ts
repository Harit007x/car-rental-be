import { Request, Response, NextFunction } from "express";
import * as superAdminAuthService from "../services/superAdminAuthService";
import { AppError } from "../lib/AppError";
import { getPaginationParams } from "../lib/pagination";

export const registerSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await superAdminAuthService.registerSuperAdmin(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getSuperAdminProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await superAdminAuthService.getSuperAdminProfile(
      req.user.userId,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const updateSuperAdminProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await superAdminAuthService.updateSuperAdminProfile(
      req.user.userId,
      req.body,
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await superAdminAuthService.getAllAdmins(pagination, {
      search: req.query.search as string | undefined,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
