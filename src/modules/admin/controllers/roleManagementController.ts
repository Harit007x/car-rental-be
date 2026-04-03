import { Request, Response, NextFunction } from "express";
import { AppError } from "../../../lib/AppError";
import { getPaginationParams } from "../../../lib/pagination";
import * as roleService from "../services/roleManagementService";

export const getPermissionModules = async (
  _req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const result = await roleService.getPermissionModules();
    res.json({
      success: true,
      message: "Permission modules retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const createRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await roleService.createRole(req.user.userId, req.body);
    res.status(201).json({
      success: true,
      message: "Role created successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllRoles = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const pagination = getPaginationParams(req.query);
    const result = await roleService.getAllRoles(req.user.userId, pagination, {
      search: req.query.search as string | undefined,
    });

    res.json({
      success: true,
      message: "Roles retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoleById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await roleService.getRoleById(
      req.user.userId,
      req.params.roleId,
    );
    res.json({
      success: true,
      message: "Role retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await roleService.updateRole(
      req.user.userId,
      req.params.roleId,
      req.body,
    );
    res.json({
      success: true,
      message: "Role updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoleStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await roleService.updateRoleStatus(
      req.user.userId,
      req.params.roleId,
      req.body.status,
    );
    res.json({
      success: true,
      message: "Role status updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRole = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    const result = await roleService.deleteRole(
      req.user.userId,
      req.params.roleId,
    );
    res.json({
      success: true,
      message: "Role deleted successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
