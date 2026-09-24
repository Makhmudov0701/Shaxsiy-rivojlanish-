import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  AppState,
  Modal,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth, useClerk } from '@clerk/expo';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  getGetActiveTimeLimitQueryKey,
  useGetActiveTimeLimit,
  useHeartbeatActiveTime,
  useOverrideActiveTimeLimit,
  useSetDiaryPin,
  useUpdateActiveTimeLimit,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import {
  dailyUsageCopy,
  dailyUsageLanguages,
  formatDailyUsageClock,
  type DailyUsageLanguage,
} from '@/lib/daily-usage-copy';

type ActiveTimeState = {
  enabled: boolean;
  limitSeconds: number;
  usedSeconds: number;
  extensionSeconds: number;
  effectiveLimitSeconds: number;
  remainingSeconds: number;
  locked: boolean;
  language: DailyUsageLanguage;
  pinEnabled: boolean;
  timeZone: string;
  today: string;
};

function getTimeZone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}

function responseStatus(error: unknown) {
  const candidate = error as { status?: number; statusCode?: number };
  return candidate?.status ?? candidate?.statusCode;
}

function DailyUsageGateForUser({ children }: { children: ReactNode }) {
  const colors = useColors();
  const timeZone = useMemo(getTimeZone, []);
  const queryClient = useQueryClient();
  const query = useGetActiveTimeLimit({ timeZone });
  const heartbeat = useHeartbeatActiveTime();
  const override = useOverrideActiveTimeLimit();
  const [now, setNow] = useState(Date.now());
  const [syncedAt, setSyncedAt] = useState(Date.now());
  const [appActive, setAppActive] = useState(
    () => AppState.currentState === 'active',
  );
  const [pin, setPin] = useState('');
  const [overrideError, setOverrideError] = useState('');
  const state = query.data as ActiveTimeState | undefined;
  const language = state?.language ?? 'uz';
  const copy = dailyUsageCopy[language];
  const queryKey = getGetActiveTimeLimitQueryKey({ timeZone });

  useEffect(() => {
    if (state) setSyncedAt(Date.now());
  }, [state]);

  const sendHeartbeat = useCallback(
    async (closingActiveInterval = false) => {
      if (!state?.enabled) return;
      if (!closingActiveInterval && AppState.currentState !== 'active') return;
      try {
        const result = await heartbeat.mutateAsync({ data: { timeZone } });
        queryClient.setQueryData(queryKey, result);
        setSyncedAt(Date.now());
      } catch {
        // Keep the cached state and expose a warning if the request cannot sync.
      }
    },
    [heartbeat, queryClient, queryKey, state?.enabled, timeZone],
  );

  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const timer = setInterval(() => void sendHeartbeat(), 10_000);
    const subscription = AppState.addEventListener('change', (nextState) => {
      const active = nextState === 'active';
      setAppActive(active);
      setSyncedAt(Date.now());
      if (active) void sendHeartbeat();
      else void sendHeartbeat(true);
    });
    if (state?.enabled && AppState.currentState === 'active') {
      void sendHeartbeat();
    }
    return () => {
      clearInterval(tick);
      clearInterval(timer);
      subscription.remove();
    };
  }, [sendHeartbeat, state?.enabled]);

  const projectedUsed =
    (state?.usedSeconds ?? 0) +
    (state?.enabled && appActive
      ? Math.max(0, Math.floor((now - syncedAt) / 1000))
      : 0);
  const locked =
    Boolean(state?.enabled) &&
    (Boolean(state?.locked) ||
      projectedUsed >= (state?.effectiveLimitSeconds ?? 0));
  const copyStyles = StyleSheet.create({
    warning: {
      position: 'absolute',
      top: 14,
      left: 16,
      right: 16,
      zIndex: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 9,
      borderRadius: colors.radius,
      borderWidth: 1,
      borderColor: colors.destructive,
      backgroundColor: colors.card,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    warningText: {
      flex: 1,
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      lineHeight: 17,
    },
  });

  const applyOverride = async (action: 'extend' | 'reset') => {
    if (!state || !/^\d{4}$/.test(pin)) return;
    setOverrideError('');
    try {
      const result = await override.mutateAsync({
        data: { action, pin, timeZone },
      });
      queryClient.setQueryData(queryKey, result);
      setSyncedAt(Date.now());
      setPin('');
    } catch (error) {
      setOverrideError(
        responseStatus(error) === 429
          ? copy.pinRateLimited
          : copy.incorrectPin,
      );
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {children}
      {query.isError && (
        <View style={copyStyles.warning} accessibilityRole="alert">
          <Feather
            name="alert-triangle"
            size={17}
            color={colors.destructive}
          />
          <Text style={copyStyles.warningText}>{copy.loadError}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={copy.retry}
            onPress={() => void query.refetch()}
            hitSlop={8}
          >
            <Feather name="refresh-cw" size={17} color={colors.primary} />
          </Pressable>
        </View>
      )}
      <Modal
        visible={locked && Boolean(state)}
        animationType="fade"
        presentationStyle="fullScreen"
        onRequestClose={() => undefined}
        statusBarTranslucent
      >
        <View
          style={[
            styles.lockScreen,
            { backgroundColor: colors.background },
          ]}
        >
          <View
            style={[
              styles.lockCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                borderRadius: colors.radius + 12,
              },
            ]}
          >
            <View
              style={[
                styles.lockIcon,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Feather name="lock" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.lockEyebrow, { color: colors.primary }]}>
              {copy.activeTimer}
            </Text>
            <Text
              style={[styles.lockTitle, { color: colors.foreground }]}
              accessibilityRole="header"
            >
              {copy.locked}
            </Text>
            <Text
              style={[
                styles.bodyText,
                { color: colors.mutedForeground },
              ]}
            >
              {copy.lockedHelp}
            </Text>
            <View
              style={[
                styles.usageDisplay,
                { backgroundColor: colors.secondary },
              ]}
            >
              <Text
                style={[
                  styles.smallLabel,
                  { color: colors.mutedForeground },
                ]}
              >
                {copy.usedToday}
              </Text>
              <Text
                style={[
                  styles.timer,
                  { color: colors.foreground },
                ]}
              >
                {formatDailyUsageClock(state?.usedSeconds ?? 0)} /{' '}
                {formatDailyUsageClock(state?.effectiveLimitSeconds ?? 0)}
              </Text>
            </View>
            <Text style={[styles.smallLabel, { color: colors.foreground }]}>
              {copy.pinInput}
            </Text>
            <TextInput
              value={pin}
              onChangeText={(value) =>
                setPin(value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="••••"
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              maxLength={4}
              style={[
                styles.input,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.input,
                  color: colors.foreground,
                  borderRadius: colors.radius,
                },
              ]}
              accessibilityLabel={copy.pinInput}
              testID="active-time-pin"
            />
            {overrideError ? (
              <Text
                style={[styles.errorText, { color: colors.destructive }]}
                accessibilityRole="alert"
              >
                {overrideError}
              </Text>
            ) : null}
            <Pressable
              onPress={() => void applyOverride('extend')}
              disabled={pin.length !== 4 || override.isPending}
              style={({ pressed }) => [
                styles.primaryButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity:
                    pin.length !== 4 || override.isPending
                      ? 0.5
                      : pressed
                        ? 0.78
                        : 1,
                },
              ]}
              accessibilityRole="button"
              testID="active-time-extend"
            >
              {override.isPending ? (
                <ActivityIndicator color={colors.primaryForeground} />
              ) : (
                <>
                  <Feather
                    name="clock"
                    size={17}
                    color={colors.primaryForeground}
                  />
                  <Text
                    style={[
                      styles.primaryButtonText,
                      { color: colors.primaryForeground },
                    ]}
                  >
                    {copy.extend}
                  </Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={() => void applyOverride('reset')}
              disabled={pin.length !== 4 || override.isPending}
              style={({ pressed }) => [
                styles.secondaryButton,
                {
                  borderColor: colors.border,
                  borderRadius: colors.radius,
                  opacity:
                    pin.length !== 4 || override.isPending
                      ? 0.5
                      : pressed
                        ? 0.7
                        : 1,
                },
              ]}
              accessibilityRole="button"
              testID="active-time-reset"
            >
              <Feather name="rotate-ccw" size={16} color={colors.foreground} />
              <Text
                style={[
                  styles.secondaryButtonText,
                  { color: colors.foreground },
                ]}
              >
                {copy.reset}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export function DailyUsageGate({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <>{children}</>;
  return <DailyUsageGateForUser>{children}</DailyUsageGateForUser>;
}

export function DailyUsageSettings() {
  const colors = useColors();
  const timeZone = useMemo(getTimeZone, []);
  const queryClient = useQueryClient();
  const query = useGetActiveTimeLimit({ timeZone });
  const update = useUpdateActiveTimeLimit();
  const setPinMutation = useSetDiaryPin();
  const { signOut } = useClerk();
  const [draft, setDraft] = useState<{
    enabled?: boolean;
    limitSeconds?: number;
    language?: DailyUsageLanguage;
  }>({});
  const [pin, setPin] = useState('');
  const [message, setMessage] = useState('');
  const state = query.data as ActiveTimeState | undefined;
  const language = draft.language ?? state?.language ?? 'uz';
  const copy = dailyUsageCopy[language];
  const enabled = draft.enabled ?? state?.enabled ?? false;
  const limitSeconds = draft.limitSeconds ?? state?.limitSeconds ?? 7200;
  const queryKey = getGetActiveTimeLimitQueryKey({ timeZone });
  const pending = update.isPending || setPinMutation.isPending;
  const styles = StyleSheet.create({
    card: {
      marginHorizontal: 16,
      marginTop: 18,
      marginBottom: 12,
      padding: 18,
      borderWidth: 1,
      borderRadius: colors.radius + 7,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 11,
    },
    icon: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: colors.radius,
    },
    title: {
      flex: 1,
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      fontSize: 19,
    },
    description: {
      marginTop: 10,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 18,
    },
    metrics: {
      flexDirection: 'row',
      gap: 9,
      marginTop: 16,
    },
    metric: {
      flex: 1,
      padding: 12,
      borderRadius: colors.radius,
    },
    label: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
    },
    metricValue: {
      marginTop: 5,
      color: colors.foreground,
      fontFamily: 'Inter_700Bold',
      fontSize: 18,
      fontVariant: ['tabular-nums'],
    },
    fieldLabel: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
    },
    input: {
      minHeight: 45,
      marginTop: 7,
      paddingHorizontal: 12,
      borderWidth: 1,
      fontFamily: 'Inter_400Regular',
      fontSize: 14,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 18,
      paddingVertical: 7,
    },
    optionRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    languageChip: {
      minWidth: 48,
      minHeight: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      paddingHorizontal: 12,
    },
    button: {
      minHeight: 44,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: 14,
      marginTop: 15,
    },
    buttonText: {
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
    },
    secondaryButton: {
      minHeight: 44,
      marginTop: 9,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      borderWidth: 1,
      paddingHorizontal: 12,
    },
    divider: {
      height: 1,
      marginTop: 17,
      marginBottom: 15,
    },
    hint: {
      marginTop: 6,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      lineHeight: 16,
    },
    error: {
      marginTop: 11,
      color: colors.destructive,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      lineHeight: 17,
    },
    notice: {
      marginTop: 11,
      color: colors.accentForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      lineHeight: 17,
    },
  });

  const saveLimit = async () => {
    if (!state) return;
    setMessage('');
    try {
      const result = await update.mutateAsync({
        data: { enabled, limitSeconds, language, timeZone },
      });
      queryClient.setQueryData(queryKey, result);
      setDraft({});
      setMessage(copy.save);
    } catch {
      setMessage(copy.saveError);
    }
  };

  const savePin = async () => {
    if (!/^\d{4}$/.test(pin)) {
      setMessage(copy.pinRequired);
      return;
    }
    setMessage('');
    try {
      await setPinMutation.mutateAsync({ data: { pin } });
      const result = await query.refetch();
      if (result.data) queryClient.setQueryData(queryKey, result.data);
      setPin('');
      setMessage(copy.pinSet);
    } catch {
      setMessage(copy.saveError);
    }
  };

  if (query.isLoading || !state) {
    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.row}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.title}>{copy.title}</Text>
        </View>
        {query.isError ? (
          <>
            <Text style={styles.error}>{copy.loadError}</Text>
            <Pressable
              onPress={() => void query.refetch()}
              accessibilityRole="button"
              style={[
                styles.button,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
            >
              <Text
                style={[styles.buttonText, { color: colors.primaryForeground }]}
              >
                {copy.retry}
              </Text>
            </Pressable>
          </>
        ) : null}
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.row}>
        <View
          style={[
            styles.icon,
            { backgroundColor: colors.secondary },
          ]}
        >
          <Feather name="clock" size={19} color={colors.primary} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
      </View>
      <Text style={styles.description}>{copy.description}</Text>
      <View style={styles.metrics}>
        <View style={[styles.metric, { backgroundColor: colors.background }]}>
          <Text style={styles.label}>{copy.usedToday}</Text>
          <Text style={styles.metricValue}>
            {formatDailyUsageClock(state.usedSeconds)}
          </Text>
        </View>
        <View style={[styles.metric, { backgroundColor: colors.background }]}>
          <Text style={styles.label}>{copy.remaining}</Text>
          <Text style={styles.metricValue}>
            {state.enabled
              ? formatDailyUsageClock(state.remainingSeconds)
              : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.fieldLabel}>{copy.enabled}</Text>
        <Switch
          value={enabled}
          onValueChange={(value) =>
            setDraft((current) => ({ ...current, enabled: value }))
          }
          disabled={!state.pinEnabled || pending}
          thumbColor={enabled ? colors.primaryForeground : colors.mutedForeground}
          trackColor={{ false: colors.border, true: colors.primary }}
          accessibilityLabel={copy.enabled}
          testID="active-time-enabled"
        />
      </View>
      {!state.pinEnabled ? (
        <Text style={styles.hint}>{copy.pinRequired}</Text>
      ) : null}

      <Text style={[styles.fieldLabel, { marginTop: 13 }]}>
        {copy.dailyLimit}
      </Text>
      <TextInput
        value={String(Math.round(limitSeconds / 60))}
        onChangeText={(value) => {
          const minutes = Number(value);
          if (Number.isFinite(minutes)) {
            setDraft((current) => ({
              ...current,
              limitSeconds: Math.min(86400, Math.max(900, minutes * 60)),
            }));
          }
        }}
        keyboardType="number-pad"
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
            color: colors.foreground,
            borderRadius: colors.radius,
          },
        ]}
        accessibilityLabel={copy.dailyLimit}
        testID="active-time-limit-minutes"
      />
      <Text style={styles.hint}>{copy.limitMinutes}</Text>

      <Text style={[styles.fieldLabel, { marginTop: 15 }]}>
        {copy.language}
      </Text>
      <View style={styles.optionRow} accessibilityRole="radiogroup">
        {dailyUsageLanguages.map((item) => (
          <Pressable
            key={item.value}
            onPress={() =>
              setDraft((current) => ({
                ...current,
                language: item.value,
              }))
            }
            accessibilityRole="radio"
            accessibilityState={{ selected: language === item.value }}
            style={[
              styles.languageChip,
              {
                backgroundColor:
                  language === item.value ? colors.primary : colors.background,
                borderColor:
                  language === item.value ? colors.primary : colors.border,
                borderRadius: colors.radius,
              },
            ]}
            testID={`active-time-language-${item.value}`}
          >
            <Text
              style={[
                styles.buttonText,
                {
                  color:
                    language === item.value
                      ? colors.primaryForeground
                      : colors.foreground,
                },
              ]}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Pressable
        onPress={() => void saveLimit()}
        disabled={pending}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: colors.primary,
            borderRadius: colors.radius,
            opacity: pending ? 0.5 : pressed ? 0.78 : 1,
          },
        ]}
        testID="active-time-save"
      >
        {update.isPending ? (
          <ActivityIndicator size="small" color={colors.primaryForeground} />
        ) : (
          <Feather name="save" size={16} color={colors.primaryForeground} />
        )}
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>
          {update.isPending ? copy.saving : copy.save}
        </Text>
      </Pressable>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />
      <Text style={styles.fieldLabel}>{copy.pinTitle}</Text>
      <Text style={styles.hint}>
        {state.pinEnabled ? copy.pinSet : copy.pinRequired}
      </Text>
      <TextInput
        value={pin}
        onChangeText={(value) => setPin(value.replace(/\D/g, '').slice(0, 4))}
        keyboardType="number-pad"
        secureTextEntry
        maxLength={4}
        placeholder="••••"
        placeholderTextColor={colors.mutedForeground}
        style={[
          styles.input,
          {
            backgroundColor: colors.background,
            borderColor: colors.input,
            color: colors.foreground,
            borderRadius: colors.radius,
          },
        ]}
        accessibilityLabel={copy.pinInput}
        testID="active-time-pin-setup"
      />
      <Pressable
        onPress={() => void savePin()}
        disabled={pin.length !== 4 || pending}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.secondaryButton,
          {
            borderColor: colors.border,
            borderRadius: colors.radius,
            opacity: pin.length !== 4 || pending ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}
        testID="active-time-pin-save"
      >
        {setPinMutation.isPending ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Feather name="shield" size={16} color={colors.primary} />
        )}
        <Text style={[styles.buttonText, { color: colors.foreground }]}>
          {state.pinEnabled ? copy.updatePin : copy.setPin}
        </Text>
      </Pressable>
      <Pressable
        onPress={() => void signOut()}
        accessibilityRole="button"
        style={[styles.secondaryButton, { borderColor: colors.border }]}
      >
        <Feather name="log-out" size={16} color={colors.mutedForeground} />
        <Text
          style={[
            styles.buttonText,
            { color: colors.mutedForeground },
          ]}
        >
          {copy.signOut}
        </Text>
      </Pressable>
      {message ? (
        <Text
          style={[
            message === copy.saveError || message === copy.pinRequired
              ? styles.error
              : styles.notice,
          ]}
          accessibilityLiveRegion="polite"
        >
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lockScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 30,
  },
  lockCard: {
    width: '100%',
    maxWidth: 480,
    padding: 24,
    borderWidth: 1,
  },
  lockIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  lockEyebrow: {
    marginTop: 20,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  lockTitle: {
    marginTop: 8,
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    lineHeight: 33,
  },
  bodyText: {
    marginTop: 8,
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    lineHeight: 21,
  },
  usageDisplay: {
    marginTop: 18,
    marginBottom: 20,
    padding: 14,
    borderRadius: 14,
  },
  smallLabel: {
    marginTop: 8,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  timer: {
    marginTop: 5,
    fontFamily: 'Inter_700Bold',
    fontSize: 21,
    fontVariant: ['tabular-nums'],
  },
  input: {
    minHeight: 46,
    marginTop: 8,
    paddingHorizontal: 13,
    borderWidth: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    letterSpacing: 3,
  },
  errorText: {
    marginTop: 9,
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    lineHeight: 17,
  },
  primaryButton: {
    minHeight: 48,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
  },
  primaryButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  secondaryButton: {
    minHeight: 44,
    marginTop: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  secondaryButtonText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
});