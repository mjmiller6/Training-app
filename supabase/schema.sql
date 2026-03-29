-- ============================================================
-- Triathlon Training App — Supabase Schema
-- Run this in your Supabase SQL Editor at:
-- https://supabase.com/dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (already enabled in Supabase by default)
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- WORKOUTS
-- ============================================================
CREATE TABLE IF NOT EXISTS workouts (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type        TEXT    NOT NULL CHECK (type IN ('swim', 'bike', 'run', 'brick', 'rest')),
  date        DATE    NOT NULL,
  duration    INTEGER NOT NULL CHECK (duration > 0),   -- minutes
  distance    DECIMAL(10, 2),                           -- km
  calories    INTEGER,
  avg_heart_rate INTEGER,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS workouts_user_date_idx ON workouts (user_id, date DESC);

-- Row Level Security
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own workouts"
  ON workouts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own workouts"
  ON workouts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own workouts"
  ON workouts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts"
  ON workouts FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- TRAINING PLANS
-- ============================================================
CREATE TABLE IF NOT EXISTS training_plans (
  id             UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name           TEXT    NOT NULL,
  description    TEXT,
  duration_weeks INTEGER NOT NULL CHECK (duration_weeks BETWEEN 1 AND 52),
  start_date     DATE,
  is_active      BOOLEAN DEFAULT FALSE NOT NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS training_plans_user_idx ON training_plans (user_id);

ALTER TABLE training_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own training plans"
  ON training_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training plans"
  ON training_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training plans"
  ON training_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own training plans"
  ON training_plans FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- PLAN WORKOUTS (scheduled sessions within a plan)
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_workouts (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id      UUID    NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
  week_number  INTEGER NOT NULL CHECK (week_number >= 1),
  day_of_week  INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),  -- 1=Mon, 7=Sun
  type         TEXT    NOT NULL CHECK (type IN ('swim', 'bike', 'run', 'brick', 'rest')),
  duration     INTEGER CHECK (duration > 0),   -- minutes
  distance     DECIMAL(10, 2),                  -- km
  description  TEXT,
  intensity    TEXT    CHECK (intensity IN ('easy', 'moderate', 'hard', 'race'))
);

CREATE INDEX IF NOT EXISTS plan_workouts_plan_idx ON plan_workouts (plan_id, week_number, day_of_week);

ALTER TABLE plan_workouts ENABLE ROW LEVEL SECURITY;

-- plan_workouts are accessible if the user owns the parent plan
CREATE POLICY "Users can view their own plan workouts"
  ON plan_workouts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = plan_workouts.plan_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into their own plans"
  ON plan_workouts FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = plan_workouts.plan_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own plan workouts"
  ON plan_workouts FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = plan_workouts.plan_id
        AND tp.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own plan workouts"
  ON plan_workouts FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM training_plans tp
      WHERE tp.id = plan_workouts.plan_id
        AND tp.user_id = auth.uid()
    )
  );


-- ============================================================
-- RACES
-- ============================================================
CREATE TABLE IF NOT EXISTS races (
  id          UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID    NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  date        DATE    NOT NULL,
  location    TEXT,
  type        TEXT    NOT NULL CHECK (type IN ('sprint', 'olympic', 'half-ironman', 'ironman', 'other')),
  goal_time   INTEGER,                -- minutes
  completed   BOOLEAN DEFAULT FALSE NOT NULL,
  actual_time INTEGER,                -- minutes
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS races_user_date_idx ON races (user_id, date ASC);

ALTER TABLE races ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own races"
  ON races FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own races"
  ON races FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own races"
  ON races FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own races"
  ON races FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- HELPER: Enforce only one active plan per user
-- ============================================================
CREATE OR REPLACE FUNCTION enforce_single_active_plan()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = TRUE THEN
    UPDATE training_plans
    SET is_active = FALSE
    WHERE user_id = NEW.user_id
      AND id <> NEW.id
      AND is_active = TRUE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER single_active_plan_trigger
  BEFORE INSERT OR UPDATE ON training_plans
  FOR EACH ROW
  EXECUTE FUNCTION enforce_single_active_plan();
