import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { COLORS, SPACING, BORDER_RADIUS } from '../theme/colors';

export function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleAuth() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields.');
      return;
    }

    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) Alert.alert('Login Failed', error.message);
    } else {
      if (!fullName) {
        Alert.alert('Error', 'Please enter your name.');
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (error) {
        Alert.alert('Sign Up Failed', error.message);
      } else {
        Alert.alert(
          'Check your email',
          'We sent you a confirmation link. Please verify your email to continue.'
        );
      }
    }

    setLoading(false);
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Logo / Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="bicycle" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.appTitle}>Triathlon Training</Text>
            <Text style={styles.appSubtitle}>Swim. Bike. Run. Conquer.</Text>
          </View>

          {/* Form Card */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>

            {!isLogin && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Your name"
                    placeholderTextColor={COLORS.textMuted}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, styles.inputFlex]}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color={COLORS.textMuted}
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.authButton, loading && styles.authButtonDisabled]}
              onPress={handleAuth}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.authButtonText}>{isLogin ? 'Sign In' : 'Create Account'}</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.toggleButton} onPress={() => setIsLogin(!isLogin)}>
              <Text style={styles.toggleText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.toggleLink}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Disciplines row */}
          <View style={styles.disciplinesRow}>
            {[
              { icon: 'water-outline', label: 'Swim', color: COLORS.swim },
              { icon: 'bicycle-outline', label: 'Bike', color: COLORS.bike },
              { icon: 'walk-outline', label: 'Run', color: COLORS.run },
            ].map((d) => (
              <View key={d.label} style={styles.disciplineItem}>
                <Ionicons name={d.icon as any} size={22} color={d.color} />
                <Text style={[styles.disciplineLabel, { color: d.color }]}>{d.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  keyboardView: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.xl },
  header: { alignItems: 'center', marginBottom: SPACING.xl },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  appTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.xs },
  appSubtitle: { fontSize: 14, color: COLORS.textSecondary, letterSpacing: 1.5 },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text, marginBottom: SPACING.lg },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: 13, color: COLORS.textSecondary, marginBottom: SPACING.xs, fontWeight: '500' },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceElevated,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: { marginRight: SPACING.sm },
  input: { flex: 1, paddingVertical: SPACING.md, color: COLORS.text, fontSize: 15 },
  inputFlex: { flex: 1 },
  eyeButton: { padding: SPACING.xs },
  authButton: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.md,
  },
  authButtonDisabled: { opacity: 0.6 },
  authButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
  toggleButton: { alignItems: 'center' },
  toggleText: { color: COLORS.textSecondary, fontSize: 14 },
  toggleLink: { color: COLORS.primary, fontWeight: '600' },
  disciplinesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xl,
    marginTop: SPACING.md,
  },
  disciplineItem: { alignItems: 'center', gap: SPACING.xs },
  disciplineLabel: { fontSize: 12, fontWeight: '500' },
});
