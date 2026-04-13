import { AppError } from "../../../lib/AppError";
import { globalPrisma } from "../../../lib/prisma";
import type {
  PaginatedResult,
  PaginationParams,
} from "../../../lib/pagination";

type businessType = "INDIVIDUAL" | "COMPANY" | "FLEET_OPERATOR";

interface CreateCarRentalCompanyInput {
  businessName: string;
  registrationNumber: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  businessAddress: string;
  city: string;
  state: string;
  country: string;
  businessType: businessType;
  fleetSize: number;
  serviceOperationLocations: string[];
  bankAccount: {
    accountName: string;
    accountNo: string;
    bankName: string;
    ifscCode: string;
  };
}

interface UpdateCarRentalCompanyInput {
  businessName?: string;
  registrationNumber?: string;
  ownerName?: string;
  ownerPhone?: string;
  businessAddress?: string;
  city?: string;
  state?: string;
  country?: string;
  businessType?: businessType;
  fleetSize?: number;
  serviceOperationLocations?: string[];
  bankAccount?: {
    accountName: string;
    accountNo: string;
    bankName: string;
    ifscCode: string;
  };
}

type CarRentalCompanyFilters = {
  search?: string;
  fromDate?: string;
  toDate?: string;
  status?: "INACTIVE" | "ACTIVE" | "ACCOUNT_DELETED";
};

const selectCompanyListItem = {
  id: true,
  businessName: true,
  ownerName: true,
  ownerPhone: true,
  ownerEmail: true,
  businessType: true,
  fleetSize: true,
  status: true,
};

const selectCompanyDetail = {
  id: true,
  subdomain: true,
  businessName: true,
  registrationNumber: true,
  ownerName: true,
  ownerPhone: true,
  ownerEmail: true,
  businessAddress: true,
  city: true,
  state: true,
  country: true,
  businessType: true,
  fleetSize: true,
  serviceOperationLocations: true,
  status: true,
  bankAccount: {
    select: {
      id: true,
      accountName: true,
      accountNo: true,
      bankName: true,
      ifscCode: true,
    },
  },
  subscriptions: {
    orderBy: { startDate: "desc" as const },
    select: {
      id: true,
      startDate: true,
      endDate: true,
      isActive: true,
      subscription: {
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          status: true,
        },
      },
    },
  },
};

const slugifyForSubdomain = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50) || "company";

const generateUniqueSubdomain = async (businessName: string) => {
  const base = slugifyForSubdomain(businessName);
  const maxAttempts = 50;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const candidate =
      attempt === 0 ? base : `${base}-${Math.floor(Math.random() * 100000)}`;

    const existing = await globalPrisma.rentalCompany.findUnique({
      where: { subdomain: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }
  }

  throw new AppError(
    "Unable to allocate unique subdomain. Please retry the request.",
    500,
  );
};

const parseDateOrThrow = (value: string, fieldName: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new AppError(`Invalid ${fieldName}`, 400);
  }
  return date;
};

const serializeSubscription = (companySubscription: any) => ({
  id: companySubscription.id,
  startDate: companySubscription.startDate,
  endDate: companySubscription.endDate,
  isActive: companySubscription.isActive,
  subscription: {
    id: companySubscription.subscription.id,
    name: companySubscription.subscription.name,
    description: companySubscription.subscription.description,
    price: companySubscription.subscription.price,
    status: companySubscription.subscription.status,
  },
});

const serializeCompanyDetail = (company: any) => {
  const now = new Date();
  const subscriptionHistory = (company.subscriptions ?? []).map(
    serializeSubscription,
  );

  const activeSubscription = subscriptionHistory.find((item: any) => {
    const activeByFlag = item.isActive;
    const notExpired = !item.endDate || new Date(item.endDate) >= now;
    return activeByFlag && notExpired;
  });

  return {
    id: company.id,
    subdomain: company.subdomain,
    businessName: company.businessName,
    registrationNumber: company.registrationNumber,
    ownerName: company.ownerName,
    ownerPhone: company.ownerPhone,
    ownerEmail: company.ownerEmail,
    businessAddress: company.businessAddress,
    city: company.city,
    state: company.state,
    country: company.country,
    businessType: company.businessType,
    fleetSize: company.fleetSize,
    serviceOperationLocations: company.serviceOperationLocations,
    status: company.status,
    bankAccount: company.bankAccount,
    activeSubscription: activeSubscription ?? null,
    subscriptionHistory,
  };
};

export const createCarRentalCompany = async (
  data: CreateCarRentalCompanyInput,
) => {
  const existingRegistration = await globalPrisma.rentalCompany.findFirst({
    where: { registrationNumber: data.registrationNumber },
    select: { id: true },
  });

  if (existingRegistration) {
    throw new AppError("Registration number already exists", 409);
  }

  const subdomain = await generateUniqueSubdomain(data.businessName);

  return await globalPrisma.rentalCompany.create({
    data: {
      subdomain,
      businessName: data.businessName,
      registrationNumber: data.registrationNumber,
      ownerName: data.ownerName,
      ownerPhone: data.ownerPhone,
      ownerEmail: data.ownerEmail,
      businessAddress: data.businessAddress,
      city: data.city,
      state: data.state,
      country: data.country,
      businessType: data.businessType,
      fleetSize: data.fleetSize,
      serviceOperationLocations: data.serviceOperationLocations,
      status: "INACTIVE",
      bankAccount: {
        create: {
          accountName: data.bankAccount.accountName,
          accountNo: data.bankAccount.accountNo,
          bankName: data.bankAccount.bankName,
          ifscCode: data.bankAccount.ifscCode,
        },
      },
    },
    select: selectCompanyListItem,
  });
};

