import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {storage} from './persist';
import {Audio, AVPlaybackStatus} from 'expo-av';
import * as MediaLibrary from 'expo-media-library';

type State = {
  tracks: MediaLibrary.Asset[];
  currentIndex: number;
  isPlaying: boolean;
  positionMs: number;
  durationMs: number;
  playCounts: Record<string, number>;
  sound: Audio.Sound | null;
  loadTracks: () => Promise<void>;
  play: (index?: number) => Promise<void>;
  pause: () => Promise<void>;
  toggle: () => Promise<void>;
  next: () => Promise<void>;
  previous: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
};

let listenedMs = 0;
let lastPosition = 0;
let counted = false;

const normalizeIndex = (index: number, length: number) => {
  if (length <= 0) return -1;
  if (index < 0) return length - 1;
  if (index >= length) return 0;
  return index;
};

export const useMusic = create<State>()(
  persist(
    (set, get) => ({
      tracks: [],
      currentIndex: 0,
      isPlaying: false,
      positionMs: 0,
      durationMs: 0,
      playCounts: {},
      sound: null,
      loadTracks: async () => {
        const p = await MediaLibrary.requestPermissionsAsync();
        if (!p.granted) return;

        let all: MediaLibrary.Asset[] = [];
        let after: string | undefined;
        let more = true;

        while (more) {
          const r = await MediaLibrary.getAssetsAsync({
            mediaType: 'audio',
            first: 500,
            after,
            sortBy: [MediaLibrary.SortBy.creationTime],
          });

          all = all.concat(r.assets);
          after = r.endCursor;
          more = r.hasNextPage;
        }

        set({
          tracks: all,
          currentIndex: normalizeIndex(get().currentIndex, all.length),
        });
      },
      play: async (index?: number) => {
        const state = get();
        const resolvedIndex = typeof index === 'number'
          ? normalizeIndex(index, state.tracks.length)
          : normalizeIndex(state.currentIndex, state.tracks.length);

        if (resolvedIndex < 0) {
          set({ isPlaying: false, positionMs: 0, durationMs: 0, sound: null });
          return;
        }

        const asset = state.tracks[resolvedIndex];
        if (!asset?.uri) {
          set({ isPlaying: false, positionMs: 0, durationMs: 0, sound: null });
          return;
        }

        if (state.sound) {
          await state.sound.unloadAsync().catch(() => undefined);
        }

        listenedMs = 0;
        lastPosition = 0;
        counted = false;

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: asset.uri },
          { shouldPlay: true, progressUpdateIntervalMillis: 500 },
          (playbackStatus) => {
            const p = playbackStatus as AVPlaybackStatus & {
              positionMillis?: number;
              durationMillis?: number;
              didJustFinish?: boolean;
            };

            if (!p || !p.isLoaded) return;

            const pos = p.positionMillis ?? 0;
            listenedMs += Math.max(0, pos - lastPosition);
            lastPosition = pos;

            if (!counted && (listenedMs >= 30000 || p.didJustFinish)) {
              const key = asset.id;
              set((current) => ({
                playCounts: {
                  ...current.playCounts,
                  [key]: (current.playCounts[key] ?? 0) + 1,
                },
              }));
              counted = true;
            }

            set({
              positionMs: pos,
              durationMs: p.durationMillis ?? 0,
              isPlaying: !p.didJustFinish && p.isPlaying,
            });

            if (p.didJustFinish) {
              void get().next();
            }
          }
        );

        set({
          sound,
          currentIndex: resolvedIndex,
          isPlaying: status.isLoaded && status.isPlaying,
          positionMs: 0,
          durationMs: status.isLoaded ? status.durationMillis ?? 0 : 0,
        });
      },
      pause: async () => {
        const state = get();
        if (!state.sound) return;
        await state.sound.pauseAsync();
        set({ isPlaying: false });
      },
      toggle: async () => {
        const state = get();
        if (!state.tracks.length) return;

        if (state.isPlaying) {
          await get().pause();
          return;
        }

        if (state.sound) {
          await state.sound.playAsync();
          set({ isPlaying: true });
          return;
        }

        await get().play();
      },
      next: async () => {
        const state = get();
        if (!state.tracks.length) return;
        const nextIndex = normalizeIndex(state.currentIndex + 1, state.tracks.length);
        if (nextIndex < 0) return;
        await get().play(nextIndex);
      },
      previous: async () => {
        const state = get();
        if (!state.tracks.length) return;
        const previousIndex = normalizeIndex(state.currentIndex - 1, state.tracks.length);
        if (previousIndex < 0) return;
        await get().play(previousIndex);
      },
      seek: async (ms) => {
        const state = get();
        if (!state.sound) return;
        await state.sound.setPositionAsync(ms);
        set({ positionMs: ms });
      },
    }),
    { name: 'tempo-music', storage, partialize: (s) => ({ playCounts: s.playCounts }) as State }
  )
);
