import { Request, Response, NextFunction } from "express";
import { getPaginationParams } from "../../../lib/pagination";
import * as carRentalCompanyService from "../services/carRentalCompanyService";

export const createCarRentalCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company = await carRentalCompanyService.createCarRentalCompany(
      req.body,
    );
    res.status(201).json({
      success: true,
      message: "Car rental company created successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const getCarRentalCompanies = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pagination = getPaginationParams(req.query);
    const result = await carRentalCompanyService.getCarRentalCompanies(
      pagination,
      {
        search: req.query.search as string | undefined,
        fromDate: req.query.fromDate as string | undefined,
        toDate: req.query.toDate as string | undefined,
      },
    );

    res.json({
      success: true,
      message: "Car rental companies retrieved successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getCarRentalCompanyById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company = await carRentalCompanyService.getCarRentalCompanyById(
      req.params.companyId,
    );
    res.json({
      success: true,
      message: "Car rental company retrieved successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCarRentalCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company = await carRentalCompanyService.updateCarRentalCompany(
      req.params.companyId,
      req.body,
    );
    res.json({
      success: true,
      message: "Car rental company updated successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const updateCarRentalCompanyStatus = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company = await carRentalCompanyService.updateCarRentalCompanyStatus(
      req.params.companyId,
      req.body.status,
    );
    res.json({
      success: true,
      message: "Car rental company status updated successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteCarRentalCompany = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const company = await carRentalCompanyService.softDeleteCarRentalCompany(
      req.params.companyId,
    );
    res.json({
      success: true,
      message: "Car rental company account deleted successfully",
      data: company,
    });
  } catch (error) {
    next(error);
  }
};
