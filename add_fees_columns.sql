-- Run this in your Supabase SQL Editor to add the missing columns for the new Setting module

ALTER TABLE fees
ADD COLUMN IF NOT EXISTS semester text,
ADD COLUMN IF NOT EXISTS inter_class text;
