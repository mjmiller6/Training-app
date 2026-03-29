import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useWorkouts } from '../hooks/useWorkouts';
import { useRaces } from '../hooks/useRaces';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { DisciplineIcon, getDisciplineColor, getDisciplineLabel } from '../components/DisciplineIcon';
import { StatCard } from '../components/StatCard';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function HomeScreen() {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('Athlete');
  const [refreshing, setRefreshing] = useState(false);

  const { workouts, refetch: refetchWorkouts } = useWorkouts();
  const { getNextRace, getDaysUntilRace, refetch: refetchRaces } = useRaces();
  const { activePlan, getTodayWorkout, getCurrentWeek, refetch: refetchPlans } = useTrainingPlans();

  const nextRace = getNextRace();
  const todayWorkout = getTodayWorkout();
  const currentWeek = getCurrentWeek();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const name = data.user?.user_metadata?.full_name;
      if (name) setUserName(name.split(' ')[0]);
    });
  }, []);

  // This week's stats (Mon-Sun)
  const thisWeekStats = React.useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    monday.setHours(0, 0, 0, 0);
    const mondayStr = monday.toISOString().split('T')[0];

    return workouts
      .filter((w) => w.date >= mondayStr)
      .reduce(
        (acc, w) => ({
          totalMinutes: acc.totalMinutes + w.duration,
          swimMinutes: acc.swimMinutes + (w.type === 'swim' ? w.duration : 0),
          bikeMinutes: acc.bikeMinutes + (w.type === 'bike' ? w.duration : 0),
          runMinutes: acc.runMinutes + (w.type === 'run' ? w.duration : 0),
          totalKm: acc.totalKm + (w.distance ?? 0),
          count: acc.count + 1,
        }),
        { totalMinutes: 0, swimMinutes: 0, bikeMinutes: 0, runMinutes: 0, totalKm: 0, count: 0 }
      );
  }, [workouts]);

  async function onRefresh() {
    setRefreshing(true);
    await Promise.all([refetchWorkouts(), refetchRaces(), refetchPlans()]);
    setRefreshing(false);
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>{getGreeting()},</Text>
            <Text style={styles.userName}>{userName} 👋</Text>
          </View>
          <TouchableOpacity onPress={handleSignOut} style={styles.signOutBtn}>
            <Ionicons name="log-out-outline" size={22} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Today's Workout */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Workout</Text>
          {todayWorkout ? (
            <LinearGradient
              colors={[COLORS.surface, COLORS.surfaceElevated]}
              style={styles.todayCard}
            >
              <DisciplineIcon type={todayWorkout.type} size={28} />
              <View style={styles.todayInfo}>
                <Text style={styles.todayType}>
                  {getDisciplineLabel(todayWorkout.type)}
                  {todayWorkout.intensity ? ` — ${todayWorkout.intensity}` : ''}
                </Text>
                <View style={styles.todayStats}>
                  {todayWorkout.duration != null && (
                    <Text style={styles.todayStat}>⏱ {formatDuration(todayWorkout.duration)}</Text>
                  )}
                  {todayWorkout.distance != null && (
                    <Text style={styles.todayStat}>📍 {todayWorkout.distance} km</Text>
                  )}
                </View>
                {todayWorkout.description ? (
                  <Text style={styles.todayDesc}>{todayWorkout.description}</Text>
                ) : null}
              </View>
              <TouchableOpacity
                style={styles.logButton}
                onPress={() => navigation.navigate('Log', { screen: 'LogWorkout', params: {} })}
              >
                <Ionicons name="add-circle" size={32} color={COLORS.primary} />
              </TouchableOpacity>
            </LinearGradient>
          ) : activePlan ? (
            <View style={styles.emptyCard}>
              <Ionicons name="checkmark-circle" size={32} color={COLORS.success} />
              <Text style={styles.emptyText}>Rest day — you've earned it!</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.emptyCard}
              onPress={() => navigation.navigate('Plans')}
            >
              <Ionicons name="calendar-outline" size={32} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No active plan. Tap to create one.</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Next Race Countdown */}
        {nextRace && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Next Race</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('Races')}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[COLORS.primary + '22', COLORS.surface]}
                style={styles.raceCountdownCard}
              >
                <View style={styles.raceCountdownLeft}>
                  <Text style={styles.raceCountdownDays}>
                    {getDaysUntilRace(nextRace)}
                  </Text>
                  <Text style={styles.raceCountdownDaysLabel}>days</Text>
                </View>
                <View style={styles.raceCountdownRight}>
                  <View style={styles.raceTrophyRow}>
                    <Ionicons name="trophy" size={16} color={COLORS.warning} />
                    <Text style={styles.raceCountdownName}>{nextRace.name}</Text>
                  </View>
                  {nextRace.location ? (
                    <Text style={styles.raceCountdownLocation}>
                      📍 {nextRace.location}
                    </Text>
                  ) : null}
                  <Text style={styles.raceCountdownDate}>
                    {new Date(nextRace.date + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Active Plan Progress */}
        {activePlan && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Training Plan</Text>
            <View style={styles.planCard}>
              <View style={styles.planHeader}>
                <View>
                  <Text style={styles.planName}>{activePlan.name}</Text>
                  <Text style={styles.planWeek}>
                    Week {currentWeek} of {activePlan.duration_weeks}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('Plans', {
                      screen: 'PlanDetail',
                      params: { planId: activePlan.id, planName: activePlan.name },
                    })
                  }
                >
                  <Text style={styles.viewPlanLink}>View →</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min((currentWeek / activePlan.duration_weeks) * 100, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {Math.round((currentWeek / activePlan.duration_weeks) * 100)}% complete
              </Text>
            </View>
          </View>
        )}

        {/* This Week's Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.statsGrid}>
            <StatCard
              title="Total Time"
              value={formatDuration(thisWeekStats.totalMinutes)}
              icon="time-outline"
              iconColor={COLORS.primary}
            />
            <StatCard
              title="Distance"
              value={`${thisWeekStats.totalKm.toFixed(1)} km`}
              icon="navigate-outline"
              iconColor={COLORS.info}
            />
          </View>
          <View style={styles.statsGrid}>
            <StatCard
              title="Swim"
              value={formatDuration(thisWeekStats.swimMinutes)}
              icon="water"
              iconColor={COLORS.swim}
            />
            <StatCard
              title="Bike"
              value={formatDuration(thisWeekStats.bikeMinutes)}
              icon="bicycle"
              iconColor={COLORS.bike}
            />
            <StatCard
              title="Run"
              value={formatDuration(thisWeekStats.runMinutes)}
              icon="walk"
              iconColor={COLORS.run}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Log', { screen: 'LogWorkout', params: {} })}
            >
              <LinearGradient
                colors={[COLORS.primary, COLORS.primaryDark]}
                style={styles.quickActionGradient}
              >
                <Ionicons name="add-circle-outline" size={24} color={COLORS.white} />
                <Text style={styles.quickActionText}>Log Workout</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickAction}
              onPress={() => navigation.navigate('Races', { screen: 'AddRace', params: {} })}
            >
              <View style={styles.quickActionSecondary}>
                <Ionicons name="trophy-outline" size={24} color={COLORS.warning} />
                <Text style={styles.quickActionTextSecondary}>Add Race</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: SPACING.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  greeting: { fontSize: 14, color: COLORS.textSecondary },
  userName: { fontSize: 24, fontWeight: '800', color: COLORS.text },
  signOutBtn: { padding: SPACING.sm },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  // Today's workout
  todayCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  todayInfo: { flex: 1 },
  todayType: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  todayStats: { flexDirection: 'row', gap: SPACING.md, marginBottom: 4 },
  todayStat: { fontSize: 13, color: COLORS.textSecondary },
  todayDesc: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  logButton: {},
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyText: { flex: 1, fontSize: 14, color: COLORS.textSecondary },
  // Race countdown
  raceCountdownCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.primary + '44',
  },
  raceCountdownLeft: { alignItems: 'center', minWidth: 60 },
  raceCountdownDays: { fontSize: 44, fontWeight: '900', color: COLORS.primary, lineHeight: 50 },
  raceCountdownDaysLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  raceCountdownRight: { flex: 1 },
  raceTrophyRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  raceCountdownName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  raceCountdownLocation: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 2 },
  raceCountdownDate: { fontSize: 12, color: COLORS.textMuted },
  // Plan card
  planCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  planWeek: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  viewPlanLink: { fontSize: 14, color: COLORS.primary, fontWeight: '600' },
  progressBarBg: {
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    marginBottom: SPACING.xs,
  },
  progressBarFill: {
    height: 6,
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressLabel: { fontSize: 12, color: COLORS.textMuted },
  // Stats grid
  statsGrid: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.sm },
  // Quick actions
  quickActions: { flexDirection: 'row', gap: SPACING.sm },
  quickAction: { flex: 1 },
  quickActionGradient: {
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  quickActionSecondary: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickActionText: { fontSize: 13, fontWeight: '600', color: COLORS.white },
  quickActionTextSecondary: { fontSize: 13, fontWeight: '600', color: COLORS.text },
});
