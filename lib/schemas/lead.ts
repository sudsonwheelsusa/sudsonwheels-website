import { z } from "zod";

export const leadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^[\d\s\-().+]+$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  service: z.string().min(1, "Select a service"),
  message: z.string().optional(),
  turnstile_token: z.string().min(1, "Bot verification required"),
});

export type LeadInput = z.infer<typeof leadSchema>;
