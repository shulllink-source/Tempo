import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {storage} from './persist';

export type Mode = 'light' | 'dark' | 'system' | 'pink';
type State = {
  themeMode: Mode;
  accentColor: string | null;
  setTheme: (v: Mode) => void;
  setAccent: (v: string | null) => void;
};

export const useSettings = create<State>()(persist((set) => ({
  themeMode: 'dark',
  accentColor: null,
  setTheme: themeMode => set({themeMode}),
  setAccent: accentColor => set({accentColor}),
}), {name: 'tempo-settings-v3', storage}));
