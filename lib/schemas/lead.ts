import { z } from "zod";

export const leadSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z
    .string()
    .min(10, "Enter a valid phone number")
    .regex(/^[\d\s\-().+]+$/, "Enter a valid phone number"),
  email: z.string().email("Enter a valid email address"),
  service_id: z.string().uuid("Select a service"),
  location_address: z.string().min(5, "Enter the service address"),
  location_lat: z.number().min(-90).max(90).optional(),
  location_lng: z.number().min(-180).max(180).optional(),
  message: z.string().max(5000).optional(),
  website: z.string().max(0).optional(),
  turnstile_token: z
    .string({ invalid_type_error: "Bot verification required" })
    .min(1, "Bot verification required"),
});

export type LeadInput = z.infer<typeof leadSchema>;
