import { PlanWorkout, DaySchedule, RaceType, PlanType, WorkoutType, IntensityLevel } from '../types';

// Base weekly volumes in minutes per discipline
const BASE_VOLUMES: Record<RaceType, { swim: number; bike: number; run: number }> = {
  sprint:        { swim: 80,  bike: 100, run: 80  },
  olympic:       { swim: 110, bike: 160, run: 110 },
  'half-ironman':{ swim: 140, bike: 280, run: 160 },
  ironman:       { swim: 180, bike: 420, run: 240 },
  other:         { swim: 100, bike: 140, run: 100 },
};

// How much each week builds relative to base (peaks at week 75% of plan)
function getVolumeMultiplier(
  week: number,
  totalWeeks: number,
  isRecovery: boolean,
  planType: PlanType
): number {
  if (isRecovery) return 0.60;
  const progress = week / totalWeeks;
  // Build from 60% to 100%, peak around 80% of plan, then slight taper
  if (progress < 0.8) {
    return 0.60 + progress * 0.50;
  }
  return 1.0 - (progress - 0.8) * 0.5; // slight taper last 20%
}

function isRecoveryWeek(week: number, planType: PlanType): boolean {
  const blockSize = planType === 'masters' ? 3 : 4; // masters: 2 build + 1 recovery
  return week % blockSize === 0;
}

function getDurationForType(
  type: WorkoutType,
  raceType: RaceType,
  volumeMultiplier: number,
  isLongDay: boolean,
  planType: PlanType
): number {
  const base = BASE_VOLUMES[raceType];
  const mastersFactor = planType === 'masters' ? 0.85 : 1.0;

  let minutes: number;
  switch (type) {
    case 'swim':
      minutes = isLongDay ? base.swim * 1.3 : base.swim * 0.7;
      break;
    case 'bike':
      minutes = isLongDay ? base.bike * 1.8 : base.bike * 0.6;
      break;
    case 'run':
      minutes = isLongDay ? base.run * 1.5 : base.run * 0.6;
      break;
    case 'brick':
      minutes = (base.bike * 0.8 + base.run * 0.4);
      break;
    case 'strength':
      minutes = 45; // Standard S&C session
      break;
    case 'double-threshold':
      minutes = base.swim * 0.6;
      break;
    default:
      minutes = 45;
  }

  return Math.round(minutes * volumeMultiplier * mastersFactor / 5) * 5; // round to nearest 5
}

function getIntensity(
  type: WorkoutType,
  isRecovery: boolean,
  isLongDay: boolean,
  planType: PlanType,
  weekProgress: number
): IntensityLevel {
  if (isRecovery) return 'easy';
  if (type === 'double-threshold') return 'threshold';
  if (type === 'brick') return weekProgress > 0.6 ? 'moderate' : 'easy';

  if (isLongDay) return 'easy'; // long days are always easy aerobic

  // Intensity progression through the plan
  if (weekProgress < 0.3) return 'easy';
  if (weekProgress < 0.6) return planType === 'masters' ? 'easy' : 'moderate';
  if (weekProgress < 0.85) return planType === 'masters' ? 'moderate' : 'hard';
  return 'moderate'; // taper week
}

function estimateDistance(type: WorkoutType, duration: number): number | undefined {
  // Rough pace estimates
  switch (type) {
    case 'swim': return parseFloat((duration * 0.060).toFixed(1)); // ~1:40/100m
    case 'bike': return parseFloat((duration * 0.55).toFixed(1));  // ~33 km/h
    case 'run':  return parseFloat((duration * 0.175).toFixed(1)); // ~5:43/km
    default: return undefined;
  }
}

function generateDescription(
  type: WorkoutType,
  intensity: IntensityLevel,
  isLongDay: boolean,
  isRecovery: boolean,
  sessionNumber?: number
): string {
  if (isRecovery) {
    const recoveryDescs: Partial<Record<WorkoutType, string>> = {
      swim: 'Easy recovery swim — focus on technique, no effort',
      bike: 'Easy spin — keep HR zone 1-2, full recovery',
      run:  'Easy jog — conversational pace, full recovery',
    };
    return recoveryDescs[type] ?? 'Easy recovery session';
  }

  if (type === 'double-threshold') {
    if (sessionNumber === 1) return 'AM: Threshold swim — 6×200m @ T-pace with 30s rest';
    if (sessionNumber === 2) return 'PM: Threshold run — 4×8min @ threshold pace, 2min jog recovery';
    return 'Double threshold — two threshold sessions (AM + PM)';
  }

  if (isLongDay) {
    const longDescs: Partial<Record<WorkoutType, string>> = {
      swim: 'Long steady swim — build endurance, even pace throughout',
      bike: 'Long ride — steady zone 2, practice nutrition strategy',
      run:  'Long run — easy aerobic, build time on feet',
    };
    return longDescs[type] ?? 'Long endurance session';
  }

  const descs: Record<IntensityLevel, Partial<Record<WorkoutType, string>>> = {
    easy:      { swim: 'Easy swim — drills + steady aerobic', bike: 'Easy spin — zone 2 aerobic', run: 'Easy run — zone 2, conversational', strength: 'Light S&C — mobility, activation, core' },
    moderate:  { swim: 'Moderate swim — steady state + some pace work', bike: 'Tempo ride — zone 3, comfortably hard', run: 'Tempo run — comfortably hard effort', strength: 'S&C — strength endurance, functional movements' },
    threshold: { swim: 'Threshold swim — intervals at T-pace', bike: 'Threshold bike — sustained effort at FTP', run: 'Threshold run — lactate threshold pace', strength: 'S&C — heavy compound lifts, power work' },
    hard:      { swim: 'Hard swim — race pace intervals', bike: 'Hard ride — VO2max efforts', run: 'Hard run — VO2max or race pace', strength: 'S&C — max strength, explosive work' },
    race:      { swim: 'Race pace swim', bike: 'Race simulation ride', run: 'Race pace run', strength: 'Race week S&C — activation only' },
  };

  return descs[intensity]?.[type] ?? `${intensity} ${type} session`;
}

