import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useWorkouts } from '../hooks/useWorkouts';
import { WorkoutType } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { getDisciplineColor, getDisciplineIcon, getDisciplineLabel } from '../components/DisciplineIcon';
import type { LogStackParamList } from '../navigation';

type LogWorkoutRouteProp = RouteProp<LogStackParamList, 'LogWorkout'>;

const WORKOUT_TYPES: WorkoutType[] = ['swim', 'bike', 'run', 'brick', 'strength'];

const RPE_LABELS: Record<number, { label: string; emoji: string; color: string }> = {
  1:  { label: 'Very Easy',  emoji: '😴', color: '#4CAF50' },
  2:  { label: 'Very Easy',  emoji: '😴', color: '#4CAF50' },
  3:  { label: 'Easy',       emoji: '😊', color: '#8BC34A' },
  4:  { label: 'Easy',       emoji: '😊', color: '#8BC34A' },
  5:  { label: 'Moderate',   emoji: '😤', color: '#FFC107' },
  6:  { label: 'Moderate',   emoji: '😤', color: '#FFC107' },
  7:  { label: 'Hard',       emoji: '😓', color: '#FF9800' },
  8:  { label: 'Hard',       emoji: '😓', color: '#FF9800' },
  9:  { label: 'Very Hard',  emoji: '🤯', color: '#F44336' },
  10: { label: 'Max Effort', emoji: '💀', color: '#B71C1C' },
};

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function LogWorkoutScreen() {
  const navigation = useNavigation();
  const route = useRoute<LogWorkoutRouteProp>();
  const { workoutId } = route.params ?? {};
  const { workouts, createWorkout, updateWorkout } = useWorkouts();

  const [type, setType] = useState<WorkoutType>('run');
  const [date, setDate] = useState(todayStr());
  const [durationHours, setDurationHours] = useState('0');
  const [durationMins, setDurationMins] = useState('30');
  const [distance, setDistance] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [calories, setCalories] = useState('');
  const [rpe, setRpe] = useState<number>(5);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (workoutId) {
      const existing = workouts.find(w => w.id === workoutId);
      if (existing) {
        setType(existing.type);
        setDate(existing.date);
        setDurationHours(String(Math.floor(existing.duration / 60)));
        setDurationMins(String(existing.duration % 60));
        setDistance(existing.distance != null ? String(existing.distance) : '');
        setHeartRate(existing.avg_heart_rate != null ? String(existing.avg_heart_rate) : '');
        setCalories(existing.calories != null ? String(existing.calories) : '');
        setRpe(existing.rpe ?? 5);
        setNotes(existing.notes ?? '');
      }
    }
  }, [workoutId, workouts]);

  async function handleSave() {
    const totalMinutes = (parseInt(durationHours || '0') * 60) + parseInt(durationMins || '0');
    if (totalMinutes <= 0) { Alert.alert('Invalid Duration', 'Please enter a valid duration.'); return; }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Invalid Date', 'Use YYYY-MM-DD format.'); return; }

    setSaving(true);

    const payload = {
      type,
      date,
      duration: totalMinutes,
      distance: distance ? parseFloat(distance) : undefined,
      avg_heart_rate: heartRate ? parseInt(heartRate) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      rpe,
      notes: notes || undefined,
    };

    const { error } = workoutId
      ? await updateWorkout(workoutId, payload)
      : await createWorkout(payload);

    if (error) Alert.alert('Error', error);
    else navigation.goBack();

    setSaving(false);
  }

  const rpeInfo = RPE_LABELS[rpe];

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Discipline */}
          <Text style={styles.label}>Discipline</Text>
          <View style={styles.typeRow}>
            {WORKOUT_TYPES.map(t => {
              const color = getDisciplineColor(t);
              const active = type === t;
              return (
                <TouchableOpacity
                  key={t}
                  style={[styles.typeButton, active && { backgroundColor: `${color}33`, borderColor: color }]}
                  onPress={() => setType(t)}
                >
                  <Ionicons name={getDisciplineIcon(t)} size={22} color={active ? color : COLORS.textMuted} />
                  <Text style={[styles.typeLabel, active && { color }]}>{getDisciplineLabel(t)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Date */}
          <Text style={styles.label}>Date</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input} value={date} onChangeText={setDate}
              placeholder="YYYY-MM-DD" placeholderTextColor={COLORS.textMuted}
              keyboardType="numbers-and-punctuation"
            />
          </View>

          {/* Duration */}
          <Text style={styles.label}>Duration</Text>
          <View style={styles.durationRow}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <TextInput style={styles.input} value={durationHours} onChangeText={setDurationHours}
                placeholder="0" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />
              <Text style={styles.unit}>hrs</Text>
            </View>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <TextInput style={styles.input} value={durationMins} onChangeText={setDurationMins}
                placeholder="30" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />
              <Text style={styles.unit}>min</Text>
            </View>
          </View>

          {/* Distance */}
          <Text style={styles.label}>Distance <Text style={styles.optional}>optional</Text></Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="navigate-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
            <TextInput style={styles.input} value={distance} onChangeText={setDistance}
              placeholder="0.0" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />
            <Text style={styles.unit}>km</Text>
          </View>

          {/* HR & Calories */}
          <View style={styles.rowSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Avg HR <Text style={styles.optional}>optional</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="heart-outline" size={18} color={COLORS.error} style={styles.inputIcon} />
                <TextInput style={styles.input} value={heartRate} onChangeText={setHeartRate}
                  placeholder="bpm" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Calories <Text style={styles.optional}>optional</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="flame-outline" size={18} color={COLORS.warning} style={styles.inputIcon} />
                <TextInput style={styles.input} value={calories} onChangeText={setCalories}
                  placeholder="kcal" placeholderTextColor={COLORS.textMuted} keyboardType="number-pad" />
              </View>
            </View>
          </View>

          {/* RPE */}
          <Text style={styles.label}>How Hard Was It? (RPE)</Text>
          <View style={styles.rpeCard}>
            <View style={styles.rpeHeader}>
              <Text style={styles.rpeEmoji}>{rpeInfo.emoji}</Text>
              <View>
                <Text style={[styles.rpeValue, { color: rpeInfo.color }]}>{rpe}/10</Text>
                <Text style={styles.rpeLabel}>{rpeInfo.label}</Text>
              </View>
            </View>
            <View style={styles.rpeScale}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map(n => {
                const info = RPE_LABELS[n];
                const active = rpe === n;
                return (
                  <TouchableOpacity
                    key={n}
                    style={[styles.rpeButton, active && { backgroundColor: info.color }]}
                    onPress={() => setRpe(n)}
                  >
                    <Text style={[styles.rpeButtonText, active && { color: COLORS.white }]}>{n}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={styles.rpeHints}>
              <Text style={styles.rpeHint}>1 Easy</Text>
              <Text style={styles.rpeHint}>5 Moderate</Text>
              <Text style={styles.rpeHint}>10 Max</Text>
            </View>
          </View>

          {/* Notes */}
          <Text style={styles.label}>Notes <Text style={styles.optional}>optional</Text></Text>
          <View style={[styles.inputWrapper, { alignItems: 'flex-start', paddingVertical: SPACING.sm }]}>
            <TextInput
              style={[styles.input, { minHeight: 80 }]}
              value={notes} onChangeText={setNotes}
              placeholder="How did it feel? Key observations..."
              placeholderTextColor={COLORS.textMuted}
              multiline numberOfLines={4} textAlignVertical="top"
            />
          </View>

          {/* Save */}
          <TouchableOpacity
            style={[styles.saveButton, saving && { opacity: 0.6 }]}
            onPress={handleSave} disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.white} />
              : <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                  <Text style={styles.saveButtonText}>{workoutId ? 'Update Workout' : 'Save Workout'}</Text>
                </>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  optional: { fontWeight: '400', color: COLORS.textMuted, fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.lg },
  typeButton: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border, gap: SPACING.xs,
  },
  typeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border,
    paddingHorizontal: SPACING.md, marginBottom: SPACING.lg,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: SPACING.md, color: COLORS.text, fontSize: 15 },
  unit: { fontSize: 13, color: COLORS.textMuted, marginLeft: 4 },
  durationRow: { flexDirection: 'row', gap: SPACING.sm },
  rowSection: { flexDirection: 'row', gap: SPACING.md },
  // RPE
  rpeCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.lg,
    borderWidth: 1, borderColor: COLORS.border,
  },
  rpeHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.md },
  rpeEmoji: { fontSize: 36 },
  rpeValue: { fontSize: 28, fontWeight: '800' },
  rpeLabel: { fontSize: 13, color: COLORS.textSecondary },
  rpeScale: { flexDirection: 'row', gap: SPACING.xs, marginBottom: SPACING.xs },
  rpeButton: {
    flex: 1, aspectRatio: 1, borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceElevated,
    alignItems: 'center', justifyContent: 'center',
  },
  rpeButtonText: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  rpeHints: { flexDirection: 'row', justifyContent: 'space-between' },
  rpeHint: { fontSize: 10, color: COLORS.textMuted },
  saveButton: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, marginTop: SPACING.md,
  },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
