import { View, Text, StyleSheet, Pressable, TextInput, FlatList, ScrollView } from 'react-native';
import { useEffect, useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMusic } from '../src/stores/useMusic';
import { ScreenHeader } from '../src/components/ScreenHeader';
import { useTheme } from '../src/theme';

const fmt = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const fallbackColor = (label: string) => {
  const palette = ['#7c3aed', '#f97316', '#06b6d4', '#22c55e', '#ec4899', '#f59e0b', '#4f46e5'];
  let hash = 0;
  for (let i = 0; i < label.length; i += 1) hash = label.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
};

const getCoverLabel = (name?: string) => {
  const base = (name ?? 'Tempo').replace(/\.[^.]+$/, '').trim();
  if (!base) return 'T';
  return base.slice(0, 2).toUpperCase();
};

const getTrackTitle = (track: any) => (track?.filename || 'Piste audio').replace(/\.[^.]+$/, '');

function TrackRow({
  item,
  isCurrent,
  onPress,
  onPlay,
}: {
  item: any;
  isCurrent: boolean;
  onPress: () => void;
  onPlay: () => void;
}) {
  const { colors } = useTheme();
  const title = getTrackTitle(item);
  const tint = fallbackColor(title);

  return (
    <Pressable onPress={onPress} style={[styles.trackRow, { backgroundColor: colors.card, borderColor: isCurrent ? colors.accent : colors.line }]}> 
      <Pressable onPress={onPlay} style={[styles.trackArt, { backgroundColor: tint }]}>
        <Text style={styles.trackArtText}>{getCoverLabel(title)}</Text>
      </Pressable>

      <View style={styles.trackInfo}>
        <Text style={[styles.trackTitle, { color: colors.text }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.trackMeta, { color: colors.muted }]}>Musique locale · {fmt(item.duration || 0)}</Text>
      </View>

      <View style={styles.trackRight}>
        <Text style={[styles.trackCount, { color: colors.muted }]}>
          {isCurrent ? 'En cours' : `${Math.max(0, (item?.id || '').length % 9) + 1}`}
        </Text>
        <Ionicons name={isCurrent ? 'radio' : 'play'} size={18} color={isCurrent ? colors.accent : colors.text} />
      </View>
    </Pressable>
  );
}

