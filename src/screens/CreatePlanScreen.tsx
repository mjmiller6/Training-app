import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../lib/supabase';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { generatePlanWorkouts } from '../utils/planGenerator';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { WorkoutType, RaceType, PlanType, DaySchedule } from '../types';
import { getDisciplineColor, getDisciplineIcon } from '../components/DisciplineIcon';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const RACE_TEMPLATES: { id: RaceType; label: string; emoji: string; weeks: number; desc: string }[] = [
  { id: 'sprint',        label: 'Sprint',      emoji: '🌱', weeks: 8,  desc: '750m / 20km / 5km · Beginner friendly' },
  { id: 'olympic',       label: 'Olympic',     emoji: '🏅', weeks: 12, desc: '1.5km / 40km / 10km · Classic distance' },
  { id: 'half-ironman',  label: '70.3',        emoji: '💪', weeks: 20, desc: '1.9km / 90km / 21km · Half Ironman' },
  { id: 'ironman',       label: 'Ironman',     emoji: '🏆', weeks: 24, desc: '3.8km / 180km / 42km · Full distance' },
];

const DAY_TYPES: { value: WorkoutType | 'rest'; label: string; color: string }[] = [
  { value: 'rest',             label: 'Rest',   color: COLORS.textMuted },
  { value: 'swim',             label: '🏊 Swim', color: COLORS.swim },
  { value: 'bike',             label: '🚴 Bike', color: COLORS.bike },
  { value: 'run',              label: '🏃 Run',  color: COLORS.run },
  { value: 'double-threshold', label: '⚡ DT',   color: COLORS.brick },
];

const STEP_TITLES = ['Race & Type', 'Weekly Schedule', 'Confirm'];

