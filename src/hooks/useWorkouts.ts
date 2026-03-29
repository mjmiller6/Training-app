import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Workout, WorkoutType } from '../types';

export function useWorkouts(filterType?: WorkoutType) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkouts = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    let query = supabase
      .from('workouts')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });

    if (filterType) {
      query = query.eq('type', filterType);
    }

    const { data, error: fetchError } = await query;
    if (fetchError) {
      setError(fetchError.message);
    } else {
      setWorkouts(data ?? []);
    }
    setLoading(false);
  }, [filterType]);

  useEffect(() => {
    fetchWorkouts();
  }, [fetchWorkouts]);

  async function createWorkout(
    workout: Omit<Workout, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ data: Workout | null; error: string | null }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('workouts')
      .insert({ ...workout, user_id: userData.user.id })
      .select()
      .single();

    if (error) return { data: null, error: error.message };

    await fetchWorkouts();
    return { data, error: null };
  }

  async function updateWorkout(
    id: string,
    updates: Partial<Omit<Workout, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.from('workouts').update(updates).eq('id', id);
    if (error) return { error: error.message };
    await fetchWorkouts();
    return { error: null };
  }

  async function deleteWorkout(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('workouts').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchWorkouts();
    return { error: null };
  }

  // Weekly stats for the last N weeks
  async function getWeeklyStats(weeks = 8) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - weeks * 7);

    const { data } = await supabase
      .from('workouts')
      .select('type, date, duration, distance')
      .eq('user_id', userData.user.id)
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: true });

    return data ?? [];
  }

  return {
    workouts,
    loading,
    error,
    refetch: fetchWorkouts,
    createWorkout,
    updateWorkout,
    deleteWorkout,
    getWeeklyStats,
  };
}
