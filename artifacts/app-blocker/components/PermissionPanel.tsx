import { Feather } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

type Props = {
  usageGranted: boolean;
  accessibilityEnabled: boolean;
  onUsagePress: () => void;
  onAccessibilityPress: () => void;
};

function PermissionRow({
  title,
  detail,
  granted,
  buttonLabel,
  onPress,
}: {
  title: string;
  detail: string;
  granted: boolean;
  buttonLabel: string;
  onPress: () => void;
}) {
  const colors = useColors();

  return (
    <View style={[styles.row, { borderTopColor: colors.border }]}>
      <View
        style={[
          styles.statusMark,
          { backgroundColor: granted ? colors.accent : colors.secondary },
        ]}
      >
        <Feather
          name={granted ? 'check' : 'lock'}
          size={15}
          color={granted ? colors.accentForeground : colors.primary}
        />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]}>
          {title}
        </Text>
        <Text style={[styles.detail, { color: colors.mutedForeground }]}>
          {granted ? 'Ruxsat berildi' : detail}
        </Text>
      </View>
      {!granted && (
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => [
            styles.rowAction,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
          testID={`permission-${title}`}
        >
          <Text
            numberOfLines={1}
            style={[styles.rowActionText, { color: colors.primaryForeground }]}
          >
            {buttonLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

export function PermissionPanel({
  usageGranted,
  accessibilityEnabled,
  onUsagePress,
  onAccessibilityPress,
}: Props) {
  const colors = useColors();
  const ready = usageGranted && accessibilityEnabled;

  return (
    <View
      style={[
        styles.panel,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.heading}>
        <View
          style={[
            styles.shield,
            { backgroundColor: ready ? colors.accent : colors.secondary },
          ]}
        >
          <Feather
            name={ready ? 'shield' : 'shield-off'}
            size={19}
            color={ready ? colors.accentForeground : colors.primary}
          />
        </View>
        <View style={styles.headingCopy}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            {ready ? 'Himoya faol' : 'Himoyani sozlang'}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {ready
              ? 'Limit tugasa, tanlangan ilova bloklanadi.'
              : 'Ilova vaqtini hisoblash va bloklash uchun ikki ruxsat kerak.'}
          </Text>
        </View>
      </View>

      <PermissionRow
        title="Foydalanish vaqti"
        detail="Kunlik vaqtni hisoblash uchun"
        granted={usageGranted}
        buttonLabel="Ruxsat"
        onPress={onUsagePress}
      />
      <PermissionRow
        title="Ilova bloklash xizmati"
        detail="Limit tugaganda blok ekranini ko‘rsatish uchun"
        granted={accessibilityEnabled}
        buttonLabel="Yoqish"
        onPress={onAccessibilityPress}
      />

      <Text style={[styles.privacy, { color: colors.mutedForeground }]}>
        Faqat ilova nomi va ishlatilgan vaqt qayd qilinadi. Matn va
        yozishmalar o‘qilmaydi; ma’lumotlar qurilmangizda saqlanadi.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    borderWidth: 1,
    borderRadius: 20,
    padding: 17,
    gap: 14,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 2,
  },
  shield: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headingCopy: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  subtitle: {
    fontSize: 12,
    lineHeight: 17,
    fontFamily: 'Inter_400Regular',
  },
  row: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusMark: {
    width: 30,
    height: 30,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  rowTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  detail: {
    fontSize: 11,
    lineHeight: 15,
    fontFamily: 'Inter_400Regular',
  },
  rowAction: {
    minWidth: 68,
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowActionText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  privacy: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 1,
    fontFamily: 'Inter_400Regular',
  },
  pressed: {
    opacity: 0.7,
  },
});