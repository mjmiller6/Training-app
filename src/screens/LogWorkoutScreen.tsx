import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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

const WORKOUT_TYPES: WorkoutType[] = ['swim', 'bike', 'run', 'brick'];

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
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Pre-fill if editing
  useEffect(() => {
    if (workoutId) {
      const existing = workouts.find((w) => w.id === workoutId);
      if (existing) {
        setType(existing.type);
        setDate(existing.date);
        setDurationHours(String(Math.floor(existing.duration / 60)));
        setDurationMins(String(existing.duration % 60));
        setDistance(existing.distance != null ? String(existing.distance) : '');
        setHeartRate(existing.avg_heart_rate != null ? String(existing.avg_heart_rate) : '');
        setCalories(existing.calories != null ? String(existing.calories) : '');
        setNotes(existing.notes ?? '');
      }
    }
  }, [workoutId, workouts]);

  async function handleSave() {
    const totalMinutes =
      (parseInt(durationHours || '0') * 60) + parseInt(durationMins || '0');

    if (totalMinutes <= 0) {
      Alert.alert('Invalid Duration', 'Please enter a valid workout duration.');
      return;
    }

    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Please enter date as YYYY-MM-DD.');
      return;
    }

    setSaving(true);

    const payload = {
      type,
      date,
      duration: totalMinutes,
      distance: distance ? parseFloat(distance) : undefined,
      avg_heart_rate: heartRate ? parseInt(heartRate) : undefined,
      calories: calories ? parseInt(calories) : undefined,
      notes: notes || undefined,
    };

    if (workoutId) {
      const { error } = await updateWorkout(workoutId, payload);
      if (error) {
        Alert.alert('Error', error);
      } else {
        navigation.goBack();
      }
    } else {
      const { error } = await createWorkout(payload);
      if (error) {
        Alert.alert('Error', error);
      } else {
        navigation.goBack();
      }
    }

    setSaving(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Workout Type Selector */}
          <View style={styles.section}>
            <Text style={styles.label}>Discipline</Text>
            <View style={styles.typeRow}>
              {WORKOUT_TYPES.map((t) => {
                const color = getDisciplineColor(t);
                const icon = getDisciplineIcon(t);
                const active = type === t;
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeButton,
                      active && { backgroundColor: `${color}33`, borderColor: color },
                    ]}
                    onPress={() => setType(t)}
                  >
                    <Ionicons
                      name={icon}
                      size={22}
                      color={active ? color : COLORS.textMuted}
                    />
                    <Text style={[styles.typeLabel, active && { color }]}>
                      {getDisciplineLabel(t)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Date</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={date}
                onChangeText={setDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  value={durationHours}
                  onChangeText={setDurationHours}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.durationUnit}>hrs</Text>
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  value={durationMins}
                  onChangeText={setDurationMins}
                  placeholder="30"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.durationUnit}>min</Text>
              </View>
            </View>
          </View>

          {/* Distance */}
          <View style={styles.section}>
            <Text style={styles.label}>Distance (km) <Text style={styles.optional}>optional</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="navigate-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={distance}
                onChangeText={setDistance}
                placeholder="0.0"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="decimal-pad"
              />
              <Text style={styles.durationUnit}>km</Text>
            </View>
          </View>

          {/* Heart Rate & Calories */}
          <View style={styles.rowSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Avg HR <Text style={styles.optional}>optional</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="heart-outline" size={18} color={COLORS.error} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={heartRate}
                  onChangeText={setHeartRate}
                  placeholder="bpm"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Calories <Text style={styles.optional}>optional</Text></Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="flame-outline" size={18} color={COLORS.warning} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="kcal"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes <Text style={styles.optional}>optional</Text></Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How did it feel? Any details to remember..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.saveButtonText}>
                  {workoutId ? 'Update Workout' : 'Save Workout'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  section: { marginBottom: SPACING.lg },
  rowSection: { flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  optional: { fontWeight: '400', color: COLORS.textMuted, fontSize: 12 },
  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.xs,
  },
  typeLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textMuted },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: SPACING.md, color: COLORS.text, fontSize: 15 },
  durationRow: { flexDirection: 'row', gap: SPACING.sm },
  durationUnit: { fontSize: 13, color: COLORS.textMuted, marginLeft: 4 },
  textAreaWrapper: { alignItems: 'flex-start', paddingVertical: SPACING.sm },
  textArea: { minHeight: 80, paddingVertical: SPACING.xs },
  saveButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
