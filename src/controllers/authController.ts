import { Request, Response, NextFunction } from "express";
import * as authService from "../services/authService";
import { AppError } from "../lib/AppError";

export const registerSuperAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.registerSuperAdmin(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const registerGovernmentAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.registerGovernmentAdmin(req.body);
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.tenantSubdomain && req.tenantPrisma) {
      const result = await authService.loginTenantAdmin(
        req.body,
        req.tenantPrisma,
        req.tenantSubdomain
      );
      return res.json({
        success: true,
        data: result,
      });
    }

    const result = await authService.loginAdmin(req.body);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await authService.refreshTokens(
      req.body.refreshToken,
      req.tenantSubdomain ?? null
    );
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    await authService.logout(req.body.refreshToken);
    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    next(error);
  }
};

export const me = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await authService.getCurrentUser(
      req.user,
      req.tenantSubdomain ?? null,
      req.tenantPrisma
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
