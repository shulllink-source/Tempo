import {View,Text,Pressable,StyleSheet,ScrollView,TextInput,Alert} from 'react-native';
import {useEffect,useState} from 'react';
import {ScreenHeader} from '../../src/components/ScreenHeader';
import {useTheme} from '../../src/theme';
import {useTimer,Preset,Phase} from '../../src/stores/useTimer';

const fmt=(ms:number)=>{const t=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;};

function Btn({label,onPress,primary,danger,flex}:{label:string;onPress:()=>void;primary?:boolean;danger?:boolean;flex?:boolean}){
  const {colors}