export const getCarRentalCompanies = async (
  pagination: PaginationParams,
  filters: CarRentalCompanyFilters = {},
): Promise<PaginatedResult<any>> => {
  const where: any = {};
  let parsedFromDate: Date | undefined;
  let parsedToDate: Date | undefined;

  if (filters.search) {
    const term = filters.search.trim();
    if (term) {
      where.OR = [
        { businessName: { contains: term, mode: "insensitive" } },
        { ownerPhone: { contains: term } },
        { ownerEmail: { contains: term, mode: "insensitive" } },
      ];
    }
  }

  if (filters.fromDate) {
    parsedFromDate = parseDateOrThrow(filters.fromDate, "fromDate");
  }
  if (filters.toDate) {
    parsedToDate = parseDateOrThrow(filters.toDate, "toDate");
  }
  if (parsedFromDate && parsedToDate && parsedToDate < parsedFromDate) {
    throw new AppError("toDate should not be less than fromDate", 400);
  }

  if (parsedFromDate || parsedToDate) {
    where.createdAt = {};
    if (parsedFromDate) {
      where.createdAt.gte = parsedFromDate;
    }
    if (parsedToDate) {
      where.createdAt.lte = parsedToDate;
    }
  }

  const [items, total] = await globalPrisma.$transaction([
    globalPrisma.rentalCompany.findMany({
      where,
      select: selectCompanyListItem,
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
    }),
    globalPrisma.rentalCompany.count({ where }),
  ]);

  return {
    items,
    total,
    page: pagination.page,
    limit: pagination.limit,
    totalPages: Math.ceil(total / pagination.limit),
  };
};

export const getCarRentalCompanyById = async (companyId: string) => {
  const company = await globalPrisma.rentalCompany.findUnique({
    where: { id: companyId },
    select: selectCompanyDetail,
  });

  if (!company) {
    throw new AppError("Car rental company not found", 404);
  }

  return serializeCompanyDetail(company);
};

export const updateCarRentalCompany = async (
  companyId: string,
  data: UpdateCarRentalCompanyInput,
) => {
  const existing = await globalPrisma.rentalCompany.findUnique({
    where: { id: companyId },
    select: {
      id: true,
      status: true,
      registrationNumber: true,
    },
  });

  if (!existing) {
    throw new AppError("Car rental company not found", 404);
  }

  if (existing.status === "ACCOUNT_DELETED") {
    throw new AppError("Deleted car rental company cannot be updated", 400);
  }

  if (
    data.registrationNumber &&
    data.registrationNumber !== existing.registrationNumber
  ) {
    const duplicate = await globalPrisma.rentalCompany.findFirst({
      where: {
        registrationNumber: data.registrationNumber,
        id: { not: companyId },
      },
      select: { id: true },
    });

    if (duplicate) {
      throw new AppError("Registration number already exists", 409);
    }
  }

  return globalPrisma.$transaction(async (tx) => {
    const updatedCompany = await tx.rentalCompany.update({
      where: { id: companyId },
      data: {
        businessName: data.businessName,
        registrationNumber: data.registrationNumber,
        ownerName: data.ownerName,
        ownerPhone: data.ownerPhone,
        businessAddress: data.businessAddress,
        city: data.city,
        state: data.state,
        country: data.country,
        businessType: data.businessType,
        fleetSize: data.fleetSize,
        serviceOperationLocations: data.serviceOperationLocations,
      },
      select: selectCompanyListItem,
    });

    if (data.bankAccount) {
      await tx.bankAccount.upsert({
        where: { rentalCompanyId: companyId },
        update: {
          accountName: data.bankAccount.accountName,
          accountNo: data.bankAccount.accountNo,
          bankName: data.bankAccount.bankName,
          ifscCode: data.bankAccount.ifscCode,
        },
        create: {
          rentalCompanyId: companyId,
          accountName: data.bankAccount.accountName,
          accountNo: data.bankAccount.accountNo,
          bankName: data.bankAccount.bankName,
          ifscCode: data.bankAccount.ifscCode,
        },
      });
    }

    return updatedCompany;
  });
};

export const updateCarRentalCompanyStatus = async (
  companyId: string,
  status: "ACTIVE" | "INACTIVE",
) => {
  const existing = await globalPrisma.rentalCompany.findUnique({
    where: { id: companyId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new AppError("Car rental company not found", 404);
  }

  if (existing.status === "ACCOUNT_DELETED") {
    throw new AppError(
      "Deleted car rental company cannot be activated or deactivated",
      400,
    );
  }

  return globalPrisma.rentalCompany.update({
    where: { id: companyId },
    data: { status },
    select: selectCompanyListItem,
  });
};

export const softDeleteCarRentalCompany = async (companyId: string) => {
  const existing = await globalPrisma.rentalCompany.findUnique({
    where: { id: companyId },
    select: { id: true, status: true },
  });

  if (!existing) {
    throw new AppError("Car rental company not found", 404);
  }

  if (existing.status === "ACCOUNT_DELETED") {
    throw new AppError("Car rental company account is already deleted", 400);
  }

  return globalPrisma.rentalCompany.update({
    where: { id: companyId },
    data: { status: "ACCOUNT_DELETED" },
    select: selectCompanyListItem,
  });
};
