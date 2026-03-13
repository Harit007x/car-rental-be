// In a real app, you'd import Prisma here:
// import { PrismaClient } from '@prisma/client';
// const prisma = new PrismaClient();

// For the starter kit, we'll use a placeholder until prisma is generated
const mockVehicles: any[] = [];

export const createVehicle = async (data: any) => {
  const newVehicle = { id: Date.now().toString(), ...data };
  mockVehicles.push(newVehicle);
  return newVehicle;
};

export const getAllVehicles = async () => {
  return mockVehicles;
};
