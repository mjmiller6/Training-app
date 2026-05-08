-- ============================================================
-- Migration 002: Adaptive training fields
-- Run this in Supabase SQL Editor after 001 (schema.sql)
-- ============================================================

-- Add RPE to workouts
ALTER TABLE workouts
  ADD COLUMN IF NOT EXISTS rpe INTEGER CHECK (rpe BETWEEN 1 AND 10);

-- Add plan_type, race_type, weekly_template to training_plans
ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'standard'
    CHECK (plan_type IN ('standard', 'masters'));

ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS race_type TEXT
    CHECK (race_type IN ('sprint', 'olympic', 'half-ironman', 'ironman', 'other'));

ALTER TABLE training_plans
  ADD COLUMN IF NOT EXISTS weekly_template JSONB;

-- Add session_number to plan_workouts (for double threshold AM/PM)
ALTER TABLE plan_workouts
  ADD COLUMN IF NOT EXISTS session_number INTEGER DEFAULT 1;

-- Update intensity check to include threshold
ALTER TABLE plan_workouts
  DROP CONSTRAINT IF EXISTS plan_workouts_intensity_check;

ALTER TABLE plan_workouts
  ADD CONSTRAINT plan_workouts_intensity_check
    CHECK (intensity IN ('easy', 'moderate', 'threshold', 'hard', 'race'));

-- Update workout type check to include double-threshold
ALTER TABLE workouts
  DROP CONSTRAINT IF EXISTS workouts_type_check;

ALTER TABLE workouts
  ADD CONSTRAINT workouts_type_check
    CHECK (type IN ('swim', 'bike', 'run', 'brick', 'rest', 'double-threshold'));

ALTER TABLE plan_workouts
  DROP CONSTRAINT IF EXISTS plan_workouts_type_check;

ALTER TABLE plan_workouts
  ADD CONSTRAINT plan_workouts_type_check
    CHECK (type IN ('swim', 'bike', 'run', 'brick', 'rest', 'double-threshold'));
