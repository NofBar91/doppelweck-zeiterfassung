import { z } from "zod";

/** Statuswerte für Freigabe-Workflow */
export const TimeEntryStatusEnum = z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]);

/** Body für POST /api/time-entries */
export const TimeEntryCreateSchema = z.object({
  workDate: z.string().datetime(), // ISO-String
  startUtc: z.string().datetime(),
  endUtc: z.string().datetime(),
  location: z.string().optional(),
  note: z.string().optional(),
});

/** Body für PATCH /api/time-entries/[id] */
export const TimeEntryUpdateSchema = z.object({
  workDate: z.string().datetime().optional(),
  startUtc: z.string().datetime().optional(),
  endUtc: z.string().datetime().optional(),
  location: z.string().optional(),
  note: z.string().optional(),
  status: TimeEntryStatusEnum.optional(),
});

/** Monat einreichen */
export const SubmitMonthSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format YYYY-MM"),
});

/** Tag einreichen */
export const SubmitDaySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD"),
});
