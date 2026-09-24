import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  AppState,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { DailyUsageSettings } from '@/components/daily-usage-limit';
import { LimitCard } from '@/components/LimitCard';
import { PermissionPanel } from '@/components/PermissionPanel';
import { useColors } from '@/hooks/useColors';
import {
  appBlockerNative,
  type AppLimit,
  type InstalledApp,
  type UsageSnapshot,
} from '@/lib/app-blocker-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Screen = 'home' | 'picker' | 'editor';

const EMPTY_USAGE: UsageSnapshot = {
  day: '',
  usageMillis: {},
  blockedPackages: [],
  activePackage: '',
  serviceConnected: false,
};

function formatDuration(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  if (hours > 0) return `${hours} soat ${minutes} daq`;
  return `${minutes} daq`;
}

function limitLabel(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  if (hours > 0) {
    return remainder > 0 ? `${hours} soat ${remainder} daq` : `${hours} soat`;
  }
  return `${remainder} daq`;
}

function NativeUnavailable({ colors }: { colors: ReturnType<typeof useColors> }) {
  const isAndroid = Platform.OS === 'android';

  return (
    <View
      style={[
        styles.unavailable,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={[styles.unavailableIcon, { backgroundColor: colors.secondary }]}>
        <Feather
          name={isAndroid ? 'download' : 'smartphone'}
          size={22}
          color={colors.primary}
        />
      </View>
      <Text style={[styles.unavailableTitle, { color: colors.foreground }]}>
        {isAndroid ? 'Android build kerak' : 'Android qurilmasi kerak'}
      </Text>
      <Text style={[styles.unavailableText, { color: colors.mutedForeground }]}>
        {isAndroid
          ? 'Bu versiyada Android kuzatuv xizmati topilmadi. Expo Go boshqa ilovalarning vaqtini kuzata olmaydi. Native modul qo‘shilgan Android buildni o‘rnating.'
          : 'Ilovalar ro‘yxati, vaqt hisobi va bloklash faqat Android qurilmada ishlaydi. Bu oynada sinov ma’lumotlari ko‘rsatilmaydi.'}
      </Text>
    </View>
  );
}

export default function AppBlockerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [screen, setScreen] = useState<Screen>('home');
  const [apps, setApps] = useState<InstalledApp[]>([]);
  const [limits, setLimits] = useState<AppLimit[]>([]);
  const [usage, setUsage] = useState<UsageSnapshot>(EMPTY_USAGE);
  const [usageGranted, setUsageGranted] = useState(false);
  const [accessibilityEnabled, setAccessibilityEnabled] = useState(false);
  const [selectedApp, setSelectedApp] = useState<InstalledApp | null>(null);
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('30');
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const contentTop = insets.top + (Platform.OS === 'web' ? 67 : 14);
  const contentBottom = insets.bottom + (Platform.OS === 'web' ? 34 : 28);

  const refresh = useCallback(async () => {
    if (!appBlockerNative) {
      setLoading(false);
      return;
    }

    try {
      const [installedApps, savedLimits, hasUsage, hasAccessibility, snapshot] =
        await Promise.all([
          appBlockerNative.getAppsAsync(),
          appBlockerNative.getLimitsAsync(),
          appBlockerNative.hasUsageAccessAsync(),
          appBlockerNative.isAccessibilityServiceEnabledAsync(),
          appBlockerNative.getUsageSnapshotAsync(),
        ]);
      setApps(installedApps);
      setLimits(savedLimits);
      setUsageGranted(hasUsage);
      setAccessibilityEnabled(hasAccessibility);
      setUsage(snapshot);
      setError(null);
    } catch {
      setError('Ma’lumotlarni yuklab bo‘lmadi. Yana urinib ko‘ring.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshUsage = useCallback(async () => {
    if (!appBlockerNative) return;
    try {
      setUsage(await appBlockerNative.getUsageSnapshotAsync());
    } catch {
      // Keep the last successful snapshot visible until the next refresh.
    }
  }, []);

  useEffect(() => {
    void refresh();
    if (!appBlockerNative) return;

    const timer = setInterval(() => {
      void refreshUsage();
    }, 1000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });

    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [refresh, refreshUsage]);

  const activeLimit = useMemo(
    () => limits.find((item) => item.packageName === selectedApp?.packageName),
    [limits, selectedApp],
  );
  const totalUsedMillis = limits.reduce(
    (total, item) => total + (usage.usageMillis[item.packageName] ?? 0),
    0,
  );
  const usedApps = limits.filter(
    (item) => (usage.usageMillis[item.packageName] ?? 0) > 0,
  ).length;
  const filteredApps = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return apps.filter((app) => {
      const alreadyLimited = limits.some(
        (item) => item.packageName === app.packageName,
      );
      const isCurrentEdit = activeLimit?.packageName === app.packageName;
      const matches =
        !query ||
        app.appName.toLocaleLowerCase().includes(query) ||
        app.packageName.toLocaleLowerCase().includes(query);
      return (!alreadyLimited || isCurrentEdit) && matches;
    });
  }, [activeLimit, apps, limits, search]);

  const saveLimits = useCallback(
    async (nextLimits: AppLimit[]) => {
      if (!appBlockerNative) return;
      setSaving(true);
      try {
        await appBlockerNative.saveLimitsAsync(JSON.stringify(nextLimits));
        setLimits(nextLimits);
        setScreen('home');
        setSelectedApp(null);
        setSearch('');
        Keyboard.dismiss();
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        await refresh();
      } catch {
        setError('Limitni saqlab bo‘lmadi. Yana urinib ko‘ring.');
      } finally {
        setSaving(false);
      }
    },
    [refresh],
  );

  const beginNewLimit = () => {
    setSelectedApp(null);
    setHours('0');
    setMinutes('30');
    setSearch('');
    setScreen('picker');
  };

  const beginEdit = (limit: AppLimit) => {
    const app =
      apps.find((item) => item.packageName === limit.packageName) ?? {
        packageName: limit.packageName,
        appName: limit.appName,
      };
    setSelectedApp(app);
    setHours(String(Math.floor(limit.limitMinutes / 60)));
    setMinutes(String(limit.limitMinutes % 60));
    setScreen('editor');
  };

  const chooseApp = (app: InstalledApp) => {
    setSelectedApp(app);
    setHours('0');
    setMinutes('30');
    setScreen('editor');
  };

  const openUsageSettings = async () => {
    if (!appBlockerNative) return;
    try {
      await appBlockerNative.openUsageAccessSettingsAsync();
    } catch {
      setError('Foydalanish ruxsati sozlamalarini ochib bo‘lmadi.');
    }
  };

  const openAccessibilitySettings = async () => {
    if (!appBlockerNative) return;
    try {
      await appBlockerNative.openAccessibilitySettingsAsync();
    } catch {
      setError('Maxsus imkoniyatlar sozlamalarini ochib bo‘lmadi.');
    }
  };

  const deleteLimit = (limit: AppLimit) => {
    Alert.alert(
      'Limitni o‘chirasizmi?',
      `${limit.appName} uchun kunlik chegara bekor qilinadi.`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O‘chirish',
          style: 'destructive',
          onPress: () => {
            void saveLimits(
              limits.filter((item) => item.packageName !== limit.packageName),
            );
          },
        },
      ],
    );
  };

  const saveEditor = () => {
    if (!selectedApp) return;
    const hoursValue = Number.parseInt(hours || '0', 10);
    const minutesValue = Number.parseInt(minutes || '0', 10);
    const totalMinutes = hoursValue * 60 + minutesValue;
    if (
      !Number.isFinite(totalMinutes) ||
      hoursValue < 0 ||
      hoursValue > 24 ||
      minutesValue < 0 ||
      minutesValue > 59 ||
      totalMinutes < 1 ||
      totalMinutes > 1440
    ) {
      setError('Limit 1 daqiqadan 24 soatgacha bo‘lishi kerak.');
      return;
    }

    const nextLimit: AppLimit = {
      packageName: selectedApp.packageName,
      appName: selectedApp.appName,
      limitMinutes: totalMinutes,
    };
    const nextLimits = [
      ...limits.filter((item) => item.packageName !== nextLimit.packageName),
      nextLimit,
    ];
    setError(null);
    void saveLimits(nextLimits);
  };

  const handleHourChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 2);
    setHours(digits);
  };

  const handleMinuteChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 2);
    setMinutes(digits);
  };

  const isDark = colors.background === '#1c1528';

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <KeyboardAwareScrollViewCompat
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: contentTop, paddingBottom: contentBottom },
        ]}
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        showsVerticalScrollIndicator={false}
      >
        {screen === 'home' ? (
          <>
            <View style={styles.header}>
              <View>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                  KUNLIK CHEGARA
                </Text>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Ilovalar vaqti
                </Text>
              </View>
              <View style={[styles.dateBadge, { backgroundColor: colors.card }]}>
                <Feather name="sun" size={15} color={colors.primary} />
                <Text style={[styles.dateText, { color: colors.foreground }]}>
                  {new Date().toLocaleDateString('uz-UZ', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>
              </View>
            </View>

            <Text style={[styles.intro, { color: colors.mutedForeground }]}>
              Tanlangan ilovalarga vaqt belgilang. Chegara tugasa, ilova
              bloklanadi; hisob har kuni 00:00 da yangilanadi.
            </Text>

            <DailyUsageSettings />

            {!appBlockerNative ? (
              <NativeUnavailable colors={colors} />
            ) : (
              <>
                <View
                  style={[
                    styles.summary,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <View style={styles.summaryTop}>
                    <View style={styles.summaryLabelRow}>
                      <Feather
                        name="activity"
                        size={15}
                        color={colors.primaryForeground}
                      />
                      <Text
                        style={[
                          styles.summaryLabel,
                          { color: colors.primaryForeground },
                        ]}
                      >
                        BUGUN SARFLANGAN
                      </Text>
                    </View>
                    <Feather
                      name="moon"
                      size={17}
                      color={colors.primaryForeground}
                      style={{ opacity: 0.78 }}
                    />
                  </View>
                  <Text
                    style={[
                      styles.summaryTime,
                      { color: colors.primaryForeground },
                    ]}
                    testID="total-used-time"
                  >
                    {formatDuration(Math.floor(totalUsedMillis / 1000))}
                  </Text>
                  <View style={styles.summaryBottom}>
                    <Text
                      style={[
                        styles.summaryFoot,
                        { color: colors.primaryForeground },
                      ]}
                    >
                      {limits.length} ta ilova · {usedApps} tasida foydalanildi
                    </Text>
                    <View
                      style={[
                        styles.summaryDot,
                        {
                          backgroundColor:
                            usageGranted && accessibilityEnabled
                              ? colors.accent
                              : colors.destructive,
                        },
                      ]}
                    />
                  </View>
                </View>

                <PermissionPanel
                  usageGranted={usageGranted}
                  accessibilityEnabled={accessibilityEnabled}
                  onUsagePress={() => void openUsageSettings()}
                  onAccessibilityPress={() => void openAccessibilitySettings()}
                />

                <View style={styles.sectionHeader}>
                  <View>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                      Kunlik limitlar
                    </Text>
                    <Text
                      style={[
                        styles.sectionSubtitle,
                        { color: colors.mutedForeground },
                      ]}
                    >
                      Qolgan vaqt har soniyada yangilanadi
                    </Text>
                  </View>
                  {limits.length > 0 && (
                    <Text style={[styles.count, { color: colors.mutedForeground }]}>
                      {String(limits.length).padStart(2, '0')}
                    </Text>
                  )}
                </View>

                {loading ? (
                  <View
                    style={[
                      styles.empty,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      Ilovalar yuklanmoqda…
                    </Text>
                  </View>
                ) : limits.length === 0 ? (
                  <View
                    style={[
                      styles.empty,
                      { backgroundColor: colors.card, borderColor: colors.border },
                    ]}
                  >
                    <View
                      style={[
                        styles.emptyIcon,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Feather name="smartphone" size={20} color={colors.primary} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                      Hali ilova tanlanmagan
                    </Text>
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      Birinchi ilovani qo‘shib, unga kunlik vaqt belgilang.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.limitList}>
                    {limits.map((limit) => (
                      <LimitCard
                        key={limit.packageName}
                        limit={limit}
                        usedMillis={usage.usageMillis[limit.packageName] ?? 0}
                        onEdit={() => beginEdit(limit)}
                        onDelete={() => deleteLimit(limit)}
                      />
                    ))}
                  </View>
                )}

                <Pressable
                  accessibilityRole="button"
                  onPress={beginNewLimit}
                  style={({ pressed }) => [
                    styles.addButton,
                    { backgroundColor: colors.accent },
                    pressed && styles.pressed,
                  ]}
                  testID="add-app-limit"
                >
                  <Feather name="plus" size={19} color={colors.accentForeground} />
                  <Text style={[styles.addButtonText, { color: colors.accentForeground }]}>
                    Ilova qo‘shish
                  </Text>
                  <Feather
                    name="arrow-up-right"
                    size={17}
                    color={colors.accentForeground}
                    style={styles.addTrailing}
                  />
                </Pressable>
              </>
            )}

            {error && (
              <Pressable
                accessibilityRole="button"
                onPress={() => void refresh()}
                style={[
                  styles.errorBox,
                  { backgroundColor: colors.secondary, borderColor: colors.border },
                ]}
                testID="retry-error"
              >
                <Feather name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.foreground }]}>
                  {error} Qayta yuklash uchun bosing.
                </Text>
              </Pressable>
            )}

            {usage.day.length > 0 && appBlockerNative && (
              <Text style={[styles.resetNote, { color: colors.mutedForeground }]}>
                Vaqt {usage.day} kuni mahalliy 00:00 da yangilanadi.
              </Text>
            )}
          </>
        ) : screen === 'picker' ? (
          <>
            <View style={styles.subHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Orqaga"
                onPress={() => {
                  setScreen('home');
                  setSearch('');
                  Keyboard.dismiss();
                }}
                style={styles.backButton}
                testID="back-to-dashboard"
              >
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <View style={styles.subHeaderCopy}>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                  YANGI CHEGARA
                </Text>
                <Text style={[styles.subTitle, { color: colors.foreground }]}>
                  Ilovani tanlang
                </Text>
              </View>
            </View>
            <Text style={[styles.intro, { color: colors.mutedForeground }]}>
              Qurilmangizdagi ochiladigan ilovalar ro‘yxati.
            </Text>
            <View
              style={[
                styles.searchBox,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInput
                accessibilityLabel="Ilovani qidirish"
                autoCapitalize="none"
                onChangeText={setSearch}
                placeholder="Ilova nomini qidiring"
                placeholderTextColor={colors.mutedForeground}
                returnKeyType="search"
                style={[styles.searchInput, { color: colors.foreground }]}
                testID="app-search"
                value={search}
              />
              {search.length > 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Qidiruvni tozalash"
                  onPress={() => setSearch('')}
                  style={styles.clearSearch}
                >
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              )}
            </View>

            {filteredApps.length === 0 ? (
              <View
                style={[
                  styles.empty,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                  {apps.length === 0
                    ? 'Ilovalar topilmadi'
                    : 'Mos ilova topilmadi'}
                </Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  {apps.length === 0
                    ? 'Android qurilmadagi ilovalar ro‘yxatini yangilang.'
                    : 'Boshqa nom bilan qidirib ko‘ring.'}
                </Text>
              </View>
            ) : (
              <View style={styles.appPickerList}>
                {filteredApps.map((app) => (
                  <Pressable
                    key={app.packageName}
                    accessibilityRole="button"
                    onPress={() => chooseApp(app)}
                    style={({ pressed }) => [
                      styles.appPickerRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                      },
                      pressed && styles.pressed,
                    ]}
                    testID={`choose-app-${app.packageName}`}
                  >
                    <View
                      style={[
                        styles.appMark,
                        { backgroundColor: colors.secondary },
                      ]}
                    >
                      <Text style={[styles.appInitial, { color: colors.primary }]}>
                        {app.appName.trim().slice(0, 1).toLocaleUpperCase() || 'I'}
                      </Text>
                    </View>
                    <View style={styles.appPickerCopy}>
                      <Text
                        numberOfLines={1}
                        style={[styles.appPickerName, { color: colors.foreground }]}
                      >
                        {app.appName}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.packageName,
                          { color: colors.mutedForeground },
                        ]}
                      >
                        {app.packageName}
                      </Text>
                    </View>
                    <Feather name="chevron-right" size={19} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        ) : (
          <>
            <View style={styles.subHeader}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Ilovalar ro‘yxatiga qaytish"
                onPress={() => {
                  setScreen(activeLimit ? 'home' : 'picker');
                  Keyboard.dismiss();
                }}
                style={styles.backButton}
                testID="back-from-editor"
              >
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <View style={styles.subHeaderCopy}>
                <Text style={[styles.eyebrow, { color: colors.mutedForeground }]}>
                  KUNLIK CHEGARA
                </Text>
                <Text style={[styles.subTitle, { color: colors.foreground }]}>
                  Vaqtni belgilang
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.selectedApp,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={[styles.appMark, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.appInitial, { color: colors.primary }]}>
                  {selectedApp?.appName.trim().slice(0, 1).toLocaleUpperCase() || 'I'}
                </Text>
              </View>
              <View style={styles.appPickerCopy}>
                <Text style={[styles.appPickerName, { color: colors.foreground }]}>
                  {selectedApp?.appName ?? 'Ilova tanlanmagan'}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[styles.packageName, { color: colors.mutedForeground }]}
                >
                  {selectedApp?.packageName}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.editorCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Kuniga qancha vaqt?
              </Text>
              <Text style={[styles.editorHint, { color: colors.mutedForeground }]}>
                Limit tugashi bilan ushbu ilovaning ekrani bloklanadi.
              </Text>
              <View style={styles.timeFields}>
                <View style={styles.timeField}>
                  <TextInput
                    accessibilityLabel="Soat"
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={handleHourChange}
                    selectTextOnFocus
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    testID="limit-hours"
                    value={hours}
                  />
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    soat
                  </Text>
                </View>
                <Text style={[styles.timeSeparator, { color: colors.mutedForeground }]}>
                  :
                </Text>
                <View style={styles.timeField}>
                  <TextInput
                    accessibilityLabel="Daqiqa"
                    keyboardType="number-pad"
                    maxLength={2}
                    onChangeText={handleMinuteChange}
                    selectTextOnFocus
                    style={[
                      styles.timeInput,
                      {
                        backgroundColor: colors.background,
                        borderColor: colors.border,
                        color: colors.foreground,
                      },
                    ]}
                    testID="limit-minutes"
                    value={minutes}
                  />
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>
                    daqiqa
                  </Text>
                </View>
              </View>
              <Text style={[styles.editorFootnote, { color: colors.mutedForeground }]}>
                1 daqiqadan 24 soatgacha belgilang.
              </Text>
            </View>

            {activeLimit && (
              <Pressable
                accessibilityRole="button"
                onPress={() => deleteLimit(activeLimit)}
                style={({ pressed }) => [
                  styles.deleteButton,
                  { borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
                testID="delete-current-limit"
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
                <Text style={[styles.deleteText, { color: colors.destructive }]}>
                  Limitni o‘chirish
                </Text>
              </Pressable>
            )}

            {error && (
              <Text style={[styles.formError, { color: colors.destructive }]}>
                {error}
              </Text>
            )}

            <View style={styles.editorActions}>
              <Pressable
                accessibilityRole="button"
                disabled={saving || !selectedApp}
                onPress={saveEditor}
                style={({ pressed }) => [
                  styles.saveButton,
                  { backgroundColor: colors.primary },
                  (pressed || saving) && styles.pressed,
                  (!selectedApp || saving) && styles.disabled,
                ]}
                testID="save-limit"
              >
                <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                  {saving ? 'Saqlanmoqda…' : 'Limitni saqlash'}
                </Text>
                <Feather
                  name="check"
                  size={18}
                  color={colors.primaryForeground}
                />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setScreen(activeLimit ? 'home' : 'picker');
                  Keyboard.dismiss();
                }}
                style={styles.cancelButton}
              >
                <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>
                  Bekor qilish
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    fontSize: 10,
    letterSpacing: 1.6,
    fontFamily: 'Inter_700Bold',
    marginBottom: 6,
  },
  title: {
    fontSize: 29,
    lineHeight: 35,
    letterSpacing: -0.9,
    fontFamily: 'Inter_700Bold',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 14,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  dateText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  intro: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: -7,
    fontFamily: 'Inter_400Regular',
  },
  summary: {
    borderRadius: 22,
    padding: 19,
    gap: 12,
    overflow: 'hidden',
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryLabel: {
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: 'Inter_700Bold',
    opacity: 0.82,
  },
  summaryTime: {
    fontSize: 33,
    letterSpacing: -0.8,
    fontFamily: 'Inter_700Bold',
  },
  summaryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryFoot: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    opacity: 0.82,
  },
  summaryDot: {
    height: 8,
    width: 8,
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    letterSpacing: -0.25,
    fontFamily: 'Inter_700Bold',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'Inter_400Regular',
  },
  count: {
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    fontFamily: 'Inter_600SemiBold',
  },
  limitList: {
    gap: 11,
  },
  empty: {
    minHeight: 150,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyIcon: {
    height: 42,
    width: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
  addButton: {
    minHeight: 55,
    borderRadius: 17,
    paddingHorizontal: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  addButtonText: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  addTrailing: {
    opacity: 0.78,
  },
  pressed: {
    opacity: 0.7,
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_500Medium',
  },
  resetNote: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: -5,
    fontFamily: 'Inter_400Regular',
  },
  unavailable: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    gap: 9,
  },
  unavailableIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  unavailableTitle: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  unavailableText: {
    fontSize: 13,
    lineHeight: 19,
    fontFamily: 'Inter_400Regular',
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subHeaderCopy: {
    flex: 1,
  },
  subTitle: {
    fontSize: 24,
    letterSpacing: -0.6,
    fontFamily: 'Inter_700Bold',
  },
  searchBox: {
    minHeight: 49,
    borderWidth: 1,
    borderRadius: 15,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  clearSearch: {
    width: 28,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appPickerList: {
    gap: 8,
  },
  appPickerRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    gap: 11,
  },
  appPickerCopy: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  appPickerName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  appMark: {
    height: 42,
    width: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInitial: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  packageName: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  selectedApp: {
    minHeight: 69,
    borderWidth: 1,
    borderRadius: 17,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  editorCard: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
    gap: 8,
  },
  editorHint: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Inter_400Regular',
  },
  timeFields: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 15,
    paddingVertical: 14,
  },
  timeField: {
    alignItems: 'center',
    gap: 7,
  },
  timeInput: {
    width: 88,
    height: 66,
    borderWidth: 1,
    borderRadius: 17,
    textAlign: 'center',
    fontSize: 28,
    fontVariant: ['tabular-nums'],
    fontFamily: 'Inter_700Bold',
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  timeSeparator: {
    fontSize: 23,
    fontFamily: 'Inter_600SemiBold',
    marginTop: -23,
  },
  editorFootnote: {
    textAlign: 'center',
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  deleteButton: {
    height: 46,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  formError: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  editorActions: {
    gap: 8,
    marginTop: 3,
  },
  saveButton: {
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 17,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  disabled: {
    opacity: 0.55,
  },
  cancelButton: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
});