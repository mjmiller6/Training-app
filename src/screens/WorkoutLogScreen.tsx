import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutCard } from '../components/WorkoutCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { WorkoutType } from '../types';

const FILTERS: { label: string; value: WorkoutType | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Swim', value: 'swim' },
  { label: 'Bike', value: 'bike' },
  { label: 'Run', value: 'run' },
  { label: 'Brick', value: 'brick' },
];

export function WorkoutLogScreen() {
  const navigation = useNavigation<any>();
  const [activeFilter, setActiveFilter] = useState<WorkoutType | 'all'>('all');
  const { workouts, loading, refetch, deleteWorkout } = useWorkouts();

  const filtered =
    activeFilter === 'all' ? workouts : workouts.filter((w) => w.type === activeFilter);

  async function handleDelete(id: string) {
    await deleteWorkout(id);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterTab, activeFilter === f.value && styles.filterTabActive]}
            onPress={() => setActiveFilter(f.value)}
          >
            <Text
              style={[
                styles.filterTabText,
                activeFilter === f.value && styles.filterTabTextActive,
              ]}
            >
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="clipboard-outline" size={56} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No workouts logged</Text>
          <Text style={styles.emptySubtitle}>Tap + to log your first workout</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <WorkoutCard
              workout={item}
              onPress={() => navigation.navigate('LogWorkout', { workoutId: item.id })}
              onDelete={handleDelete}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('LogWorkout', {})}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  filterTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  filterTabTextActive: { color: COLORS.white, fontWeight: '700' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary },
  fab: {
    position: 'absolute',
    right: SPACING.lg,
    bottom: SPACING.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
