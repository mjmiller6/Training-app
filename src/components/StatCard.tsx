import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';

interface StatCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  accent?: boolean;
}

export function StatCard({ title, value, subtitle, icon, iconColor, accent }: StatCardProps) {
  return (
    <View style={[styles.card, accent && styles.cardAccent]}>
      <View style={[styles.iconContainer, { backgroundColor: `${iconColor ?? COLORS.primary}22` }]}>
        <Ionicons name={icon} size={20} color={iconColor ?? COLORS.primary} />
      </View>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    alignItems: 'flex-start',
  },
  cardAccent: {
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  value: { fontSize: 22, fontWeight: '800', color: COLORS.text, marginBottom: 2 },
  title: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '500' },
  subtitle: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
});
