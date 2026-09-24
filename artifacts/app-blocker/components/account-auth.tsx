import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { useSignIn, useSignUp, useSSO } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { dailyUsageCopy } from '@/lib/daily-usage-copy';

WebBrowser.maybeCompleteAuthSession();

type AuthMode = 'sign-in' | 'sign-up' | 'verify-sign-in' | 'verify-sign-up';

export function AccountAuthScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn, fetchStatus: signInFetchStatus } = useSignIn();
  const { signUp, fetchStatus: signUpFetchStatus } = useSignUp();
  const { startSSOFlow } = useSSO();
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [oauthPending, setOauthPending] = useState(false);
  const copy = dailyUsageCopy.uz;
  const busy =
    signInFetchStatus === 'fetching' ||
    signUpFetchStatus === 'fetching' ||
    oauthPending;

  useEffect(() => {
    if (Platform.OS !== 'android') return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);

  const submitEmailPassword = async () => {
    setError('');
    setNotice('');
    try {
      if (mode === 'sign-up') {
        const { error: signUpError } = await signUp.password({
          emailAddress: emailAddress.trim(),
          password,
        });
        if (signUpError) {
          setError(copy.authError);
          return;
        }
        if (signUp.status === 'complete') {
          await signUp.finalize();
          return;
        }
        await signUp.verifications.sendEmailCode();
        setMode('verify-sign-up');
        setNotice(copy.verificationSent);
        return;
      }

      const { error: signInError } = await signIn.password({
        emailAddress: emailAddress.trim(),
        password,
      });
      if (signInError) {
        setError(copy.authError);
        return;
      }
      if (signIn.status === 'complete') {
        await signIn.finalize();
        return;
      }
      if (signIn.status === 'needs_client_trust') {
        const emailFactor = signIn.supportedSecondFactors.find(
          (factor) => factor.strategy === 'email_code',
        );
        if (emailFactor) {
          await signIn.mfa.sendEmailCode();
          setMode('verify-sign-in');
          setNotice(copy.verificationSent);
          return;
        }
      }
      setError(copy.mfaUnsupported);
    } catch {
      setError(copy.authError);
    }
  };

  const verifyCode = async () => {
    setError('');
    setNotice('');
    try {
      if (mode === 'verify-sign-up') {
        const { error: verificationError } =
          await signUp.verifications.verifyEmailCode({ code: code.trim() });
        if (verificationError) {
          setError(copy.authCodeError);
          return;
        }
        if (signUp.status === 'complete') {
          await signUp.finalize();
          return;
        }
      } else {
        const { error: verificationError } =
          await signIn.mfa.verifyEmailCode({ code: code.trim() });
        if (verificationError) {
          setError(copy.authCodeError);
          return;
        }
        if (signIn.status === 'complete') {
          await signIn.finalize();
          return;
        }
      }
      setError(copy.authError);
    } catch {
      setError(copy.authCodeError);
    }
  };

  const continueWithGoogle = async () => {
    setError('');
    setNotice('');
    setOauthPending(true);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: 'oauth_google',
        redirectUrl: AuthSession.makeRedirectUri({
          scheme: 'app-blocker',
          path: 'oauth',
        }),
      });
      if (!createdSessionId || !setActive) {
        setError(copy.mfaUnsupported);
        return;
      }
      await setActive({ session: createdSessionId });
    } catch {
      setError(copy.authError);
    } finally {
      setOauthPending(false);
    }
  };

  const isVerifying =
    mode === 'verify-sign-in' || mode === 'verify-sign-up';
  const styles = StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingTop: insets.top + 22,
      paddingBottom: insets.bottom + 28,
      paddingHorizontal: 22,
    },
    card: {
      width: '100%',
      maxWidth: 480,
      alignSelf: 'center',
      padding: 24,
      borderRadius: colors.radius + 12,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
    },
    mark: {
      width: 48,
      height: 48,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: colors.radius,
      backgroundColor: colors.secondary,
    },
    eyebrow: {
      marginTop: 20,
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    title: {
      marginTop: 8,
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      fontSize: 27,
      lineHeight: 33,
    },
    description: {
      marginTop: 8,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
      lineHeight: 21,
    },
    label: {
      marginTop: 20,
      marginBottom: 7,
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },
    input: {
      minHeight: 48,
      paddingHorizontal: 14,
      borderWidth: 1,
      borderColor: colors.input,
      borderRadius: colors.radius,
      backgroundColor: colors.background,
      color: colors.foreground,
      fontFamily: 'Inter_400Regular',
      fontSize: 15,
    },
    button: {
      minHeight: 48,
      marginTop: 22,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 9,
      borderRadius: colors.radius,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
    },
    buttonText: {
      color: colors.primaryForeground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
    googleButton: {
      minHeight: 48,
      marginTop: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 9,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: 14,
    },
    googleText: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
    },
    linkButton: {
      minHeight: 44,
      marginTop: 14,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    linkText: {
      color: colors.primary,
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      textAlign: 'center',
    },
    error: {
      marginTop: 14,
      color: colors.destructive,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      lineHeight: 18,
    },
    notice: {
      marginTop: 14,
      color: colors.accentForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      lineHeight: 18,
    },
    captcha: {
      height: 1,
      overflow: 'hidden',
    },
  });

  return (
    <View style={styles.screen}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        bottomOffset={24}
      >
        <View style={styles.card}>
          <View style={styles.mark}>
            <Feather name="shield" size={23} color={colors.primary} />
          </View>
          <Text style={styles.eyebrow}>{copy.account}</Text>
          <Text style={styles.title}>
            {isVerifying
              ? copy.verificationCode
              : mode === 'sign-up'
                ? copy.signUp
                : copy.accountTitle}
          </Text>
          <Text style={styles.description}>{copy.accountDescription}</Text>

          {isVerifying ? (
            <>
              <Text style={styles.label}>{copy.verificationCode}</Text>
              <TextInput
                value={code}
                onChangeText={(value) =>
                  setCode(value.replace(/\D/g, '').slice(0, 8))
                }
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                textContentType="oneTimeCode"
                style={styles.input}
                accessibilityLabel={copy.verificationCode}
              />
              <Pressable
                onPress={() => void verifyCode()}
                disabled={!code || busy}
                style={({ pressed }) => [
                  styles.button,
                  (pressed || busy) && { opacity: 0.72 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Feather
                      name="check"
                      size={17}
                      color={colors.primaryForeground}
                    />
                    <Text style={styles.buttonText}>{copy.verify}</Text>
                  </>
                )}
              </Pressable>
            </>
          ) : (
            <>
              <Text style={styles.label}>{copy.email}</Text>
              <TextInput
                value={emailAddress}
                onChangeText={setEmailAddress}
                placeholder="name@example.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                style={styles.input}
                accessibilityLabel={copy.email}
              />
              <Text style={styles.label}>{copy.password}</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoComplete={mode === 'sign-up' ? 'new-password' : 'password'}
                textContentType={
                  mode === 'sign-up' ? 'newPassword' : 'password'
                }
                secureTextEntry
                style={styles.input}
                accessibilityLabel={copy.password}
              />
              {mode === 'sign-up' && <View nativeID="clerk-captcha" style={styles.captcha} />}
              <Pressable
                onPress={() => void submitEmailPassword()}
                disabled={!emailAddress || !password || busy}
                style={({ pressed }) => [
                  styles.button,
                  (pressed || busy) && { opacity: 0.72 },
                ]}
              >
                {busy ? (
                  <ActivityIndicator color={colors.primaryForeground} />
                ) : (
                  <>
                    <Feather
                      name="arrow-right"
                      size={17}
                      color={colors.primaryForeground}
                    />
                    <Text style={styles.buttonText}>
                      {mode === 'sign-up' ? copy.signUp : copy.signIn}
                    </Text>
                  </>
                )}
              </Pressable>
              <Pressable
                onPress={() => void continueWithGoogle()}
                disabled={busy}
                style={({ pressed }) => [
                  styles.googleButton,
                  pressed && { opacity: 0.75 },
                ]}
              >
                <Feather name="globe" size={17} color={colors.foreground} />
                <Text style={styles.googleText}>{copy.google}</Text>
              </Pressable>
            </>
          )}

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {notice ? <Text style={styles.notice}>{notice}</Text> : null}

          <Pressable
            onPress={() => {
              setError('');
              setNotice('');
              setCode('');
              setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up');
            }}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>
              {mode === 'sign-up' ? copy.switchToSignIn : copy.switchToSignUp}
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}