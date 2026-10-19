-- Add club column to events table
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS club text NOT NULL DEFAULT 'General Club';