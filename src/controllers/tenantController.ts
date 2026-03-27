import { Request, Response, NextFunction } from "express";
import * as tenantService from "../services/tenantService";
import { getPaginationParams } from "../lib/pagination";
import { AppError } from "../lib/AppError";

export const onboardTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await tenantService.onboardTenant(req.body);
    res.status(201).json({
      success: true,
      message: "Tenant onboarded and schema provisioned successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllTenants = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await tenantService.getAllTenants(pagination, {
      search: req.query.search as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
    });
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenantStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenant = await tenantService.updateTenantStatus(
      req.params.tenantId,
      req.body.status,
    );
    res.json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

export const deleteTenant = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const tenant = await tenantService.updateTenantStatus(
      req.params.tenantId,
      "ACCOUNT_DELETED",
    );
    res.json({ success: true, data: tenant });
  } catch (error) {
    next(error);
  }
};

export const getTenantData = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { subdomain } = req.params;
    const result = await tenantService.getTenantData(subdomain);
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTenantProfile = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user || !req.tenantPrisma) {
      throw new AppError("Authentication required", 401);
    }

    const result = await tenantService.updateTenantProfile(
      req.tenantPrisma,
      req.user.userId,
      req.body,
    );

    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};
