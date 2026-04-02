import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../lib/AppError";
import { getPaginationParams } from "../../../lib/pagination";
import * as adminService from "../services/adminUserService";

export const registerSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await adminService.registerSuperAdmin(req.body);
    res.status(201).json({
      success: true,
      message: "Super admin registered successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await adminService.getAdminProfile(req.user.userId);
    res.json({
      success: true,
      message: "Admin profile retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await adminService.getCurrentAdminUser(req.user.userId);
    res.json({
      success: true,
      message: "Admin user retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await adminService.updateAdminProfile(
      req.user.userId,
      req.body,
    );
    res.json({
      success: true,
      message: "Admin profile updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await adminService.createAdmin(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Admin created successfully",
      data: result,
    });
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
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const pagination = getPaginationParams(req.query);
    const result = await adminService.getAllAdmins(
      req.user.userId,
      pagination,
      {
        search: req.query.search as string | undefined,
      },
    );

    res.json({
      success: true,
      message: "Admins retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await adminService.getAdminById(
      req.user.userId,
      req.params.adminId,
    );
    res.json({
      success: true,
      message: "Admin retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await adminService.updateAdmin(
      req.user.userId,
      req.params.adminId,
      req.body,
    );
    res.json({
      success: true,
      message: "Admin updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await adminService.deleteAdmin(
      req.user.userId,
      req.params.adminId,
    );
    res.json({
      success: true,
      message: "Admin deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
