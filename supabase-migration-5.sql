-- InTrackLog Migration 5: store trip distance with one-decimal precision
-- Run this in your Supabase SQL Editor.
--
-- Background: entries.trip_km was INTEGER. GPS-tracked trips produce a
-- fractional distance (e.g. 12.3 km), and inserting a decimal into an INTEGER
-- column was rejected by Postgres — so GPS trips silently failed to save and
-- the app reported them as "too short". Widening the column to NUMERIC(10,1)
-- lets trips keep their tenth-of-a-km precision (matching the UI, which shows
-- one decimal). reading_km stays INTEGER — odometer readings are whole numbers.
--
-- Existing whole-number values cast cleanly (13 -> 13.0).

ALTER TABLE entries
  ALTER COLUMN trip_km TYPE NUMERIC(10,1) USING trip_km::numeric(10,1);
