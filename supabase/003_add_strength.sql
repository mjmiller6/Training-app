-- Migration 003: Add strength session type
-- Run in Supabase SQL Editor

ALTER TABLE workouts
  DROP CONSTRAINT IF EXISTS workouts_type_check;
ALTER TABLE workouts
  ADD CONSTRAINT workouts_type_check
    CHECK (type IN ('swim', 'bike', 'run', 'brick', 'rest', 'double-threshold', 'strength'));

ALTER TABLE plan_workouts
  DROP CONSTRAINT IF EXISTS plan_workouts_type_check;
ALTER TABLE plan_workouts
  ADD CONSTRAINT plan_workouts_type_check
    CHECK (type IN ('swim', 'bike', 'run', 'brick', 'rest', 'double-threshold', 'strength'));
