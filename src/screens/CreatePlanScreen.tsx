import React, { useState } from 'react';
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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';

const DURATION_OPTIONS = [4, 8, 12, 16, 20, 24];

const TEMPLATES = [
  {
    id: 'sprint-beginner',
    name: 'Sprint Triathlon — Beginner',
    description: 'A gentle 8-week plan for first-timers. 3-4 sessions per week.',
    weeks: 8,
    icon: '🌱',
  },
  {
    id: 'sprint-intermediate',
    name: 'Sprint Triathlon — Intermediate',
    description: '10-week plan with brick sessions and tempo work. 5 sessions/week.',
    weeks: 10,
    icon: '⚡',
  },
  {
    id: 'olympic',
    name: 'Olympic Triathlon',
    description: '16-week structured build for Olympic distance. 5-6 sessions/week.',
    weeks: 16,
    icon: '🏅',
  },
  {
    id: 'half-ironman',
    name: 'Half Ironman 70.3',
    description: '20-week plan targeting 70.3. High volume with periodization.',
    weeks: 20,
    icon: '💪',
  },
  {
    id: 'ironman',
    name: 'Full Ironman',
    description: '24-week full Ironman prep. For experienced triathletes.',
    weeks: 24,
    icon: '🏆',
  },
  {
    id: 'custom',
    name: 'Custom Plan',
    description: 'Build your own plan from scratch. Add workouts week by week.',
    weeks: 0,
    icon: '✏️',
  },
];

export function CreatePlanScreen() {
  const navigation = useNavigation<any>();
  const { createPlan, setActivePlan } = useTrainingPlans();

  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [durationWeeks, setDurationWeeks] = useState(12);
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [makeActive, setMakeActive] = useState(true);
  const [saving, setSaving] = useState(false);

  function selectTemplate(template: (typeof TEMPLATES)[0]) {
    setSelectedTemplate(template.id);
    if (!name) setName(template.name);
    if (!description) setDescription(template.description);
    if (template.weeks > 0) setDurationWeeks(template.weeks);
  }

  async function handleCreate() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a plan name.');
      return;
    }
    if (!startDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Please enter start date as YYYY-MM-DD.');
      return;
    }

    setSaving(true);

    const { data, error } = await createPlan({
      name: name.trim(),
      description: description.trim() || undefined,
      duration_weeks: durationWeeks,
      start_date: startDate,
      is_active: makeActive,
    });

    if (error) {
      Alert.alert('Error', error);
      setSaving(false);
      return;
    }

    if (data && makeActive) {
      await setActivePlan(data.id);
    }

    setSaving(false);

    if (data) {
      // Navigate to the new plan's detail screen
      navigation.replace('PlanDetail', { planId: data.id, planName: data.name });
    } else {
      navigation.goBack();
    }
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Template picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Choose a Template</Text>
            {TEMPLATES.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[
                  styles.templateCard,
                  selectedTemplate === t.id && styles.templateCardActive,
                ]}
                onPress={() => selectTemplate(t)}
              >
                <Text style={styles.templateIcon}>{t.icon}</Text>
                <View style={styles.templateInfo}>
                  <Text style={styles.templateName}>{t.name}</Text>
                  <Text style={styles.templateDesc}>{t.description}</Text>
                  {t.weeks > 0 && (
                    <Text style={styles.templateWeeks}>{t.weeks} weeks</Text>
                  )}
                </View>
                {selectedTemplate === t.id && (
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Plan details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Plan Details</Text>

            <Text style={styles.label}>Plan Name</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="My Triathlon Plan"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <Text style={[styles.label, { marginTop: SPACING.md }]}>
              Description <Text style={styles.optional}>optional</Text>
            </Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Describe your training goals..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Duration */}
          <View style={styles.section}>
            <Text style={styles.label}>Duration</Text>
            <View style={styles.durationRow}>
              {DURATION_OPTIONS.map((w) => (
                <TouchableOpacity
                  key={w}
                  style={[styles.durationChip, durationWeeks === w && styles.durationChipActive]}
                  onPress={() => setDurationWeeks(w)}
                >
                  <Text
                    style={[
                      styles.durationChipText,
                      durationWeeks === w && styles.durationChipTextActive,
                    ]}
                  >
                    {w}wk
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start date */}
          <View style={styles.section}>
            <Text style={styles.label}>Start Date</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
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

          {/* Make active toggle */}
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.label}>Set as Active Plan</Text>
              <Text style={styles.toggleSubtitle}>This plan will appear on your home screen</Text>
            </View>
            <Switch
              value={makeActive}
              onValueChange={setMakeActive}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>

          {/* Create button */}
          <TouchableOpacity
            style={[styles.createButton, saving && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.white} />
                <Text style={styles.createButtonText}>Create Plan</Text>
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.sm,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  templateCardActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}11` },
  templateIcon: { fontSize: 24 },
  templateInfo: { flex: 1 },
  templateName: { fontSize: 14, fontWeight: '700', color: COLORS.text, marginBottom: 2 },
  templateDesc: { fontSize: 12, color: COLORS.textSecondary },
  templateWeeks: { fontSize: 11, color: COLORS.primary, fontWeight: '600', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textSecondary, marginBottom: SPACING.xs },
  optional: { fontWeight: '400', color: COLORS.textMuted, fontSize: 12 },
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
  textAreaWrapper: { alignItems: 'flex-start', paddingVertical: SPACING.sm },
  textArea: { minHeight: 72, paddingVertical: SPACING.xs },
  durationRow: { flexDirection: 'row', gap: SPACING.sm, flexWrap: 'wrap' },
  durationChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  durationChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  durationChipText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  durationChipTextActive: { color: COLORS.white },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  toggleSubtitle: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  createButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  createButtonDisabled: { opacity: 0.6 },
  createButtonText: { fontSize: 16, fontWeight: '700', color: COLORS.white },
});
