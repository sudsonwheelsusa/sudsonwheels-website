import { z } from "zod";

const amountSchema = z.coerce.number().positive("Enter a valid quote amount.");
const dateTimeSchema = z
  .string()
  .min(1, "Pick a schedule time.")
  .refine((value) => !Number.isNaN(Date.parse(value)), "Enter a valid date.");

export const adminLeadWorkflowSchema = z
  .object({
    action: z.enum(["approve", "reject", "quote", "schedule"]),
    internal_notes: z.string().max(5000).optional(),
    estimate_notes: z.string().max(5000).optional(),
    quoted_amount: amountSchema.optional(),
    scheduled_start: dateTimeSchema.optional(),
    scheduled_end: dateTimeSchema.optional(),
    title: z.string().max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.action === "quote" && value.quoted_amount == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A quote amount is required.",
        path: ["quoted_amount"],
      });
    }

    if (value.action === "schedule" && !value.scheduled_start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A start time is required.",
        path: ["scheduled_start"],
      });
    }
  });

export type AdminLeadWorkflowInput = z.infer<typeof adminLeadWorkflowSchema>;
