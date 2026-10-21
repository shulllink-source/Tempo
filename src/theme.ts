import {useMemo} from 'react';
import {StyleSheet,useColorScheme} from 'react-native';
import {useSettings} from './stores/useSettings';

const dark={bg:'#0d0f12',card:'#171a1f',card2:'#20242b',text:'#f5f2ea',muted:'#89919d',line:'#2a3039',accent:'#e8b04b',green:'#64d69a',red:'#f47d72',blue:'#73a7ff',onAccent:'#17191d'};
export type Colors=typeof dark;
const light:Colors={...dark,bg:'#f5f3ee',card:'#ffffff',card2:'#ece9e2',text:'#17191d',muted:'#68717d',line:'#dedbd2'};
const pink:Colors={bg:'#fdeef2',card:'#fff7f9',card2:'#fadde5',text:'#5a2a3a',muted:'#a8788a',line:'#f3cbd7',accent:'#e58aa5',green:'#8fbfa5',red:'#d9627f',blue:'#b79ad6',onAccent:'#ffffff'};

export const spacing={xs:4,sm:8,md:12,lg:16,xl:24,xxl:32};
export const radius={sm:10,md:16,lg:24,pill:999};

export function useTheme(){
  const mode=useSettings(s=>s.themeMode) as string;
  const system=useColorScheme();
  const scheme=mode==='system'?(system||'dark'):mode;
  const colors=scheme==='pink'?pink:scheme==='light'?light:dark;
  return {scheme,colors};
}

export const makeStyles=<T extends StyleSheet.NamedStyles<T>>(f:(c:Colors)=>T)=>()=>{
  const {colors}=useTheme();
  return useMemo(()=>StyleSheet.create(f(colors)),[colors]);
};
