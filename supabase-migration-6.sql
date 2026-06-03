-- InTrackLog Migration 6: business/personal trip classification (for reimbursement)
-- Run this in your Supabase SQL Editor.
--
-- Adds a classification to trip entries so reimbursable mileage = business km
-- only (mirrors how reimbursement apps separate work driving from personal).
-- NULL = unclassified (needs review). Expenses leave this NULL.

ALTER TABLE entries
  ADD COLUMN IF NOT EXISTS trip_type TEXT
  CHECK (trip_type IN ('business', 'personal'));
