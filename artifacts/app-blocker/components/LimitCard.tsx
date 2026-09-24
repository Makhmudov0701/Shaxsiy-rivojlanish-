import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { AppLimit } from '@/lib/app-blocker-native';

type Props = {
  limit: AppLimit;
  usedMillis: number;
  onEdit: () => void;
  onDelete: () => void;
};

function clock(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return [hours, minutes, remainingSeconds]
    .map((value) => String(value).padStart(2, '0'))
    .join(':');
}

export function LimitCard({ limit, usedMillis, onEdit, onDelete }: Props) {
  const colors = useColors();
  const totalSeconds = limit.limitMinutes * 60;
  const usedSeconds = Math.floor(usedMillis / 1000);
  const remainingSeconds = Math.max(0, totalSeconds - usedSeconds);
  const progress = Math.min(1, usedMillis / (totalSeconds * 1000));
  const finished = remainingSeconds === 0;
  const usedHours = Math.floor(usedSeconds / 3600);
  const usedMinutes = Math.floor((usedSeconds % 3600) / 60);
  const usedLabel =
    usedHours > 0
      ? `${usedHours} soat ${usedMinutes} daq`
      : `${usedMinutes} daq`;
  const limitHours = Math.floor(limit.limitMinutes / 60);
  const limitRemainder = limit.limitMinutes % 60;
  const limitLabel =
    limitHours > 0
      ? `${limitHours} soat${limitRemainder ? ` ${limitRemainder} daq` : ''}`
      : `${limitRemainder} daq`;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.topRow}>
        <View style={[styles.appMark, { backgroundColor: colors.secondary }]}>
          <Text style={[styles.appInitial, { color: colors.primary }]}>
            {limit.appName.trim().slice(0, 1).toLocaleUpperCase() || 'I'}
          </Text>
        </View>
        <View style={styles.titleBlock}>
          <Text
            numberOfLines={1}
            style={[styles.appName, { color: colors.foreground }]}
          >
            {limit.appName}
          </Text>
          <Text style={[styles.packageName, { color: colors.mutedForeground }]}>
            {usedLabel} / {limitLabel}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${limit.appName} limitini tahrirlash`}
          onPress={onEdit}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          testID={`edit-limit-${limit.packageName}`}
        >
          <Feather name="sliders" size={18} color={colors.mutedForeground} />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${limit.appName} limitini o‘chirish`}
          onPress={onDelete}
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          testID={`delete-limit-${limit.packageName}`}
        >
          <Feather name="trash-2" size={17} color={colors.destructive} />
        </Pressable>
      </View>

      <View
        accessibilityRole="progressbar"
        accessibilityLabel={`${limit.appName}: ${usedLabel}, limit ${limitLabel}`}
        accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
        style={[styles.track, { backgroundColor: colors.muted }]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${progress * 100}%`,
              backgroundColor: finished ? colors.destructive : colors.accent,
            },
          ]}
        />
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.usedText, { color: colors.mutedForeground }]}>
          {finished ? 'Bugungi limit tugadi' : 'Qolgan vaqt'}
        </Text>
        <Text
          style={[
            styles.remaining,
            { color: finished ? colors.destructive : colors.foreground },
          ]}
          testID={`remaining-${limit.packageName}`}
        >
          {finished ? '00:00:00' : clock(remainingSeconds)}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 15,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  appMark: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appInitial: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  appName: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  packageName: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  iconButton: {
    width: 34,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.55,
  },
  track: {
    height: 7,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  usedText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  remaining: {
    fontSize: 13,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
});