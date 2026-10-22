import { View, Text, Pressable, StyleSheet, ScrollView, TextInput } from 'react-native';
import { useMemo, useState } from 'react';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useTheme } from '../src/theme';
import { useAgenda } from '../src/stores/useAgenda';
import { AgendaRecurrence } from '../src/types';

const todayIso = () => new Date().toISOString().slice(0, 10);
const recurrenceOptions: AgendaRecurrence[] = ['once', 'weekly', 'monthly'];

export default function Agenda() {
  const { colors } = useTheme();
  const { events, addEvent, deleteEvent, getOccurrences } = useAgenda();
  const [draft, setDraft] = useState({
    title: '',
    date: todayIso(),
    time: '09:00',
    notes: '',
    location: '',
    color: '#e8b04b',
    recurrence: 'once' as AgendaRecurrence,
    allDay: false,
  });

  const upcoming = useMemo(() => getOccurrences(12), [events, getOccurrences]);

  const submit = () => {
    if (!draft.title.trim()) {
      return;
    }

    addEvent({
      title: draft.title.trim(),
      date: draft.date,
      time: draft.allDay ? '00:00' : draft.time,
      notes: draft.notes,
      location: draft.location,
      color: draft.color,
      recurrence: draft.recurrence,
      allDay: draft.allDay,
    });

    setDraft({
      title: '',
      date: todayIso(),
      time: '09:00',
      notes: '',
      location: '',
      color: '#e8b04b',
      recurrence: 'once',
      allDay: false,
    });
  };

  return (
    <View style={[styles.page, { backgroundColor: colors.bg }]}>
      <ScreenHeader title="Agenda" subtitle="Planifiez votre semaine." />

      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ajouter un évènement</Text>

          <TextInput
            value={draft.title}
            onChangeText={(value) => setDraft((current) => ({ ...current, title: value }))}
            placeholder="Titre"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]}
          />

          <View style={styles.row}>
            <TextInput
              value={draft.date}
              onChangeText={(value) => setDraft((current) => ({ ...current, date: value }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.muted}
              style={[styles.input, { flex: 1, color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]}
            />
            {!draft.allDay && (
              <TextInput
                value={draft.time}
                onChangeText={(value) => setDraft((current) => ({ ...current, time: value }))}
                placeholder="09:00"
                placeholderTextColor={colors.muted}
                style={[styles.input, { width: 100, color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]}
              />
            )}
          </View>

          <TextInput
            value={draft.location}
            onChangeText={(value) => setDraft((current) => ({ ...current, location: value }))}
            placeholder="Lieu (facultatif)"
            placeholderTextColor={colors.muted}
            style={[styles.input, { color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]}
          />

          <TextInput
            value={draft.notes}
            multiline
            onChangeText={(value) => setDraft((current) => ({ ...current, notes: value }))}
            placeholder="Notes"
            placeholderTextColor={colors.muted}
            style={[styles.textArea, { color: colors.text, borderColor: colors.line, backgroundColor: colors.bg }]}
          />

          <View style={styles.rowWrap}>
            {recurrenceOptions.map((option) => (
              <Pressable
                key={option}
                onPress={() => setDraft((current) => ({ ...current, recurrence: option }))}
                style={[
                  styles.pill,
                  { borderColor: colors.line, backgroundColor: draft.recurrence === option ? colors.accent : colors.bg },
                ]}
              >
                <Text style={{ color: draft.recurrence === option ? colors.onAccent : colors.text, fontWeight: '700' }}>
                  {option === 'once' ? 'Ponctuel' : option === 'weekly' ? 'Hebdo' : 'Mensuel'}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.colorRow, { gap: 8 }]}>
            {['#e8b04b', '#73a7ff', '#64d69a', '#f47d72', '#e58aa5', '#b79ad6'].map((value) => (
              <Pressable
                key={value}
                onPress={() => setDraft((current) => ({ ...current, color: value }))}
                style={[
                  styles.swatch,
                  {
                    backgroundColor: value,
                    borderWidth: draft.color === value ? 3 : 0,
                    borderColor: colors.text,
                  },
                ]}
              />
            ))}
          </View>

          <Pressable
            onPress={() => setDraft((current) => ({ ...current, allDay: !current.allDay }))}
            style={styles.checkRow}
          >
            <Text style={{ color: colors.text, flex: 1 }}>Évènement toute la journée</Text>
            <Text style={{ color: colors.accent, fontWeight: '800' }}>{draft.allDay ? 'Oui' : 'Non'}</Text>
          </Pressable>

          <Pressable onPress={submit} style={[styles.primaryButton, { backgroundColor: colors.accent }]}>
            <Text style={{ color: colors.onAccent, fontWeight: '800' }}>Ajouter</Text>
          </Pressable>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.line }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Évènements à venir</Text>

          {upcoming.length === 0 ? (
            <Text style={{ color: colors.muted }}>Aucun évènement pour le moment.</Text>
          ) : (
            upcoming.map((event) => (
              <View key={event.occurrenceId} style={[styles.eventRow, { borderColor: colors.line }]}>
                <View style={[styles.badge, { backgroundColor: event.color || colors.accent }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.eventTitle, { color: colors.text }]}>{event.title}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {new Date(event.occurrenceStart).toLocaleString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {event.location ? (
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{event.location}</Text>
                  ) : null}
                </View>
                <Pressable onPress={() => deleteEvent(event.id)}>
                  <Text style={{ color: colors.red, fontWeight: '700' }}>Supprimer</Text>
                </Pressable>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  card: { marginHorizontal: 16, marginTop: 12, borderRadius: 20, borderWidth: 1, padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', marginBottom: 12 },
  row: { flexDirection: 'row', gap: 8 },
  rowWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, fontSize: 15 },
  textArea: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 72, marginBottom: 8, fontSize: 15 },
  pill: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  colorRow: { flexDirection: 'row', marginVertical: 10 },
  swatch: { width: 28, height: 28, borderRadius: 14 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 8 },
  primaryButton: { paddingVertical: 14, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  eventRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderBottomWidth: 1 },
  eventTitle: { fontSize: 16, fontWeight: '700' },
  badge: { width: 12, height: 12, borderRadius: 6 },
});
