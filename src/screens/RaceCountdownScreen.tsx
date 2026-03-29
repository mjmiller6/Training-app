import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useRaces } from '../hooks/useRaces';
import { RaceCard } from '../components/RaceCard';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';

export function RaceCountdownScreen() {
  const navigation = useNavigation<any>();
  const { loading, refetch, getUpcomingRaces, getPastRaces, getDaysUntilRace, deleteRace } =
    useRaces();

  const upcoming = getUpcomingRaces();
  const past = getPastRaces();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={refetch} tintColor={COLORS.primary} />
        }
        contentContainerStyle={styles.scroll}
      >
        {/* Upcoming Races */}
        <Text style={styles.sectionTitle}>Upcoming</Text>

        {loading ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.xl }} />
        ) : upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="trophy-outline" size={40} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>No upcoming races</Text>
            <Text style={styles.emptySubtitle}>Add a race to start your countdown</Text>
          </View>
        ) : (
          upcoming.map((race) => (
            <RaceCard
              key={race.id}
              race={race}
              daysUntil={getDaysUntilRace(race)}
              onPress={() => navigation.navigate('AddRace', { raceId: race.id })}
              onDelete={deleteRace}
            />
          ))
        )}

        {/* Past Races */}
        {past.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: SPACING.lg }]}>Past Races</Text>
            {past.map((race) => (
              <RaceCard
                key={race.id}
                race={race}
                daysUntil={getDaysUntilRace(race)}
                onPress={() => navigation.navigate('AddRace', { raceId: race.id })}
                onDelete={deleteRace}
                isPast
              />
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddRace', {})}
      >
        <Ionicons name="add" size={28} color={COLORS.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { paddingHorizontal: SPACING.lg, paddingTop: SPACING.md },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, textAlign: 'center' },
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
