import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarChart } from 'react-native-chart-kit';
import { useWorkouts } from '../hooks/useWorkouts';
import { StatCard } from '../components/StatCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { format, subWeeks, startOfWeek, endOfWeek } from 'date-fns';

const screenWidth = Dimensions.get('window').width;

interface WeekBucket {
  label: string;
  swimMins: number;
  bikeMins: number;
  runMins: number;
  totalMins: number;
  totalKm: number;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function StatsScreen() {
  const { workouts, loading, refetch } = useWorkouts();
  const [weeklyBuckets, setWeeklyBuckets] = useState<WeekBucket[]>([]);
  const [allTimeStats, setAllTimeStats] = useState({
    totalWorkouts: 0,
    totalMinutes: 0,
    totalKm: 0,
    swimMinutes: 0,
    bikeMinutes: 0,
    runMinutes: 0,
    swimKm: 0,
    bikeKm: 0,
    runKm: 0,
  });

  useEffect(() => {
    if (workouts.length === 0) return;

    // All-time stats
    const ats = workouts.reduce(
      (acc, w) => ({
        totalWorkouts: acc.totalWorkouts + 1,
        totalMinutes: acc.totalMinutes + w.duration,
        totalKm: acc.totalKm + (w.distance ?? 0),
        swimMinutes: acc.swimMinutes + (w.type === 'swim' ? w.duration : 0),
        bikeMinutes: acc.bikeMinutes + (w.type === 'bike' ? w.duration : 0),
        runMinutes: acc.runMinutes + (w.type === 'run' ? w.duration : 0),
        swimKm: acc.swimKm + (w.type === 'swim' ? (w.distance ?? 0) : 0),
        bikeKm: acc.bikeKm + (w.type === 'bike' ? (w.distance ?? 0) : 0),
        runKm: acc.runKm + (w.type === 'run' ? (w.distance ?? 0) : 0),
      }),
      {
        totalWorkouts: 0, totalMinutes: 0, totalKm: 0,
        swimMinutes: 0, bikeMinutes: 0, runMinutes: 0,
        swimKm: 0, bikeKm: 0, runKm: 0,
      }
    );
    setAllTimeStats(ats);

    // Weekly buckets — last 8 weeks
    const buckets: WeekBucket[] = [];
    for (let i = 7; i >= 0; i--) {
      const weekStart = startOfWeek(subWeeks(new Date(), i), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

      const weekWorkouts = workouts.filter(
        (w) => w.date >= weekStartStr && w.date <= weekEndStr
      );

      buckets.push({
        label: format(weekStart, 'M/d'),
        swimMins: weekWorkouts.filter((w) => w.type === 'swim').reduce((s, w) => s + w.duration, 0),
        bikeMins: weekWorkouts.filter((w) => w.type === 'bike').reduce((s, w) => s + w.duration, 0),
        runMins: weekWorkouts.filter((w) => w.type === 'run').reduce((s, w) => s + w.duration, 0),
        totalMins: weekWorkouts.reduce((s, w) => s + w.duration, 0),
        totalKm: weekWorkouts.reduce((s, w) => s + (w.distance ?? 0), 0),
      });
    }
    setWeeklyBuckets(buckets);
  }, [workouts]);

  const chartData = {
    labels: weeklyBuckets.map((b) => b.label),
    datasets: [
      {
        data: weeklyBuckets.map((b) => parseFloat((b.totalMins / 60).toFixed(1))),
        color: () => COLORS.primary,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: COLORS.surface,
    backgroundGradientFrom: COLORS.surface,
    backgroundGradientTo: COLORS.surface,
    decimalPlaces: 1,
    color: (opacity = 1) => `rgba(255, 107, 53, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(176, 190, 197, ${opacity})`,
    style: { borderRadius: BORDER_RADIUS.lg },
    barPercentage: 0.65,
    propsForBackgroundLines: { strokeDasharray: '', stroke: COLORS.border },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Statistics</Text>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={COLORS.primary} />
          </View>
        ) : workouts.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyTitle}>No data yet</Text>
            <Text style={styles.emptySubtitle}>Log some workouts to see your stats</Text>
          </View>
        ) : (
          <>
            {/* All-time summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Time</Text>
              <View style={styles.statsRow}>
                <StatCard
                  title="Workouts"
                  value={String(allTimeStats.totalWorkouts)}
                  icon="fitness-outline"
                  iconColor={COLORS.primary}
                />
                <StatCard
                  title="Total Time"
                  value={formatDuration(allTimeStats.totalMinutes)}
                  icon="time-outline"
                  iconColor={COLORS.info}
                />
                <StatCard
                  title="Distance"
                  value={`${allTimeStats.totalKm.toFixed(0)}km`}
                  icon="navigate-outline"
                  iconColor={COLORS.success}
                />
              </View>
            </View>

            {/* Weekly volume chart */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weekly Volume (hours)</Text>
              <View style={styles.chartCard}>
                <BarChart
                  data={chartData}
                  width={screenWidth - SPACING.lg * 2 - SPACING.md * 2}
                  height={200}
                  chartConfig={chartConfig}
                  style={styles.chart}
                  fromZero
                  showValuesOnTopOfBars
                  yAxisSuffix="h"
                  yAxisLabel=""
                />
              </View>
            </View>

            {/* Discipline breakdown */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>By Discipline</Text>
              <View style={styles.disciplineGrid}>
                {[
                  {
                    label: 'Swim',
                    color: COLORS.swim,
                    icon: 'water' as const,
                    minutes: allTimeStats.swimMinutes,
                    km: allTimeStats.swimKm,
                  },
                  {
                    label: 'Bike',
                    color: COLORS.bike,
                    icon: 'bicycle' as const,
                    minutes: allTimeStats.bikeMinutes,
                    km: allTimeStats.bikeKm,
                  },
                  {
                    label: 'Run',
                    color: COLORS.run,
                    icon: 'walk' as const,
                    minutes: allTimeStats.runMinutes,
                    km: allTimeStats.runKm,
                  },
                ].map((d) => {
                  const pct = allTimeStats.totalMinutes > 0
                    ? Math.round((d.minutes / allTimeStats.totalMinutes) * 100)
                    : 0;
                  return (
                    <View key={d.label} style={styles.disciplineCard}>
                      <View style={[styles.disciplineBar, { backgroundColor: `${d.color}22` }]}>
                        <View
                          style={[
                            styles.disciplineBarFill,
                            { width: `${pct}%`, backgroundColor: d.color },
                          ]}
                        />
                      </View>
                      <View style={styles.disciplineInfo}>
                        <Text style={[styles.disciplineLabel, { color: d.color }]}>{d.label}</Text>
                        <Text style={styles.disciplineTime}>{formatDuration(d.minutes)}</Text>
                        <Text style={styles.disciplineKm}>{d.km.toFixed(1)} km · {pct}%</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Recent weekly summary */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Last 4 Weeks Detail</Text>
              {weeklyBuckets.slice(-4).reverse().map((w, i) => (
                <View key={i} style={styles.weekRow}>
                  <Text style={styles.weekLabel}>{w.label}</Text>
                  <View style={styles.weekDisciplines}>
                    {w.swimMins > 0 && (
                      <View style={[styles.weekBadge, { backgroundColor: COLORS.swim + '33' }]}>
                        <Text style={[styles.weekBadgeText, { color: COLORS.swim }]}>
                          🏊 {formatDuration(w.swimMins)}
                        </Text>
                      </View>
                    )}
                    {w.bikeMins > 0 && (
                      <View style={[styles.weekBadge, { backgroundColor: COLORS.bike + '33' }]}>
                        <Text style={[styles.weekBadgeText, { color: COLORS.bike }]}>
                          🚴 {formatDuration(w.bikeMins)}
                        </Text>
                      </View>
                    )}
                    {w.runMins > 0 && (
                      <View style={[styles.weekBadge, { backgroundColor: COLORS.run + '33' }]}>
                        <Text style={[styles.weekBadgeText, { color: COLORS.run }]}>
                          🏃 {formatDuration(w.runMins)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.weekTotal}>{formatDuration(w.totalMins)}</Text>
                </View>
              ))}
            </View>

            <View style={{ height: SPACING.xxl }} />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  title: { fontSize: 28, fontWeight: '800', color: COLORS.text },
  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: SPACING.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  chartCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  chart: { borderRadius: BORDER_RADIUS.lg },
  // Discipline breakdown
  disciplineGrid: { gap: SPACING.sm },
  disciplineCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  disciplineBar: {
    width: 6,
    height: 50,
    borderRadius: 3,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  disciplineBarFill: { width: '100%', borderRadius: 3 },
  disciplineInfo: { flex: 1 },
  disciplineLabel: { fontSize: 13, fontWeight: '700' },
  disciplineTime: { fontSize: 18, fontWeight: '800', color: COLORS.text },
  disciplineKm: { fontSize: 12, color: COLORS.textMuted },
  // Weekly rows
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.divider,
    gap: SPACING.sm,
  },
  weekLabel: { fontSize: 13, color: COLORS.textSecondary, width: 40 },
  weekDisciplines: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  weekBadge: {
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  weekBadgeText: { fontSize: 11, fontWeight: '600' },
  weekTotal: { fontSize: 13, fontWeight: '700', color: COLORS.text },
});
