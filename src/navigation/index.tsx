import React from 'react';
import { Session } from '@supabase/supabase-js';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

// Screens
import { HomeScreen } from '../screens/HomeScreen';
import { TrainingPlansScreen } from '../screens/TrainingPlansScreen';
import { PlanDetailScreen } from '../screens/PlanDetailScreen';
import { CreatePlanScreen } from '../screens/CreatePlanScreen';
import { WorkoutLogScreen } from '../screens/WorkoutLogScreen';
import { LogWorkoutScreen } from '../screens/LogWorkoutScreen';
import { RaceCountdownScreen } from '../screens/RaceCountdownScreen';
import { AddRaceScreen } from '../screens/AddRaceScreen';
import { StatsScreen } from '../screens/StatsScreen';

// Navigation param types
export type PlansStackParamList = {
  TrainingPlans: undefined;
  PlanDetail: { planId: string; planName: string };
  CreatePlan: undefined;
};

export type LogStackParamList = {
  WorkoutLog: undefined;
  LogWorkout: { workoutId?: string };
};

export type RaceStackParamList = {
  Races: undefined;
  AddRace: { raceId?: string };
};

export type RootTabParamList = {
  Home: undefined;
  Plans: undefined;
  Log: undefined;
  Races: undefined;
  Stats: undefined;
};

const Tab = createBottomTabNavigator<RootTabParamList>();
const PlansStack = createNativeStackNavigator<PlansStackParamList>();
const LogStack = createNativeStackNavigator<LogStackParamList>();
const RaceStack = createNativeStackNavigator<RaceStackParamList>();

const stackScreenOptions = {
  headerStyle: { backgroundColor: COLORS.surface },
  headerTintColor: COLORS.text,
  headerTitleStyle: { color: COLORS.text, fontWeight: '600' as const },
  contentStyle: { backgroundColor: COLORS.background },
};

function PlansNavigator() {
  return (
    <PlansStack.Navigator screenOptions={stackScreenOptions}>
      <PlansStack.Screen
        name="TrainingPlans"
        component={TrainingPlansScreen}
        options={{ title: 'Training Plans' }}
      />
      <PlansStack.Screen
        name="PlanDetail"
        component={PlanDetailScreen}
        options={({ route }) => ({ title: route.params.planName })}
      />
      <PlansStack.Screen
        name="CreatePlan"
        component={CreatePlanScreen}
        options={{ title: 'New Training Plan' }}
      />
    </PlansStack.Navigator>
  );
}

function LogNavigator() {
  return (
    <LogStack.Navigator screenOptions={stackScreenOptions}>
      <LogStack.Screen
        name="WorkoutLog"
        component={WorkoutLogScreen}
        options={{ title: 'Workout Log' }}
      />
      <LogStack.Screen
        name="LogWorkout"
        component={LogWorkoutScreen}
        options={({ route }) => ({
          title: route.params.workoutId ? 'Edit Workout' : 'Log Workout',
        })}
      />
    </LogStack.Navigator>
  );
}

function RaceNavigator() {
  return (
    <RaceStack.Navigator screenOptions={stackScreenOptions}>
      <RaceStack.Screen
        name="Races"
        component={RaceCountdownScreen}
        options={{ title: 'My Races' }}
      />
      <RaceStack.Screen
        name="AddRace"
        component={AddRaceScreen}
        options={({ route }) => ({
          title: route.params.raceId ? 'Edit Race' : 'Add Race',
        })}
      />
    </RaceStack.Navigator>
  );
}

interface AppNavigatorProps {
  session: Session;
}

export function AppNavigator({ session }: AppNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500' },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Plans') {
            iconName = focused ? 'calendar' : 'calendar-outline';
          } else if (route.name === 'Log') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else if (route.name === 'Races') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Stats') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Plans" component={PlansNavigator} />
      <Tab.Screen name="Log" component={LogNavigator} />
      <Tab.Screen name="Races" component={RaceNavigator} />
      <Tab.Screen name="Stats" component={StatsScreen} />
    </Tab.Navigator>
  );
}
