import { Request, Response, NextFunction } from 'express';
import * as vehicleService from '../services/vehicleService';

export const createVehicle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicle = await vehicleService.createVehicle(req.body);
    res.status(201).json({
      success: true,
      data: vehicle,
    });
  } catch (error) {
    next(error);
  }
};

export const getAllVehicles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    res.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    next(error);
  }
};
