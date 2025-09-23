// src/lib/validators/users.ts
import { z } from "zod";

// helper: normalisiert beliebige Eingaben auf "ADMIN" | "EMPLOYEE"
const normalizeRole = (v: unknown) =>
  typeof v === "string" ? v.trim().toUpperCase() : v;

export const RoleEnum = z.enum(["ADMIN", "EMPLOYEE"]);

export const InviteCreateSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  role: z.preprocess(normalizeRole, RoleEnum).default("EMPLOYEE"),
});

// wird evtl. schon verwendet – hier direkt robust:
export const ResetRequestSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
});

export const CreateUserDirectSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(6, "Mindestens 6 Zeichen"),
  role: z.preprocess(normalizeRole, RoleEnum).default("EMPLOYEE"),
});
