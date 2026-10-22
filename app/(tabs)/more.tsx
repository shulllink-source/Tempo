import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { ScreenHeader } from '../../src/components/ScreenHeader';
import { useTheme } from '../../src/theme';

const items = [
  { route: '/notes', title: 'Notes', subtitle: 'Capturez une idée', icon: 'create-outline' },
  { route: '/agenda', title: 'Agenda', subtitle: 'Jour, semaine, mois', icon: 'calendar-outline' },
  { route: '/music', title: 'Musique', subtitle: 'Votre bibliothèque audio', icon: 'musical-notes-outline' },
  { route: '/stats', title: 'Statistiques', subtitle: 'Vos tendances', icon: 'stats-chart-outline' },
  { route: '/settings', title: 'Réglages', subtitle: 'Thème et préférences', icon: 'settings-outline' },
] as const;

export default function More() {
  const { colors } = useTheme();

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="Plus" subtitle="Tout Tempo au même endroit." />
      <ScrollView contentContainerStyle={styles.list}>
        {items.map(({ route, title, subtitle, icon }) => (
          <Pressable
            key={route}
            onPress={() => router.push(route as never)}
            style={[styles.row, { backgroundColor: colors.card, borderColor: colors.line }]}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.accent + '22' }]}>
              <Text style={{ color: colors.accent, fontSize: 22 }}>{icon === 'create-outline' ? '✎' : icon === 'calendar-outline' ? '🗓' : icon === 'musical-notes-outline' ? '♫' : icon === 'stats-chart-outline' ? '▣' : '⚙'}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
              <Text style={{ color: colors.muted }}>{subtitle}</Text>
            </View>
            <Text style={{ color: colors.accent, fontSize: 24 }}>›</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  list: { padding: 16, gap: 12, paddingBottom: 32 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
});