// Determine which days are "long" days (weekend long sessions)
function isLongDay(dayOfWeek: number, type: WorkoutType): boolean {
  // Saturday or Sunday = potential long day for bike/run
  return (dayOfWeek === 6 || dayOfWeek === 7) && (type === 'bike' || type === 'run');
}

export function generatePlanWorkouts(
  planId: string,
  durationWeeks: number,
  weeklyTemplate: DaySchedule[],
  planType: PlanType,
  raceType: RaceType
): Omit<PlanWorkout, 'id'>[] {
  const workouts: Omit<PlanWorkout, 'id'>[] = [];

  for (let week = 1; week <= durationWeeks; week++) {
    const recovery = isRecoveryWeek(week, planType);
    const weekProgress = week / durationWeeks;
    const volumeMultiplier = getVolumeMultiplier(week, durationWeeks, recovery, planType);

    for (const daySchedule of weeklyTemplate) {
      if (daySchedule.sessions.length === 0) continue;

      daySchedule.sessions.forEach((session, sessionIdx) => {
        if (session.type === 'rest') return;

        const longDay = isLongDay(daySchedule.dayOfWeek, session.type);
        const duration = getDurationForType(session.type, raceType, volumeMultiplier, longDay, planType);
        const intensity = getIntensity(session.type, recovery, longDay, planType, weekProgress);
        const sessionNumber = sessionIdx + 1;

        if (session.type === 'double-threshold') {
          const amType: WorkoutType = session.sessionFocus ?? 'swim';
          workouts.push({
            plan_id: planId, week_number: week, day_of_week: daySchedule.dayOfWeek,
            type: amType,
            duration: recovery ? Math.round(duration * 0.6) : duration,
            distance: estimateDistance(amType, duration),
            intensity: recovery ? 'easy' : 'threshold',
            description: recovery ? 'Easy recovery swim' : generateDescription('double-threshold', 'threshold', false, false, 1),
            session_number: sessionNumber,
          });
          if (!recovery) {
            const pmDuration = Math.round(duration * 0.7);
            workouts.push({
              plan_id: planId, week_number: week, day_of_week: daySchedule.dayOfWeek,
              type: 'run', duration: pmDuration,
              distance: estimateDistance('run', pmDuration),
              intensity: 'threshold',
              description: generateDescription('double-threshold', 'threshold', false, false, 2),
              session_number: sessionNumber + 0.5,
            });
          }
        } else {
          workouts.push({
            plan_id: planId, week_number: week, day_of_week: daySchedule.dayOfWeek,
            type: session.type, duration,
            distance: estimateDistance(session.type, duration),
            intensity,
            description: generateDescription(session.type, intensity, longDay, recovery),
            session_number: sessionNumber,
          });
        }
      });
    }
  }

  return workouts;
}

// Adaptive training: analyse last week's workouts and recommend adjustment
export function getAdaptiveRecommendation(
  recentWorkouts: { duration: number; rpe?: number; date: string }[],
  plannedWorkouts: { duration: number }[]
): { action: 'reduce' | 'maintain' | 'increase'; reason: string; adjustmentPercent: number } {
  if (recentWorkouts.length === 0) {
    return { action: 'maintain', reason: 'Not enough data yet', adjustmentPercent: 0 };
  }

  const workoutsWithRpe = recentWorkouts.filter(w => w.rpe != null);
  const avgRpe = workoutsWithRpe.length > 0
    ? workoutsWithRpe.reduce((s, w) => s + (w.rpe ?? 0), 0) / workoutsWithRpe.length
    : 0;

  const plannedTotal = plannedWorkouts.reduce((s, w) => s + w.duration, 0);
  const completedTotal = recentWorkouts.reduce((s, w) => s + w.duration, 0);
  const completionRate = plannedTotal > 0 ? completedTotal / plannedTotal : 1;

  // High RPE + low completion = reduce
  if (avgRpe >= 8 || completionRate < 0.6) {
    return {
      action: 'reduce',
      reason: avgRpe >= 8
        ? `High average RPE (${avgRpe.toFixed(1)}/10) — your body needs more recovery`
        : `Low completion rate (${Math.round(completionRate * 100)}%) — consider reducing load`,
      adjustmentPercent: 15,
    };
  }

  // Moderate-high RPE = maintain
  if (avgRpe >= 6 || completionRate < 0.85) {
    return {
      action: 'maintain',
      reason: `Good training load — RPE ${avgRpe.toFixed(1)}/10, ${Math.round(completionRate * 100)}% completion`,
      adjustmentPercent: 0,
    };
  }

  // Low RPE + high completion = ready to increase
  return {
    action: 'increase',
    reason: `Feeling strong — RPE ${avgRpe.toFixed(1)}/10, ${Math.round(completionRate * 100)}% completion`,
    adjustmentPercent: 5,
  };
}
