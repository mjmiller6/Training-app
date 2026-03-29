import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Workout } from '../types';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';
import { DisciplineIcon, getDisciplineColor, getDisciplineLabel } from './DisciplineIcon';
import { format } from 'date-fns';

interface WorkoutCardProps {
  workout: Workout;
  onPress?: () => void;
  onDelete?: (id: string) => void;
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function WorkoutCard({ workout, onPress, onDelete }: WorkoutCardProps) {
  const color = getDisciplineColor(workout.type);

  function handleDelete() {
    Alert.alert('Delete Workout', 'Are you sure you want to delete this workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => onDelete?.(workout.id),
      },
    ]);
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.colorBar, { backgroundColor: color }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <DisciplineIcon type={workout.type} size={20} />
          <View style={styles.titleGroup}>
            <Text style={styles.type}>{getDisciplineLabel(workout.type)}</Text>
            <Text style={styles.date}>
              {format(new Date(workout.date + 'T00:00:00'), 'EEE, MMM d')}
            </Text>
          </View>
          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Ionicons name="time-outline" size={14} color={COLORS.textSecondary} />
            <Text style={styles.statValue}>{formatDuration(workout.duration)}</Text>
          </View>
          {workout.distance != null && (
            <View style={styles.stat}>
              <Ionicons name="navigate-outline" size={14} color={COLORS.textSecondary} />
              <Text style={styles.statValue}>{workout.distance.toFixed(1)} km</Text>
            </View>
          )}
          {workout.avg_heart_rate != null && (
            <View style={styles.stat}>
              <Ionicons name="heart-outline" size={14} color={COLORS.error} />
              <Text style={styles.statValue}>{workout.avg_heart_rate} bpm</Text>
            </View>
          )}
          {workout.calories != null && (
            <View style={styles.stat}>
              <Ionicons name="flame-outline" size={14} color={COLORS.warning} />
              <Text style={styles.statValue}>{workout.calories} cal</Text>
            </View>
          )}
        </View>

        {workout.notes ? (
          <Text style={styles.notes} numberOfLines={2}>
            {workout.notes}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  colorBar: { width: 4 },
  content: { flex: 1, padding: SPACING.md },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  titleGroup: { flex: 1, marginLeft: SPACING.sm },
  type: { fontSize: 15, fontWeight: '600', color: COLORS.text },
  date: { fontSize: 12, color: COLORS.textSecondary },
  deleteButton: { padding: SPACING.xs },
  stats: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statValue: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '500' },
  notes: { marginTop: SPACING.sm, fontSize: 13, color: COLORS.textMuted, fontStyle: 'italic' },
});
