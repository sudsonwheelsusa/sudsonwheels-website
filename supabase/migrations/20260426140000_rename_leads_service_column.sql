-- Rename service column to service_name for consistency
ALTER TABLE public.leads
  RENAME COLUMN service TO service_name;
