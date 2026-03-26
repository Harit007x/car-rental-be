import { z } from "zod";

export const superAdminRegisterSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Name is required"),
    mobile: z.string().min(5, "Mobile is required"),
    address: z.string().min(5, "Address is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(1, "Refresh token is required"),
  }),
});
