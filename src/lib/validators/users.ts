import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().toLowerCase().email(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).default("EMPLOYEE"),
  password: z.string().min(8, "Mindestens 8 Zeichen").max(100),
});

export const UpdateUserSchema = z.object({
  name: z.string().trim().max(100).nullable().optional(),
  role: z.enum(["ADMIN", "EMPLOYEE"]).optional(),
  password: z.string().min(8, "Mindestens 8 Zeichen").max(100).optional(),
});

export const InviteCreateSchema = z.object({
  email: z.string().email(),
  role: z.enum(["ADMIN", "EMPLOYEE"]),
});

export const AcceptInviteSchema = z.object({
  token: z.string().min(10),
  name: z.string().min(2).max(100),
  password: z.string().min(8),
});

export const ResetRequestSchema = z.object({
  email: z.string().email(),
});

export const ResetPerformSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
