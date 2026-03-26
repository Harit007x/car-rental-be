import { Request, Response, NextFunction } from "express";
import { getPaginationParams } from "../lib/pagination";
import * as governmentUserService from "../services/governmentUserService";

export const createGovernmentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await governmentUserService.createGovernmentUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const getGovernmentUsers = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await governmentUserService.getGovernmentUsers(pagination, {
      search: req.query.search as string | undefined,
      fromDate: req.query.fromDate as string | undefined,
      toDate: req.query.toDate as string | undefined,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getGovernmentUserById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await governmentUserService.getGovernmentUserById(
      req.params.userId,
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateGovernmentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await governmentUserService.updateGovernmentUser(
      req.params.userId,
      req.body,
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const updateGovernmentUserStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await governmentUserService.updateGovernmentUserStatus(
      req.params.userId,
      req.body.status,
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

export const deleteGovernmentUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const user = await governmentUserService.softDeleteGovernmentUser(
      req.params.userId,
    );
    res.json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};