export function CreatePlanScreen() {
  const navigation = useNavigation<any>();
  const { createPlan, setActivePlan } = useTrainingPlans();

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [raceType, setRaceType] = useState<RaceType>('olympic');
  const [planType, setPlanType] = useState<PlanType>('standard');
  const [name, setName] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [makeActive, setMakeActive] = useState(true);

  // Step 2 — weekly schedule: each day has an array of sessions
  const [schedule, setSchedule] = useState<WorkoutType[][]>([
    ['swim'],           // Mon
    ['run'],            // Tue
    ['double-threshold'], // Wed
    ['bike'],           // Thu
    [],                 // Fri - rest
    ['bike'],           // Sat
    ['run'],            // Sun
  ]);

  function addSession(dayIndex: number, type: WorkoutType) {
    setSchedule(prev => {
      const s = prev.map(d => [...d]);
      if (!s[dayIndex].includes(type)) s[dayIndex].push(type);
      return s;
    });
  }

  function removeSession(dayIndex: number, type: WorkoutType) {
    setSchedule(prev => {
      const s = prev.map(d => [...d]);
      s[dayIndex] = s[dayIndex].filter(t => t !== type);
      return s;
    });
  }

  function selectTemplate(t: typeof RACE_TEMPLATES[0]) {
    setRaceType(t.id);
    setDurationWeeks(t.weeks);
    if (!name) setName(`${t.label} Triathlon Plan`);
  }

  async function handleCreate() {
    if (!name.trim()) { Alert.alert('Required', 'Please enter a plan name.'); return; }
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) { Alert.alert('Invalid Date', 'Use YYYY-MM-DD format.'); return; }

    setSaving(true);

    const weeklyTemplate: DaySchedule[] = schedule.map((sessions, i) => ({
      dayOfWeek: i + 1,
      sessions: sessions.map(type => ({
        type,
        sessionFocus: type === 'double-threshold' ? 'swim' : undefined,
      })),
    }));

    const { data: planData, error: planError } = await createPlan({
      name: name.trim(),
      description: `${planType === 'masters' ? 'Masters ' : ''}${RACE_TEMPLATES.find(r => r.id === raceType)?.label ?? raceType} plan`,
      duration_weeks: durationWeeks,
      start_date: startDate,
      is_active: makeActive,
      plan_type: planType,
      race_type: raceType,
      weekly_template: weeklyTemplate,
    });

    if (planError || !planData) {
      Alert.alert('Error', planError ?? 'Could not create plan');
      setSaving(false);
      return;
    }

    // Generate and insert all plan workouts
    const generatedWorkouts = generatePlanWorkouts(
      planData.id, durationWeeks, weeklyTemplate, planType, raceType
    );

    // Insert in batches of 50
    for (let i = 0; i < generatedWorkouts.length; i += 50) {
      const batch = generatedWorkouts.slice(i, i + 50);
      const { error } = await supabase.from('plan_workouts').insert(batch);
      if (error) { Alert.alert('Error generating workouts', error.message); setSaving(false); return; }
    }

    if (makeActive) await setActivePlan(planData.id);

    setSaving(false);
    navigation.replace('PlanDetail', { planId: planData.id, planName: planData.name });
  }

  // ── Step renderers ─────────────────────────────────────────────────────────

  function renderStep1() {
    return (
      <>
        <Text style={styles.stepLabel}>Choose Race Distance</Text>
        {RACE_TEMPLATES.map(t => (
          <TouchableOpacity
            key={t.id}
            style={[styles.templateCard, raceType === t.id && styles.templateCardActive]}
            onPress={() => selectTemplate(t)}
          >
            <Text style={styles.templateEmoji}>{t.emoji}</Text>
            <View style={styles.templateInfo}>
              <Text style={styles.templateName}>{t.label}</Text>
              <Text style={styles.templateDesc}>{t.desc}</Text>
              <Text style={styles.templateWeeks}>{t.weeks} weeks</Text>
            </View>
            {raceType === t.id && <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />}
          </TouchableOpacity>
        ))}

        <Text style={[styles.stepLabel, { marginTop: SPACING.lg }]}>Athlete Type</Text>
        <View style={styles.planTypeRow}>
          {(['standard', 'masters'] as PlanType[]).map(pt => (
            <TouchableOpacity
              key={pt}
              style={[styles.planTypeCard, planType === pt && styles.planTypeCardActive]}
              onPress={() => setPlanType(pt)}
            >
              <Text style={styles.planTypeEmoji}>{pt === 'standard' ? '⚡' : '🧘'}</Text>
              <Text style={[styles.planTypeLabel, planType === pt && { color: COLORS.primary }]}>
                {pt === 'standard' ? 'Standard' : 'Masters (40+)'}
              </Text>
              <Text style={styles.planTypeDesc}>
                {pt === 'standard' ? '3-week build, 1-week recovery' : '2-week build, 1-week recovery\nMore aerobic, less intensity'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.stepLabel, { marginTop: SPACING.lg }]}>Plan Name</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="My Triathlon Plan"
            placeholderTextColor={COLORS.textMuted}
          />
        </View>

        <View style={styles.rowSection}>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepLabel}>Duration</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={String(durationWeeks)}
                onChangeText={v => setDurationWeeks(parseInt(v) || durationWeeks)}
                keyboardType="number-pad"
                placeholderTextColor={COLORS.textMuted}
              />
              <Text style={styles.unit}>wks</Text>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stepLabel}>Start Date</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={startDate}
                onChangeText={setStartDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={COLORS.textMuted}
                keyboardType="numbers-and-punctuation"
              />
            </View>
          </View>
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Set as Active Plan</Text>
          <Switch value={makeActive} onValueChange={setMakeActive}
            trackColor={{ false: COLORS.border, true: COLORS.primary }}
            thumbColor={COLORS.white}
          />
        </View>
      </>
    );
  }

  function renderStep2() {
    const SESSION_TYPES: { value: WorkoutType; label: string; color: string }[] = [
      { value: 'swim',             label: '🏊 Swim',     color: COLORS.swim },
      { value: 'bike',             label: '🚴 Bike',     color: COLORS.bike },
      { value: 'run',              label: '🏃 Run',      color: COLORS.run },
      { value: 'strength',         label: '🏋️ S&C',      color: '#E91E63' },
      { value: 'double-threshold', label: '⚡ DT',       color: COLORS.brick },
    ];

    return (
      <>
        <Text style={styles.stepLabel}>Set Your Weekly Training Schedule</Text>
        <Text style={styles.stepSubLabel}>
          Tap a session type to add it to a day. Tap a tag to remove it. You can stack multiple sessions per day.
        </Text>

        {DAYS.map((day, i) => {
          const daySessions = schedule[i];
          const isRest = daySessions.length === 0;

          return (
            <View key={day} style={styles.dayCard}>
              <View style={styles.dayCardHeader}>
                <Text style={styles.dayName}>{day}</Text>
                {isRest && <Text style={styles.restLabel}>Rest</Text>}
              </View>

              {/* Active sessions — tap to remove */}
              {daySessions.length > 0 && (
                <View style={styles.activeSessions}>
                  {daySessions.map(type => {
                    const dt = SESSION_TYPES.find(s => s.value === type);
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[styles.activeChip, { backgroundColor: `${dt?.color}33`, borderColor: dt?.color }]}
                        onPress={() => removeSession(i, type)}
                      >
                        <Text style={[styles.activeChipText, { color: dt?.color }]}>{dt?.label}</Text>
                        <Text style={[styles.activeChipRemove, { color: dt?.color }]}>✕</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}

              {/* Add session buttons */}
              <View style={styles.addSessionRow}>
                {SESSION_TYPES.filter(s => !daySessions.includes(s.value)).map(s => (
                  <TouchableOpacity
                    key={s.value}
                    style={styles.addChip}
                    onPress={() => addSession(i, s.value)}
                  >
                    <Text style={styles.addChipText}>+ {s.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

        <View style={styles.dtInfoBox}>
          <Text style={styles.dtInfoTitle}>⚡ Double Threshold (DT)</Text>
          <Text style={styles.dtInfoText}>
            Norwegian method: AM swim/bike threshold + PM run threshold. Can be combined with other sessions.
          </Text>
        </View>
      </>
    );
  }

  function renderStep3() {
    const sessionCount = schedule.reduce((sum, day) => sum + day.length, 0);
    const dtCount = schedule.reduce((sum, day) => sum + day.filter(t => t === 'double-threshold').length, 0);
    const template = RACE_TEMPLATES.find(r => r.id === raceType);

    return (
      <>
        <Text style={styles.stepLabel}>Plan Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Name</Text><Text style={styles.summaryVal}>{name}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Race</Text><Text style={styles.summaryVal}>{template?.label}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Type</Text><Text style={styles.summaryVal}>{planType === 'masters' ? 'Masters (40+)' : 'Standard'}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Duration</Text><Text style={styles.summaryVal}>{durationWeeks} weeks</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Start</Text><Text style={styles.summaryVal}>{startDate}</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Sessions/week</Text><Text style={styles.summaryVal}>{sessionCount + dtCount} ({dtCount > 0 ? `${dtCount} DT days` : 'no DT'})</Text></View>
          <View style={styles.summaryRow}><Text style={styles.summaryKey}>Total workouts</Text><Text style={styles.summaryVal}>~{(sessionCount + dtCount) * durationWeeks}</Text></View>
        </View>

        <Text style={[styles.stepLabel, { marginTop: SPACING.lg }]}>Weekly Schedule</Text>
        {DAYS.map((day, i) => {
          const sessions = schedule[i];
          const SESSION_COLORS: Record<string, string> = {
            swim: COLORS.swim, bike: COLORS.bike, run: COLORS.run, 'double-threshold': COLORS.brick,
          };
          const SESSION_LABELS: Record<string, string> = {
            swim: '🏊 Swim', bike: '🚴 Bike', run: '🏃 Run', 'double-threshold': '⚡ DT',
          };
          return (
            <View key={day} style={styles.summaryDayRow}>
              <Text style={styles.summaryDayName}>{day}</Text>
              <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>
                {sessions.length === 0
                  ? <Text style={styles.summaryDayType}>Rest</Text>
                  : sessions.map(t => (
                      <Text key={t} style={[styles.summaryDayType, { color: SESSION_COLORS[t] }]}>
                        {SESSION_LABELS[t]}
                      </Text>
                    ))
                }
              </View>
            </View>
          );
        })}

        <View style={styles.adaptiveInfoBox}>
          <Ionicons name="pulse" size={18} color={COLORS.primary} />
          <Text style={styles.adaptiveInfoText}>
            Adaptive training enabled — after logging workouts with RPE scores, the app will suggest load adjustments each week.
          </Text>
        </View>
      </>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Progress bar */}
      <View style={styles.progressBar}>
        {STEP_TITLES.map((title, i) => (
          <View key={i} style={styles.progressStep}>
            <View style={[styles.progressDot, i <= step && styles.progressDotActive]}>
              {i < step
                ? <Ionicons name="checkmark" size={12} color={COLORS.white} />
                : <Text style={styles.progressDotText}>{i + 1}</Text>
              }
            </View>
            <Text style={[styles.progressTitle, i === step && styles.progressTitleActive]}>{title}</Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {step === 0 && renderStep1()}
          {step === 1 && renderStep2()}
          {step === 2 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Navigation buttons */}
      <View style={styles.navButtons}>
        {step > 0 && (
          <TouchableOpacity style={styles.backBtn} onPress={() => setStep(s => s - 1)}>
            <Text style={styles.backBtnText}>← Back</Text>
          </TouchableOpacity>
        )}
        {step < 2 ? (
          <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(s => s + 1)}>
            <Text style={styles.nextBtnText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.nextBtn, saving && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving
              ? <ActivityIndicator color={COLORS.white} />
              : <Text style={styles.nextBtnText}>Generate Plan ✓</Text>
            }
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    gap: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressStep: { alignItems: 'center', gap: 4 },
  progressDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 2, borderColor: COLORS.border,
    alignItems: 'center', justifyContent: 'center',
  },
  progressDotActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  progressDotText: { fontSize: 11, color: COLORS.textMuted, fontWeight: '700' },
  progressTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: '500' },
  progressTitleActive: { color: COLORS.primary, fontWeight: '700' },
  scroll: { padding: SPACING.lg, paddingBottom: 100 },
  stepLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: SPACING.sm },
  stepSubLabel: { fontSize: 13, color: COLORS.textMuted, marginBottom: SPACING.md, marginTop: -SPACING.xs },
  // Templates
  templateCard: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  templateCardActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}11` },
  templateEmoji: { fontSize: 24 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 15, fontWeight: '700', color: COLORS.text },
  templateDesc: { fontSize: 12, color: COLORS.textSecondary },
  templateWeeks: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  // Plan type
  planTypeRow: { flexDirection: 'row', gap: SPACING.sm },
  planTypeCard: {
    flex: 1, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, borderWidth: 1.5, borderColor: COLORS.border,
  },
  planTypeCardActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}11` },
  planTypeEmoji: { fontSize: 24, marginBottom: SPACING.xs },
  planTypeLabel: { fontSize: 13, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  planTypeDesc: { fontSize: 11, color: COLORS.textMuted },
  // Inputs
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  input: { flex: 1, paddingVertical: SPACING.md, color: COLORS.text, fontSize: 15 },
  unit: { fontSize: 13, color: COLORS.textMuted },
  rowSection: { flexDirection: 'row', gap: SPACING.sm },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.md,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  // Schedule
  dayRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  dayName: { width: 36, fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  dayTypes: { flexDirection: 'row', gap: SPACING.xs },
  dayTypeChip: {
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surface,
    borderWidth: 1.5, borderColor: COLORS.border,
  },
  dayTypeText: { fontSize: 12, color: COLORS.textMuted, fontWeight: '500' },
  // Multi-session day builder
  dayCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
  },
  dayCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.xs },
  restLabel: { fontSize: 12, color: COLORS.textMuted, fontStyle: 'italic' },
  activeSessions: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: SPACING.sm },
  activeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full, borderWidth: 1.5,
  },
  activeChipText: { fontSize: 12, fontWeight: '700' },
  activeChipRemove: { fontSize: 11, fontWeight: '700' },
  addSessionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.xs },
  addChip: {
    paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1, borderColor: COLORS.border,
  },
  addChipText: { fontSize: 11, color: COLORS.textMuted },
  dtInfoBox: {
    backgroundColor: `${COLORS.brick}11`, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.md,
    borderWidth: 1, borderColor: `${COLORS.brick}44`,
  },
  dtInfoTitle: { fontSize: 13, fontWeight: '700', color: COLORS.brick, marginBottom: 4 },
  dtInfoText: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  // Summary
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginBottom: SPACING.sm,
  },
  summaryRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.xs, borderBottomWidth: 1, borderBottomColor: COLORS.divider,
  },
  summaryKey: { fontSize: 13, color: COLORS.textSecondary },
  summaryVal: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  summaryDayRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md,
  },
  summaryDayName: { fontSize: 13, color: COLORS.textSecondary },
  summaryDayType: { fontSize: 13, fontWeight: '600' },
  adaptiveInfoBox: {
    flexDirection: 'row', gap: SPACING.sm, alignItems: 'flex-start',
    backgroundColor: `${COLORS.primary}11`, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.lg,
    borderWidth: 1, borderColor: `${COLORS.primary}33`,
  },
  adaptiveInfoText: { flex: 1, fontSize: 12, color: COLORS.textSecondary, lineHeight: 18 },
  // Nav buttons
  navButtons: {
    flexDirection: 'row', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md,
    borderTopWidth: 1, borderTopColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backBtn: {
    flex: 1, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface, alignItems: 'center',
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: COLORS.textSecondary },
  nextBtn: {
    flex: 2, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary, alignItems: 'center',
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
});
