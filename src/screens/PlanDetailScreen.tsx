import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { PlanWorkout, WorkoutType, IntensityLevel } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { getDisciplineColor, getDisciplineIcon, getDisciplineLabel } from '../components/DisciplineIcon';
import type { PlansStackParamList } from '../navigation';

type PlanDetailRouteProp = RouteProp<PlansStackParamList, 'PlanDetail'>;

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const TYPES: WorkoutType[] = ['swim', 'bike', 'run', 'brick', 'rest'];
const INTENSITIES: IntensityLevel[] = ['easy', 'moderate', 'hard', 'race'];

function formatDuration(minutes?: number): string {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function WorkoutSlot({
  workout,
  onDelete,
}: {
  workout: PlanWorkout;
  onDelete: () => void;
}) {
  const color = getDisciplineColor(workout.type);
  const icon = getDisciplineIcon(workout.type);

  return (
    <View style={[styles.slot, { borderLeftColor: color }]}>
      <Ionicons name={icon} size={16} color={color} />
      <View style={styles.slotInfo}>
        <Text style={[styles.slotType, { color }]}>{getDisciplineLabel(workout.type)}</Text>
        <View style={styles.slotMeta}>
          {workout.duration && (
            <Text style={styles.slotMetaText}>{formatDuration(workout.duration)}</Text>
          )}
          {workout.distance && (
            <Text style={styles.slotMetaText}>{workout.distance} km</Text>
          )}
          {workout.intensity && (
            <Text style={[styles.intensityTag, { color }]}>{workout.intensity}</Text>
          )}
        </View>
        {workout.description && (
          <Text style={styles.slotDesc} numberOfLines={2}>{workout.description}</Text>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.slotDelete}>
        <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

function AddWorkoutModal({
  planId,
  weekNumber,
  dayOfWeek,
  onAdd,
  onClose,
}: {
  planId: string;
  weekNumber: number;
  dayOfWeek: number;
  onAdd: (workout: Omit<PlanWorkout, 'id'>) => Promise<void>;
  onClose: () => void;
}) {
  const [type, setType] = useState<WorkoutType>('run');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<IntensityLevel>('moderate');
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    setSaving(true);
    await onAdd({
      plan_id: planId,
      week_number: weekNumber,
      day_of_week: dayOfWeek,
      type,
      duration: duration ? parseInt(duration) : undefined,
      intensity,
    });
    setSaving(false);
    onClose();
  }

  return (
    <View style={styles.modal}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>
          Add Workout — {DAYS[dayOfWeek - 1]}, Week {weekNumber}
        </Text>

        <Text style={styles.label}>Type</Text>
        <View style={styles.typeRow}>
          {TYPES.map((t) => {
            const c = getDisciplineColor(t);
            const active = type === t;
            return (
              <TouchableOpacity
                key={t}
                style={[styles.typePill, active && { backgroundColor: `${c}33`, borderColor: c }]}
                onPress={() => setType(t)}
              >
                <Ionicons name={getDisciplineIcon(t)} size={16} color={active ? c : COLORS.textMuted} />
                <Text style={[styles.typePillText, active && { color: c }]}>
                  {getDisciplineLabel(t)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.label}>Duration (minutes)</Text>
        <View style={styles.quickDurations}>
          {['30', '45', '60', '90', '120'].map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.quickDuration, duration === d && styles.quickDurationActive]}
              onPress={() => setDuration(d)}
            >
              <Text style={[styles.quickDurationText, duration === d && styles.quickDurationTextActive]}>
                {d}m
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Intensity</Text>
        <View style={styles.intensityRow}>
          {INTENSITIES.map((i) => (
            <TouchableOpacity
              key={i}
              style={[styles.intensityPill, intensity === i && styles.intensityPillActive]}
              onPress={() => setIntensity(i)}
            >
              <Text style={[styles.intensityPillText, intensity === i && styles.intensityPillTextActive]}>
                {i}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addBtn, saving && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <Text style={styles.addBtnText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export function PlanDetailScreen() {
  const route = useRoute<PlanDetailRouteProp>();
  const { planId } = route.params;
  const { plans, loading, addPlanWorkout, deletePlanWorkout, setActivePlan, getCurrentWeek } =
    useTrainingPlans();

  const plan = plans.find((p) => p.id === planId);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [addingWorkout, setAddingWorkout] = useState<{ week: number; day: number } | null>(null);

  if (loading || !plan) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const currentWeek = plan.is_active ? getCurrentWeek() : 0;

  const weekWorkouts = (plan.plan_workouts ?? []).filter(
    (w) => w.week_number === selectedWeek
  );

  function getWorkoutsForDay(day: number): PlanWorkout[] {
    return weekWorkouts.filter((w) => w.day_of_week === day);
  }

  async function handleDeleteWorkout(id: string) {
    Alert.alert('Remove Workout', 'Remove this workout from the plan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => deletePlanWorkout(id),
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Week selector */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekSelector}
        contentContainerStyle={styles.weekSelectorContent}
      >
        {Array.from({ length: plan.duration_weeks }, (_, i) => i + 1).map((w) => (
          <TouchableOpacity
            key={w}
            style={[
              styles.weekTab,
              selectedWeek === w && styles.weekTabActive,
              currentWeek === w && styles.weekTabCurrent,
            ]}
            onPress={() => setSelectedWeek(w)}
          >
            <Text
              style={[
                styles.weekTabText,
                selectedWeek === w && styles.weekTabTextActive,
              ]}
            >
              Wk {w}
            </Text>
            {currentWeek === w && <View style={styles.currentDot} />}
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Plan active status */}
      {!plan.is_active && (
        <TouchableOpacity
          style={styles.activateBanner}
          onPress={() => setActivePlan(plan.id)}
        >
          <Ionicons name="play-circle-outline" size={18} color={COLORS.primary} />
          <Text style={styles.activateBannerText}>Tap to set as active plan</Text>
        </TouchableOpacity>
      )}

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {DAYS.map((dayLabel, idx) => {
          const dayNum = idx + 1;
          const dayWorkouts = getWorkoutsForDay(dayNum);
          const isToday =
            plan.is_active &&
            currentWeek === selectedWeek &&
            (new Date().getDay() === 0 ? 7 : new Date().getDay()) === dayNum;

          return (
            <View key={dayNum} style={[styles.daySection, isToday && styles.daySectionToday]}>
              <View style={styles.dayHeader}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {dayLabel}
                  {isToday ? ' (Today)' : ''}
                </Text>
                <TouchableOpacity
                  style={styles.addWorkoutBtn}
                  onPress={() => setAddingWorkout({ week: selectedWeek, day: dayNum })}
                >
                  <Ionicons name="add" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
              {dayWorkouts.length === 0 ? (
                <Text style={styles.restDay}>Rest</Text>
              ) : (
                dayWorkouts.map((w) => (
                  <WorkoutSlot
                    key={w.id}
                    workout={w}
                    onDelete={() => handleDeleteWorkout(w.id)}
                  />
                ))
              )}
            </View>
          );
        })}
        <View style={{ height: SPACING.xl }} />
      </ScrollView>

      {addingWorkout && (
        <AddWorkoutModal
          planId={planId}
          weekNumber={addingWorkout.week}
          dayOfWeek={addingWorkout.day}
          onAdd={addPlanWorkout}
          onClose={() => setAddingWorkout(null)}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  weekSelector: { borderBottomWidth: 1, borderBottomColor: COLORS.border, maxHeight: 56 },
  weekSelectorContent: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, gap: SPACING.xs },
  weekTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    minWidth: 52,
  },
  weekTabActive: { backgroundColor: COLORS.primary },
  weekTabCurrent: { borderWidth: 1.5, borderColor: COLORS.primary },
  weekTabText: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  weekTabTextActive: { color: COLORS.white },
  currentDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.primary,
    marginTop: 2,
  },
  activateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    backgroundColor: `${COLORS.primary}11`,
    borderBottomWidth: 1,
    borderBottomColor: `${COLORS.primary}44`,
  },
  activateBannerText: { fontSize: 13, color: COLORS.primary, fontWeight: '500' },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  daySection: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  daySectionToday: { borderColor: COLORS.primary + '88' },
  dayHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  dayLabel: { fontSize: 14, fontWeight: '700', color: COLORS.text },
  dayLabelToday: { color: COLORS.primary },
  addWorkoutBtn: { padding: 4 },
  restDay: { fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
  // Slot
  slot: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderLeftWidth: 3,
    paddingLeft: SPACING.sm,
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  slotInfo: { flex: 1 },
  slotType: { fontSize: 13, fontWeight: '700' },
  slotMeta: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  slotMetaText: { fontSize: 12, color: COLORS.textSecondary },
  intensityTag: { fontSize: 11, fontWeight: '600' },
  slotDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  slotDelete: { padding: 2 },
  // Add workout modal
  modal: {
    position: 'absolute',
    inset: 0,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  label: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.md },
  typePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  typePillText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  quickDurations: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.md },
  quickDuration: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  quickDurationActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  quickDurationText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  quickDurationTextActive: { color: COLORS.white },
  intensityRow: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.lg },
  intensityPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  intensityPillActive: { backgroundColor: COLORS.primary + '33', borderColor: COLORS.primary },
  intensityPillText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '600' },
  intensityPillTextActive: { color: COLORS.primary },
  modalActions: { flexDirection: 'row', gap: SPACING.sm },
  cancelBtn: {
    flex: 1,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  addBtn: {
    flex: 2,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  addBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
