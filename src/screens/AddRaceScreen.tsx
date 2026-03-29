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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useRaces } from '../hooks/useRaces';
import { RaceType } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import type { RaceStackParamList } from '../navigation';

type AddRaceRouteProp = RouteProp<RaceStackParamList, 'AddRace'>;

const RACE_TYPES: { value: RaceType; label: string; distances: string }[] = [
  { value: 'sprint', label: 'Sprint', distances: '750m / 20km / 5km' },
  { value: 'olympic', label: 'Olympic', distances: '1.5km / 40km / 10km' },
  { value: 'half-ironman', label: '70.3', distances: '1.9km / 90km / 21km' },
  { value: 'ironman', label: 'Ironman', distances: '3.8km / 180km / 42km' },
  { value: 'other', label: 'Custom', distances: 'Custom distances' },
];

export function AddRaceScreen() {
  const navigation = useNavigation();
  const route = useRoute<AddRaceRouteProp>();
  const { raceId } = route.params ?? {};
  const { races, createRace, updateRace } = useRaces();

  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [type, setType] = useState<RaceType>('olympic');
  const [goalHours, setGoalHours] = useState('');
  const [goalMins, setGoalMins] = useState('');
  const [notes, setNotes] = useState('');
  const [completed, setCompleted] = useState(false);
  const [actualHours, setActualHours] = useState('');
  const [actualMins, setActualMins] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (raceId) {
      const existing = races.find((r) => r.id === raceId);
      if (existing) {
        setName(existing.name);
        setDate(existing.date);
        setLocation(existing.location ?? '');
        setType(existing.type);
        setNotes(existing.notes ?? '');
        setCompleted(existing.completed);
        if (existing.goal_time != null) {
          setGoalHours(String(Math.floor(existing.goal_time / 60)));
          setGoalMins(String(existing.goal_time % 60));
        }
        if (existing.actual_time != null) {
          setActualHours(String(Math.floor(existing.actual_time / 60)));
          setActualMins(String(existing.actual_time % 60));
        }
      }
    }
  }, [raceId, races]);

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter a race name.');
      return;
    }
    if (!date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Invalid Date', 'Please enter date as YYYY-MM-DD.');
      return;
    }

    setSaving(true);

    const goalTime =
      goalHours || goalMins
        ? (parseInt(goalHours || '0') * 60) + parseInt(goalMins || '0')
        : undefined;

    const actualTime =
      completed && (actualHours || actualMins)
        ? (parseInt(actualHours || '0') * 60) + parseInt(actualMins || '0')
        : undefined;

    const payload = {
      name: name.trim(),
      date,
      location: location.trim() || undefined,
      type,
      goal_time: goalTime,
      completed,
      actual_time: actualTime,
      notes: notes.trim() || undefined,
    };

    if (raceId) {
      const { error } = await updateRace(raceId, payload);
      if (error) Alert.alert('Error', error);
      else navigation.goBack();
    } else {
      const { error } = await createRace(payload);
      if (error) Alert.alert('Error', error);
      else navigation.goBack();
    }

    setSaving(false);
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Race Name */}
          <View style={styles.section}>
            <Text style={styles.label}>Race Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="trophy-outline" size={18} color={COLORS.warning} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g. Ironman 70.3 Santa Cruz"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text style={styles.label}>Race Date</Text>
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

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location <Text style={styles.optional}>optional</Text></Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="location-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={location}
                onChangeText={setLocation}
                placeholder="City, Country"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>
          </View>

          {/* Race Type */}
          <View style={styles.section}>
            <Text style={styles.label}>Race Type</Text>
            <View style={styles.typeGrid}>
              {RACE_TYPES.map((rt) => (
                <TouchableOpacity
                  key={rt.value}
                  style={[styles.typeCard, type === rt.value && styles.typeCardActive]}
                  onPress={() => setType(rt.value)}
                >
                  <Text style={[styles.typeCardLabel, type === rt.value && styles.typeCardLabelActive]}>
                    {rt.label}
                  </Text>
                  <Text style={styles.typeCardDistances}>{rt.distances}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Goal Time */}
          <View style={styles.section}>
            <Text style={styles.label}>Goal Time <Text style={styles.optional}>optional</Text></Text>
            <View style={styles.timeRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  value={goalHours}
                  onChangeText={setGoalHours}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.timeUnit}>hrs</Text>
              </View>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <TextInput
                  style={styles.input}
                  value={goalMins}
                  onChangeText={setGoalMins}
                  placeholder="0"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />
                <Text style={styles.timeUnit}>min</Text>
              </View>
            </View>
          </View>

          {/* Completed toggle */}
          <View style={styles.toggleRow}>
            <Text style={styles.label}>Race Completed</Text>
            <Switch
              value={completed}
              onValueChange={setCompleted}
              trackColor={{ false: COLORS.border, true: COLORS.success }}
              thumbColor={COLORS.white}
            />
          </View>

          {completed && (
            <View style={styles.section}>
              <Text style={styles.label}>Actual Finish Time <Text style={styles.optional}>optional</Text></Text>
              <View style={styles.timeRow}>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    value={actualHours}
                    onChangeText={setActualHours}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.timeUnit}>hrs</Text>
                </View>
                <View style={[styles.inputWrapper, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    value={actualMins}
                    onChangeText={setActualMins}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="number-pad"
                  />
                  <Text style={styles.timeUnit}>min</Text>
                </View>
              </View>
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.label}>Notes <Text style={styles.optional}>optional</Text></Text>
            <View style={[styles.inputWrapper, styles.textAreaWrapper]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Race notes, goals, strategy..."
                placeholderTextColor={COLORS.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

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
                  {raceId ? 'Update Race' : 'Add Race'}
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
  typeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  typeCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  typeCardActive: { borderColor: COLORS.primary, backgroundColor: `${COLORS.primary}22` },
  typeCardLabel: { fontSize: 13, fontWeight: '700', color: COLORS.textSecondary },
  typeCardLabelActive: { color: COLORS.primary },
  typeCardDistances: { fontSize: 10, color: COLORS.textMuted, marginTop: 2, textAlign: 'center' },
  timeRow: { flexDirection: 'row', gap: SPACING.sm },
  timeUnit: { fontSize: 13, color: COLORS.textMuted, marginLeft: 4 },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
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
