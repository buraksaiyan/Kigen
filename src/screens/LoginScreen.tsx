import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../services/supabase';
import { env } from '../config/env';
import { UserStatsService } from '../services/userStatsService';
import { useTranslation } from '../i18n/I18nProvider';

interface LoginScreenProps {
  onClose: () => void;
  theme: {
    colors: {
      primary: string;
      secondary: string;
      success: string;
      danger: string;
      warning: string;
      background: string;
      surface: string;
      surfaceSecondary: string;
      border: string;
      text: {
        primary: string;
        secondary: string;
        tertiary: string;
        disabled: string;
      };
    };
  };
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onClose, theme }) => {
  const { t } = useTranslation();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateForm = (): boolean => {
    if (!email.trim()) {
      Alert.alert(t('login.errors.emailRequiredTitle'), t('login.errors.emailRequired'));
      return false;
    }
    
    if (!validateEmail(email)) {
      Alert.alert(t('login.errors.invalidEmailTitle'), t('login.errors.invalidEmail'));
      return false;
    }

    if (!password.trim()) {
      Alert.alert(t('login.errors.passwordRequiredTitle'), t('login.errors.passwordRequired'));
      return false;
    }

    if (password.length < 6) {
      Alert.alert(t('login.errors.passwordTooShortTitle'), t('login.errors.passwordTooShort'));
      return false;
    }

    if (isSignUp) {
      if (!username.trim()) {
        Alert.alert(t('login.errors.usernameRequiredTitle'), t('login.errors.usernameRequired'));
        return false;
      }

      if (password !== confirmPassword) {
        Alert.alert(t('login.errors.passwordsDoNotMatchTitle'), t('login.errors.passwordsDoNotMatch'));
        return false;
      }
    }

    return true;
  };

  const handleSignIn = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Check if Supabase is configured
      if (env.supabaseUrl.includes('placeholder')) {
        Alert.alert(t('login.errors.authUnavailableTitle'), t('login.errors.authUnavailable'));
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) throw error;

      Alert.alert(t('login.success.title'), t('login.success.welcomeBack'));
      onClose();
    } catch (error: any) {
      console.error('Sign in error:', error.message);
      Alert.alert(
        t('login.errors.signInFailedTitle'),
        error.message || t('login.errors.signInFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Check if Supabase is configured
      if (env.supabaseUrl.includes('placeholder')) {
        Alert.alert(t('login.errors.authUnavailableTitle'), t('login.errors.authUnavailable'));
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            name: username.trim(),
          }
        }
      });

      if (error) throw error;

      // Create user profile in UserStatsService
      await UserStatsService.createUserProfile(username.trim());

      Alert.alert(
        t('login.checkEmail.title'),
        t('login.checkEmail.message'),
        [{ text: t('common.ok') || 'OK', onPress: onClose }]
      );
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      Alert.alert(
        t('login.errors.signUpFailedTitle'),
        error.message || t('login.errors.signUpFailed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (isSignUp) {
      handleSignUp();
    } else {
      handleSignIn();
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setUsername('');
    setShowPassword(false);
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      
      {/* Header with Close Button */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
          {isSignUp ? t('login.createAccount') : t('login.welcomeBack')}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.form}>
          {/* Title */}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: theme.colors.text.primary }]}>
              {isSignUp ? t('login.createYourAccount') : t('login.signInToYourAccount')}
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
              {isSignUp ? t('login.joinKigen') : t('login.welcomeBackPleaseSignIn')}
            </Text>
          </View>

          {/* Sign Up - Username Field */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t('login.username')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                placeholder={t('login.placeholders.username')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />
            </View>
          )}

          {/* Email Field */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {t('login.email')}
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                },
              ]}
              placeholder={t('login.placeholders.email')}
              placeholderTextColor={theme.colors.text.tertiary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!loading}
            />
          </View>

          {/* Password Field */}
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.colors.text.primary }]}>
              {t('login.password')}
            </Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[
                  styles.passwordInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                placeholder={isSignUp ? t('login.placeholders.createPassword') : t('login.placeholders.enterPassword')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
                editable={!loading}
              />
              <TouchableOpacity
                style={styles.passwordToggle}
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.colors.text.secondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password Field - Sign Up Only */}
          {isSignUp && (
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.colors.text.primary }]}>
                {t('login.confirmPassword')}
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                    color: theme.colors.text.primary,
                  },
                ]}
                placeholder={t('login.placeholders.confirmPassword')}
                placeholderTextColor={theme.colors.text.tertiary}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                editable={!loading}
              />
            </View>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
              loading && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={loading}
          >
                {loading ? (
              <ActivityIndicator size="small" color={theme.colors.background} />
            ) : (
                  <Text style={[styles.submitButtonText, { color: theme.colors.background }]}>
                {isSignUp ? t('login.createAccount') : t('login.signIn')}
                </Text>
            )}
          </TouchableOpacity>

          {/* Toggle Sign In/Sign Up */}
          <View style={styles.toggleContainer}>
            <Text style={[styles.toggleText, { color: theme.colors.text.secondary }]}>
              {isSignUp ? t('login.alreadyHaveAccount') : t('login.dontHaveAccount')}
            </Text>
            <TouchableOpacity onPress={toggleMode} disabled={loading}>
                <Text style={[styles.toggleButton, { 
                color: '#888691',
              }]}>
                {isSignUp ? t('login.signIn') : t('login.signUp')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Privacy Notice */}
          <Text style={[styles.privacyText, { color: theme.colors.text.tertiary }]}>
            {isSignUp ? t('login.privacy.creatingAccount') : t('login.privacy.signingIn')}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  closeButton: {
    padding: 5,
  },
  container: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.7,
  },
  form: {
    alignSelf: 'center',
    flex: 1,
    justifyContent: 'center',
    maxWidth: 400,
    width: '100%',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 15,
    paddingHorizontal: 20,
    paddingTop: 50,
  },
  headerSpacer: {
    width: 34, // Same width as close button to center title
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
    height: 50,
    paddingHorizontal: 16,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingRight: 50, // Space for eye icon
    fontSize: 16,
  },
  passwordToggle: {
    padding: 5,
    position: 'absolute',
    right: 16,
    top: 15,
  },
  privacyText: {
    fontSize: 13,
    lineHeight: 18,
    paddingHorizontal: 10,
    textAlign: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  submitButton: {
    alignItems: 'center',
    borderRadius: 12,
    height: 50,
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
    textAlign: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  toggleButton: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleContainer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 30,
  },
  toggleText: {
    fontSize: 15,
    marginRight: 5,
  },
});