export default function Music() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const m = useMusic();
  const [query, setQuery] = useState('');

  useEffect(() => {
    void m.loadTracks();
  }, [m]);

  const current = m.tracks[m.currentIndex] ?? null;

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return m.tracks.filter((item) => {
      const title = (item?.filename || '').toLowerCase();
      return !q || title.includes(q);
    });
  }, [m.tracks, query]);

  const queue = useMemo(
    () => (m.queue?.length ? m.queue.map((index) => m.tracks[index]).filter(Boolean) : m.tracks),
    [m.tracks, m.queue],
  );

  const progress = m.durationMs ? (m.positionMs / m.durationMs) * 100 : 0;
  const currentTitle = current ? getTrackTitle(current) : 'Aucune piste';
  const currentColor = current ? fallbackColor(currentTitle) : colors.accent;

  return (
    <View style={[styles.page, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}> 
      <ScreenHeader title="Musique" subtitle="Une belle bibliothèque à portée de main." />

      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.line }]}> 
        <Ionicons name="search-outline" size={18} color={colors.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher une piste"
          placeholderTextColor={colors.muted}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {current && (
        <Pressable onPress={() => m.setExpanded(true)} style={[styles.nowPlaying, { backgroundColor: colors.card, borderColor: colors.line }]}> 
          <View style={[styles.artwork, { backgroundColor: currentColor }]}> 
            <Text style={styles.artworkText}>{getCoverLabel(currentTitle)}</Text>
          </View>

          <View style={styles.nowInfo}>
            <Text style={[styles.label, { color: colors.muted }]}>EN COURS</Text>
            <Text style={[styles.nowTitle, { color: colors.text }]} numberOfLines={1}>{currentTitle}</Text>
            <Text style={[styles.nowMeta, { color: colors.muted }]}>{fmt(m.positionMs)} / {fmt(m.durationMs)}</Text>
            <View style={[styles.progressTrack, { backgroundColor: colors.line }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${Math.min(100, Math.max(0, progress))}%` }]} />
            </View>
          </View>

          <Pressable onPress={() => m.toggle()} style={[styles.playFab, { backgroundColor: colors.accent }]}> 
            <Ionicons name={m.isPlaying ? 'pause' : 'play'} size={22} color={colors.onAccent} />
          </Pressable>
        </Pressable>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>File d’attente</Text>
        <Pressable onPress={() => m.setShowQueue((value) => !value)}>
          <Text style={[styles.sectionAction, { color: colors.accent }]}>{m.showQueue ? 'Masquer' : 'Voir'}</Text>
        </Pressable>
      </View>

      {m.showQueue && queue.length > 0 && (
        <View style={[styles.queueBox, { backgroundColor: colors.card, borderColor: colors.line }]}> 
          {queue.slice(0, 4).map((track: any, index: number) => (
            <Pressable
              key={`${track?.id ?? track?.uri ?? index}-queue`}
              onPress={() => m.play(m.tracks.findIndex((item) => item.uri === track.uri))}
              style={styles.queueItem}
            >
              <Text style={[styles.queueTitle, { color: colors.text }]} numberOfLines={1}>
                {index + 1}. {getTrackTitle(track)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bibliothèque</Text>
        <Text style={[styles.sectionAction, { color: colors.muted }]}> {shown.length} titres</Text>
      </View>

      <FlatList
        data={shown}
        keyExtractor={(item, index) => `${item?.id ?? item?.uri ?? index}`}
        scrollEnabled={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item, index }) => (
          <TrackRow
            item={item}
            isCurrent={index === m.currentIndex}
            onPress={() => m.play(index)}
            onPlay={() => m.play(index)}
          />
        )}
        ListEmptyComponent={
          <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.line }]}> 
            <Text style={[styles.emptyText, { color: colors.muted }]}>Aucune piste ne correspond à ta recherche.</Text>
          </View>
        }
      />

      {m.isExpanded && current && (
        <View style={[styles.playerSheet, { backgroundColor: colors.bg, borderColor: colors.line }]}> 
          <Pressable style={styles.sheetHandle} onPress={() => m.setExpanded(false)}>
            <View style={[styles.handleBar, { backgroundColor: colors.line }]} />
          </Pressable>

          <View style={[styles.playerCard, { backgroundColor: colors.card, borderColor: colors.line }]}> 
            <View style={[styles.bigArt, { backgroundColor: currentColor }]}> 
              <Text style={styles.bigArtText}>{getCoverLabel(currentTitle)}</Text>
            </View>

            <Text style={[styles.playerTitle, { color: colors.text }]}>{currentTitle}</Text>
            <Text style={[styles.playerMeta, { color: colors.muted }]}>Lecture locale · {fmt(m.durationMs)}</Text>

            <View style={[styles.progressTrack, { backgroundColor: colors.line }]}> 
              <View style={[styles.progressFill, { backgroundColor: colors.accent, width: `${Math.min(100, Math.max(0, progress))}%` }]} />
            </View>

            <View style={styles.timeRow}>
              <Text style={[styles.timeText, { color: colors.muted }]}>{fmt(m.positionMs)}</Text>
              <Text style={[styles.timeText, { color: colors.muted }]}>{fmt(m.durationMs)}</Text>
            </View>

            <View style={styles.playerControls}> 
              <Pressable onPress={() => m.previous()} style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.line }]}> 
                <Ionicons name="play-skip-back" size={26} color={colors.text} />
              </Pressable>

              <Pressable onPress={() => m.toggle()} style={[styles.primaryBtn, { backgroundColor: colors.accent }]}> 
                <Ionicons name={m.isPlaying ? 'pause' : 'play'} size={32} color={colors.onAccent} />
              </Pressable>

              <Pressable onPress={() => m.next()} style={[styles.controlBtn, { backgroundColor: colors.card, borderColor: colors.line }]}> 
                <Ionicons name="play-skip-forward" size={26} color={colors.text} />
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {current && !m.isExpanded && (
        <View style={[styles.miniPlayer, { backgroundColor: colors.card, borderColor: colors.line }]}> 
          <Pressable onPress={() => m.setExpanded(true)} style={styles.miniLeft}>
            <View style={[styles.miniArt, { backgroundColor: currentColor }]}> 
              <Text style={styles.miniArtText}>{getCoverLabel(currentTitle)}</Text>
            </View>

            <View style={styles.miniInfo}>
              <Text style={[styles.miniTitle, { color: colors.text }]} numberOfLines={1}>{currentTitle}</Text>
              <Text style={[styles.miniMeta, { color: colors.muted }]}>{fmt(m.positionMs)} / {fmt(m.durationMs)}</Text>
            </View>
          </Pressable>

          <View style={styles.miniControls}> 
            <Pressable onPress={() => m.previous()}>
              <Ionicons name="play-skip-back" size={22} color={colors.text} />
            </Pressable>
            <Pressable onPress={() => m.toggle()} style={[styles.miniPlay, { backgroundColor: colors.accent }]}> 
              <Ionicons name={m.isPlaying ? 'pause' : 'play'} size={20} color={colors.onAccent} />
            </Pressable>
            <Pressable onPress={() => m.next()}>
              <Ionicons name="play-skip-forward" size={22} color={colors.text} />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginHorizontal: 16,
    marginBottom: 14,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 2 },
  nowPlaying: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 18,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
  },
  artwork: { width: 68, height: 68, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  artworkText: { color: '#fff', fontWeight: '800', fontSize: 22 },
  nowInfo: { flex: 1 },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  nowTitle: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  nowMeta: { fontSize: 12, marginTop: 2 },
  progressTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progressFill: { height: '100%', borderRadius: 3 },
  playFab: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 8, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '800' },
  sectionAction: { fontSize: 12, fontWeight: '700' },
  queueBox: { marginHorizontal: 16, marginBottom: 16, borderRadius: 18, borderWidth: 1, paddingVertical: 8 },
  queueItem: { paddingHorizontal: 14, paddingVertical: 10 },
  queueTitle: { fontSize: 14, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 170 },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 10,
  },
  trackArt: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  trackArtText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 16, fontWeight: '700' },
  trackMeta: { fontSize: 12, marginTop: 4 },
  trackRight: { alignItems: 'flex-end', gap: 4 },
  trackCount: { fontSize: 11, fontWeight: '700' },
  emptyState: { borderRadius: 18, borderWidth: 1, padding: 18, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14 },
  playerSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHandle: { alignItems: 'center', marginBottom: 8 },
  handleBar: { width: 48, height: 5, borderRadius: 999 },
  playerCard: { borderRadius: 30, borderWidth: 1, padding: 18 },
  bigArt: { width: '100%', height: 260, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  bigArtText: { color: '#fff', fontWeight: '800', fontSize: 52 },
  playerTitle: { fontSize: 28, fontWeight: '800', marginBottom: 4 },
  playerMeta: { fontSize: 14, marginBottom: 12 },
  timeRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  timeText: { fontSize: 12 },
  playerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 18, marginTop: 20 },
  controlBtn: { width: 56, height: 56, borderRadius: 28, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  primaryBtn: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  miniPlayer: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
  },
  miniLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10 },
  miniArt: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  miniArtText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  miniInfo: { flex: 1 },
  miniTitle: { fontSize: 14, fontWeight: '700' },
  miniMeta: { fontSize: 11, marginTop: 2 },
  miniControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  miniPlay: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
