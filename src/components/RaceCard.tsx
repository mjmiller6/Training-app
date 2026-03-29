import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Race } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';

interface RaceCardProps {
  race: Race;
  daysUntil: number;
  onPress?: () => void;
  onDelete?: (id: string) => void;
  isPast?: boolean;
}

function getRaceTypeLabel(type: Race['type']): string {
  const labels: Record<Race['type'], string> = {
    sprint: 'Sprint',
    olympic: 'Olympic',
    'half-ironman': '70.3',
    ironman: 'Ironman',
    other: 'Custom',
  };
  return labels[type] ?? type;
}

function getRaceTypeColor(type: Race['type']): string {
  const colors: Record<Race['type'], string> = {
    sprint: COLORS.swim,
    olympic: COLORS.bike,
    'half-ironman': COLORS.run,
    ironman: COLORS.brick,
    other: COLORS.textMuted,
  };
  return colors[type] ?? COLORS.textMuted;
}

function formatGoalTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m.toString().padStart(2, '0')}m` : `${m}m`;
}

export function RaceCard({ race, daysUntil, onPress, onDelete, isPast }: RaceCardProps) {
  const typeColor = getRaceTypeColor(race.type);

  function handleDelete() {
    Alert.alert('Delete Race', `Remove "${race.name}" from your races?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => onDelete?.(race.id) },
    ]);
  }

  if (!isPast) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
          colors={[COLORS.surface, COLORS.surfaceElevated]}
          style={styles.upcomingCard}
        >
          <View style={styles.upcomingHeader}>
            <View style={[styles.typeBadge, { backgroundColor: `${typeColor}22`, borderColor: typeColor }]}>
              <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                {getRaceTypeLabel(race.type)}
              </Text>
            </View>
            {onDelete && (
              <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
                <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.raceName}>{race.name}</Text>

          {race.location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={13} color={COLORS.textSecondary} />
              <Text style={styles.locationText}>{race.location}</Text>
            </View>
          ) : null}

          <View style={styles.countdownRow}>
            <View style={styles.countdownBox}>
              <Text style={styles.countdownNumber}>{daysUntil}</Text>
              <Text style={styles.countdownLabel}>days away</Text>
            </View>
            <View style={styles.raceDetails}>
              <View style={styles.detailRow}>
                <Ionicons name="calendar-outline" size={13} color={COLORS.textSecondary} />
                <Text style={styles.detailText}>
                  {new Date(race.date + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </View>
              {race.goal_time != null && (
                <View style={styles.detailRow}>
                  <Ionicons name="timer-outline" size={13} color={COLORS.primary} />
                  <Text style={[styles.detailText, { color: COLORS.primary }]}>
                    Goal: {formatGoalTime(race.goal_time)}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  // Past race
  return (
    <TouchableOpacity style={styles.pastCard} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.pastLeft}>
        <View style={[styles.typeBadgeSmall, { backgroundColor: `${typeColor}22` }]}>
          <Text style={[styles.typeBadgeSmallText, { color: typeColor }]}>
            {getRaceTypeLabel(race.type)}
          </Text>
        </View>
        <Text style={styles.pastName}>{race.name}</Text>
        <Text style={styles.pastDate}>
          {new Date(race.date + 'T00:00:00').toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
      <View style={styles.pastRight}>
        {race.actual_time != null ? (
          <>
            <Text style={styles.actualTimeLabel}>Finished</Text>
            <Text style={styles.actualTime}>{formatGoalTime(race.actual_time)}</Text>
          </>
        ) : (
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          </View>
        )}
        {onDelete && (
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
            <Ionicons name="trash-outline" size={14} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  upcomingCard: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  upcomingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  typeBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  deleteBtn: { padding: SPACING.xs },
  raceName: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: SPACING.md },
  locationText: { fontSize: 13, color: COLORS.textSecondary },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.lg },
  countdownBox: { alignItems: 'center' },
  countdownNumber: { fontSize: 42, fontWeight: '800', color: COLORS.primary, lineHeight: 48 },
  countdownLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  raceDetails: { flex: 1, gap: SPACING.xs },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, color: COLORS.textSecondary },
  // Past race styles
  pastCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pastLeft: { flex: 1 },
  typeBadgeSmall: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: 4,
  },
  typeBadgeSmallText: { fontSize: 10, fontWeight: '700' },
  pastName: { fontSize: 14, fontWeight: '600', color: COLORS.text },
  pastDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  pastRight: { alignItems: 'flex-end', gap: 4 },
  actualTimeLabel: { fontSize: 11, color: COLORS.textMuted },
  actualTime: { fontSize: 16, fontWeight: '700', color: COLORS.success },
  completedBadge: {},
});
