import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Race } from '../types';

export function useRaces() {
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRaces = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from('races')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('date', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setRaces(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRaces();
  }, [fetchRaces]);

  function getUpcomingRaces(): Race[] {
    const today = new Date().toISOString().split('T')[0];
    return races.filter((r) => r.date >= today && !r.completed);
  }

  function getPastRaces(): Race[] {
    const today = new Date().toISOString().split('T')[0];
    return races.filter((r) => r.date < today || r.completed);
  }

  function getNextRace(): Race | null {
    const upcoming = getUpcomingRaces();
    return upcoming.length > 0 ? upcoming[0] : null;
  }

  function getDaysUntilRace(race: Race): number {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const raceDate = new Date(race.date + 'T00:00:00');
    const diff = raceDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  async function createRace(
    race: Omit<Race, 'id' | 'user_id' | 'created_at'>
  ): Promise<{ data: Race | null; error: string | null }> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return { data: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('races')
      .insert({ ...race, user_id: userData.user.id })
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    await fetchRaces();
    return { data, error: null };
  }

  async function updateRace(
    id: string,
    updates: Partial<Omit<Race, 'id' | 'user_id' | 'created_at'>>
  ): Promise<{ error: string | null }> {
    const { error } = await supabase.from('races').update(updates).eq('id', id);
    if (error) return { error: error.message };
    await fetchRaces();
    return { error: null };
  }

  async function deleteRace(id: string): Promise<{ error: string | null }> {
    const { error } = await supabase.from('races').delete().eq('id', id);
    if (error) return { error: error.message };
    await fetchRaces();
    return { error: null };
  }

  return {
    races,
    loading,
    error,
    refetch: fetchRaces,
    getUpcomingRaces,
    getPastRaces,
    getNextRace,
    getDaysUntilRace,
    createRace,
    updateRace,
    deleteRace,
  };
}
