import { Request, Response, NextFunction } from "express";
import { getPaginationParams } from "../lib/pagination";
import * as subscriptionService from "../services/subscriptionService";

export const createSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subscription = await subscriptionService.createSubscription(req.body);
    res.status(201).json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptions = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await subscriptionService.getSubscriptions(pagination);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
};

export const getSubscriptionById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subscription = await subscriptionService.getSubscriptionById(
      req.params.subscriptionId,
    );
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subscription = await subscriptionService.updateSubscription(
      req.params.subscriptionId,
      req.body,
    );
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const updateSubscriptionStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subscription = await subscriptionService.updateSubscriptionStatus(
      req.params.subscriptionId,
      req.body.status,
    );
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};

export const deleteSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const subscription = await subscriptionService.softDeleteSubscription(
      req.params.subscriptionId,
    );
    res.json({ success: true, data: subscription });
  } catch (error) {
    next(error);
  }
};
