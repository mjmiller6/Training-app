export type WorkoutType = 'swim' | 'bike' | 'run' | 'brick' | 'rest' | 'double-threshold';
export type IntensityLevel = 'easy' | 'moderate' | 'threshold' | 'hard' | 'race';
export type RaceType = 'sprint' | 'olympic' | 'half-ironman' | 'ironman' | 'other';
export type PlanType = 'standard' | 'masters';

export interface DaySchedule {
  dayOfWeek: number; // 1=Mon, 7=Sun
  type: WorkoutType;
  sessionFocus?: 'swim' | 'bike' | 'run'; // for double-threshold, which is AM session
}

export interface Workout {
  id: string;
  user_id: string;
  type: WorkoutType;
  date: string;
  duration: number; // minutes
  distance?: number; // km
  calories?: number;
  avg_heart_rate?: number;
  rpe?: number; // 1-10 Rate of Perceived Exertion
  notes?: string;
  created_at: string;
}

export interface TrainingPlan {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  duration_weeks: number;
  start_date?: string;
  is_active: boolean;
  plan_type: PlanType;
  race_type?: RaceType;
  weekly_template?: DaySchedule[];
  created_at: string;
  plan_workouts?: PlanWorkout[];
}

export interface PlanWorkout {
  id: string;
  plan_id: string;
  week_number: number;
  day_of_week: number;
  type: WorkoutType;
  duration?: number;
  distance?: number;
  description?: string;
  intensity?: IntensityLevel;
  session_number?: number; // 1=AM, 2=PM for double threshold
}

export interface Race {
  id: string;
  user_id: string;
  name: string;
  date: string;
  location?: string;
  type: RaceType;
  goal_time?: number;
  completed: boolean;
  actual_time?: number;
  notes?: string;
  created_at: string;
}

export interface WeeklyLoad {
  week: string;
  totalMinutes: number;
  avgRpe: number;
  trainingLoad: number; // duration * RPE factor
  completionRate: number; // % of planned workouts completed
}

export interface AdaptiveRecommendation {
  action: 'reduce' | 'maintain' | 'increase';
  reason: string;
  adjustmentPercent: number;
}
