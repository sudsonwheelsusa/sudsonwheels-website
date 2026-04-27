ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS google_channel_token TEXT;
