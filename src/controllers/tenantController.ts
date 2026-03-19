import { Request, Response, NextFunction } from "express";
import * as tenantService from "../services/tenantService";

export const onboardTenant = async (
  req: Request,
  res: Response,
  next: NextFunction
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
  _req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const result = await tenantService.getAllTenants();
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getTenantData = async (
  req: Request,
  res: Response,
  next: NextFunction
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
