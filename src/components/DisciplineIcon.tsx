import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutType } from '../types';
import { COLORS } from '../theme/colors';

interface DisciplineIconProps {
  type: WorkoutType;
  size?: number;
  showBackground?: boolean;
  backgroundColor?: string;
}

export function getDisciplineColor(type: WorkoutType): string {
  switch (type) {
    case 'swim': return COLORS.swim;
    case 'bike': return COLORS.bike;
    case 'run': return COLORS.run;
    case 'brick': return COLORS.brick;
    case 'strength': return '#E91E63';
    case 'rest': return COLORS.rest;
    case 'double-threshold': return COLORS.brick;
    default: return COLORS.textMuted;
  }
}

export function getDisciplineIcon(type: WorkoutType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'swim': return 'water';
    case 'bike': return 'bicycle';
    case 'run': return 'walk';
    case 'brick': return 'layers';
    case 'strength': return 'barbell';
    case 'rest': return 'bed';
    case 'double-threshold': return 'flash';
    default: return 'fitness';
  }
}

export function getDisciplineLabel(type: WorkoutType): string {
  switch (type) {
    case 'swim': return 'Swim';
    case 'bike': return 'Bike';
    case 'run': return 'Run';
    case 'brick': return 'Brick';
    case 'strength': return 'Strength';
    case 'rest': return 'Rest';
    case 'double-threshold': return 'Double Threshold';
    default: return type;
  }
}

export function DisciplineIcon({
  type,
  size = 24,
  showBackground = true,
  backgroundColor,
}: DisciplineIconProps) {
  const color = getDisciplineColor(type);
  const icon = getDisciplineIcon(type);
  const bgColor = backgroundColor ?? `${color}22`;

  if (!showBackground) {
    return <Ionicons name={icon} size={size} color={color} />;
  }

  return (
    <View
      style={[
        styles.container,
        {
          width: size * 1.8,
          height: size * 1.8,
          borderRadius: size * 0.9,
          backgroundColor: bgColor,
        },
      ]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
