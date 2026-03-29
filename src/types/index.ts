export type WorkoutType = 'swim' | 'bike' | 'run' | 'brick' | 'rest';
export type IntensityLevel = 'easy' | 'moderate' | 'hard' | 'race';
export type RaceType = 'sprint' | 'olympic' | 'half-ironman' | 'ironman' | 'other';

export interface Workout {
  id: string;
  user_id: string;
  type: WorkoutType;
  date: string; // ISO date string YYYY-MM-DD
  duration: number; // minutes
  distance?: number; // km
  calories?: number;
  avg_heart_rate?: number;
  notes?: string;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_weeks: number;
  start_date?: string; // ISO date string YYYY-MM-DD
  is_active: boolean;
  created_at: string;
  plan_workouts?: PlanWorkout[];
}

export interface PlanWorkout {
  id: string;
  plan_id: string;
  week_number: number;
  day_of_week: number; // 1=Mon, 7=Sun
  type: WorkoutType;
  duration?: number; // minutes
  distance?: number; // km
  description?: string;
  intensity?: IntensityLevel;
}

export interface Race {
  id: string;
  user_id: string;
  name: string;
  date: string; // ISO date string YYYY-MM-DD
  location?: string;
  type: RaceType;
  goal_time?: number; // minutes
  completed: boolean;
  actual_time?: number; // minutes
  notes?: string;
  created_at: string;
}

export interface WeeklyStats {
  week: string;
  swimMinutes: number;
  bikeMinutes: number;
  runMinutes: number;
  swimKm: number;
  bikeKm: number;
  runKm: number;
  totalMinutes: number;
  totalKm: number;
}
