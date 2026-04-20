import { z } from "zod";

export const adminMarkDoneSchema = z.object({
  completed_at: z.string().datetime().nullable(),
});

export type AdminMarkDoneInput = z.infer<typeof adminMarkDoneSchema>;
