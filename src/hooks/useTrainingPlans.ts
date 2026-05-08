import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { TrainingPlan, PlanWorkout } from '../types';

export function useTrainingPlans() {
  const [plans, setPlans] = useState<TrainingPlan[]>([]);
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('training_plans')
      .select('*, plan_workouts(*)')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      const planList = data ?? [];
      setPlans(planList);
      setActivePlan(planList.find((p) => p.is_active) ?? null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  function getTodayWorkout(): PlanWorkout | null {
    if (!activePlan || !activePlan.start_date) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(activePlan.start_date + 'T00:00:00');
    const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return null;

    const weekNumber = Math.floor(daysDiff / 7) + 1;
    if (weekNumber > activePlan.duration_weeks) return null;

    // day_of_week: 1=Mon, 7=Sun
    const dayOfWeek = today.getDay() === 0 ? 7 : today.getDay();

    return (
      activePlan.plan_workouts?.find(
        (w) => w.week_number === weekNumber && w.day_of_week === dayOfWeek
      ) ?? null
    );
  }

  function getCurrentWeek(): number {
    if (!activePlan || !activePlan.start_date) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(activePlan.start_date + 'T00:00:00');
    const daysDiff = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    if (daysDiff < 0) return 0;
    return Math.min(Math.floor(daysDiff / 7) + 1, activePlan.duration_weeks);
  }

  async function createPlan(
    plan: Omit<TrainingPlan, 'id' | 'user_id' | 'created_at' | 'plan_workouts'> & { plan_type?: string; race_type?: string; weekly_template?: any[] }
  ): Promise<{ data: TrainingPlan | null; error: string | null }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('training_plans')
      .insert({ ...plan, user_id: userData.user.id })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    await fetchPlans();
    return { data, error: null };
  }

  async function setActivePlanById(planId: string): Promise<{ error: string | null }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { error: 'Not authenticated' };

    // Deactivate all plans for this user
    await supabase
      .from('training_plans')
      .update({ is_active: false })
      .eq('user_id', userData.user.id);

    // Activate selected plan
    const { error } = await supabase
      .from('training_plans')
      .update({ is_active: true })
      .eq('id', planId);

    if (error) return { error: error.message };
    await fetchPlans();
    return { error: null };
  }

  async function deletePlan(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('training_plans').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchPlans();
    return { error: null };
  }

  async function addPlanWorkout(
    workout: Omit<PlanWorkout, 'id'>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.from('plan_workouts').insert(workout);
    if (error) return { error: error.message };
    await fetchPlans();
    return { error: null };
  }

  async function deletePlanWorkout(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('plan_workouts').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchPlans();
    return { error: null };
  }

  return {
    plans,
    activePlan,
    loading,
    error,
    refetch: fetchPlans,
    getTodayWorkout,
    getCurrentWeek,
    createPlan,
    setActivePlan: setActivePlanById,
    deletePlan,
    addPlanWorkout,
    deletePlanWorkout,
  };
}
