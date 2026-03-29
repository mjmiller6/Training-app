import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTrainingPlans } from '../hooks/useTrainingPlans';
import { TrainingPlan } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';

function PlanCard({
  plan,
  onPress,
  onSetActive,
  onDelete,
  currentWeek,
}: {
  plan: TrainingPlan;
  onPress: () => void;
  onSetActive: () => void;
  onDelete: () => void;
  currentWeek: number;
}) {
  const progress = plan.is_active
    ? Math.min((currentWeek / plan.duration_weeks) * 100, 100)
    : 0;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <LinearGradient
        colors={plan.is_active ? [COLORS.primary + '22', COLORS.surface] : [COLORS.surface, COLORS.surface]}
        style={[styles.planCard, plan.is_active && styles.planCardActive]}
      >
        <View style={styles.planHeader}>
          <View style={{ flex: 1 }}>
            <View style={styles.planTitleRow}>
              {plan.is_active && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
              <Text style={styles.planName}>{plan.name}</Text>
            </View>
            <Text style={styles.planMeta}>
              {plan.duration_weeks} weeks
              {plan.start_date
                ? ` · Started ${new Date(plan.start_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                : ''}
            </Text>
            {plan.description ? (
              <Text style={styles.planDesc} numberOfLines={2}>{plan.description}</Text>
            ) : null}
          </View>
          <TouchableOpacity
            onPress={() =>
              Alert.alert(
                plan.name,
                'What would you like to do?',
                [
                  !plan.is_active
                    ? { text: 'Set as Active', onPress: onSetActive }
                    : { text: 'Currently Active', style: 'cancel' as any },
                  { text: 'Delete Plan', style: 'destructive', onPress: onDelete },
                  { text: 'Cancel', style: 'cancel' },
                ]
              )
            }
            style={styles.menuButton}
          >
            <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        {plan.is_active && (
          <>
            <Text style={styles.weekLabel}>Week {currentWeek} of {plan.duration_weeks}</Text>
            <View style={styles.progressBg}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export function TrainingPlansScreen() {
  const navigation = useNavigation<any>();
  const { plans, loading, refetch, setActivePlan, deletePlan, getCurrentWeek } =
    useTrainingPlans();

  async function handleDelete(plan: TrainingPlan) {
    Alert.alert(
      'Delete Plan',
      `Delete "${plan.name}"? All scheduled workouts in this plan will be lost.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deletePlan(plan.id);
            if (error) Alert.alert('Error', error);
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={COLORS.primary} />
        </View>
      ) : plans.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={64} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No Training Plans</Text>
          <Text style={styles.emptySubtitle}>Create your first triathlon training plan</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => navigation.navigate('CreatePlan')}
          >
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.createButtonText}>New Plan</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={plans}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PlanCard
              plan={item}
              onPress={() =>
                navigation.navigate('PlanDetail', { planId: item.id, planName: item.name })
              }
              onSetActive={() => setActivePlan(item.id)}
              onDelete={() => handleDelete(item)}
              currentWeek={item.is_active ? getCurrentWeek() : 0}
            />
          )}
          contentContainerStyle={styles.list}
          onRefresh={refetch}
          refreshing={loading}
          showsVerticalScrollIndicator={false}
        />
      )}

      {plans.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate('CreatePlan')}
        >
          <Ionicons name="add" size={28} color={COLORS.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  list: { padding: SPACING.lg, paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SPACING.md, padding: SPACING.xl },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  emptySubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    marginTop: SPACING.sm,
  },
  createButtonText: { fontSize: 15, fontWeight: '700', color: COLORS.white },
  planCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  planCardActive: { borderColor: COLORS.primary + '88' },
  planHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SPACING.xs, marginBottom: 4 },
  activeBadge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
  },
  activeBadgeText: { fontSize: 10, fontWeight: '800', color: COLORS.white, letterSpacing: 0.5 },
  planName: { fontSize: 16, fontWeight: '700', color: COLORS.text, flex: 1 },
  planMeta: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  planDesc: { fontSize: 12, color: COLORS.textMuted },
  menuButton: { padding: SPACING.xs },
  weekLabel: { fontSize: 13, color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: SPACING.xs },
  progressBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
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
