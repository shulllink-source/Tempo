import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {storage} from './persist';
import * as Notifications from 'expo-notifications';
import {Vibration,Platform} from 'react-native';

export type Phase={name:string;minutes:number};
export type Preset={id:string;name:string;phases:Phase[];cycles:number};
export type AlarmMode='off'|'short'|'long';

Notifications.setNotificationHandler({handleNotification:async()=>({shouldShowAlert:true,shouldShowBanner:true,shouldShowList:true,shouldPlaySound:true,shouldSetBadge:false} as any)});
if(Platform.OS==='android'){
  void Notifications.setNotificationChannelAsync('tempo-alarm',{name:'Alarme Tempo',importance:Notifications.AndroidImportance.MAX,sound:'default',vibrationPattern:[0,400,200,400]});
  void Notifications.setNotificationChannelAsync('tempo-silent',{name:'Tempo silencieux',importance:Notifications.AndroidImportance.DEFAULT,sound:null,vibrationPattern:[0]});
}

const DEFAULT_PRESETS:Preset[]=[
  {id:'classique',name:'Classique',phases:[{name:'Travail',minutes:25},{name:'Pause',minutes:5}],cycles:4},
  {id:'court',name:'Court',phases:[{name:'Focus',minutes:20},{name:'Pause',minutes:5}],cycles:3},
];

type State={
  presets:Preset[];presetId:string;phaseIndex:number;cycle:number;
  running:boolean;startedAt:number|null;elapsedBefore:number;durationSec:number;
  waiting:boolean;finished:boolean;ringing:boolean;
  autoNext:boolean;alarm:AlarmMode;vibrate:boolean;
  completedPomodoros:number;sequences:any[];
  start:()=>void;pause:()=>void;stop:()=>void;skip:()=>void;sync:()=>void;stopAlarm:()=>void;
  selectPreset:(id:string)=>void;savePreset:(p:Preset)=>void;deletePreset:(id:string)=>void;
  setSettings:(p:Partial<Pick<State,'autoNext'|'alarm'|'vibrate'>>)=>void;
  setDuration:(n:number)=>void;addSequence:(s:any)=>void;
};

const cur=(s:{presets:Preset[];presetId:string})=>s.presets.find(p=>p.id===s.presetId)||s.presets[0];
const phaseSec=(p:Preset,i:number)=>Math.max(1,Math.round((p.phases[i]?.minutes||1)*60));

const schedule=(s:State)=>{
  void Notifications.cancelAllScheduledNotificationsAsync();
  const p=cur(s);let t=s.durationSec-s.elapsedBefore/1000;let i=s.phaseIndex,c=s.cycle;
  while(true){
    let ni=i+1,nc=c;if(ni>=p.phases.length){ni=0;nc++;}
    const last=nc>p.cycles;
    const body=last?'Séance terminée 🎉':`${p.phases[i].name} terminé → ${p.phases[ni].name}`;
    const reps=s.alarm==='long'&&(last||!s.autoNext)?6:1;
    for(let k=0;k<reps;k++)void Notifications.scheduleNotificationAsync({content:{title:'Tempo',body,sound:s.alarm!=='off'},trigger:{type:Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,seconds:Math.max(1,Math.round(t+k*5)),channelId:s.alarm==='off'?'tempo-silent':'tempo-alarm'} as any});
    if(last||!s.autoNext)break;
    i=ni;c=nc;t+=phaseSec(p,i);
  }
};

const feedback=(s:State,long:boolean)=>{if(!s.vibrate)return;if(long)Vibration.vibrate([0,600,400],true);else Vibration.vibrate([0,300,150,300]);};

export const useTimer=create<State>()(persist((set,get)=>({
  presets:DEFAULT_PRESETS,presetId:'classique',phaseIndex:0,cycle:1,
  running:false,startedAt:null,elapsedBefore:0,durationSec:1500,
  waiting:false,finished:false,ringing:false,
  autoNext:true,alarm:'short',vibrate:true,
  completedPomodoros:0,sequences:[],

  start:()=>{
    Vibration.cancel();
    const patch={running:true,startedAt:Date.now(),waiting:false,finished:false,ringing:false};
    schedule({...get(),...patch});set(patch);
  },
  pause:()=>{
    void Notifications.cancelAllScheduledNotificationsAsync();
    const s=get();set({running:false,elapsedBefore:s.elapsedBefore+(s.startedAt?Date.now()-s.startedAt:0),startedAt:null});
  },
  stop:()=>{
    void Notifications.cancelAllScheduledNotificationsAsync();Vibration.cancel();
    const p=cur(get());set({running:false,startedAt:null,elapsedBefore:0,phaseIndex:0,cycle:1,durationSec:phaseSec(p,0),waiting:false,finished:false,ringing:false});
  },
  skip:()=>{
    const s=get();if(s.finished)return;
    set({running:true,startedAt:Date.now(),elapsedBefore:s.durationSec*1000,waiting:false});
    get().sync();
    if(get().running)schedule(get());
  },
  sync:()=>{
    const s=get();if(!s.running||!s.startedAt)return;
    const elapsed=s.elapsedBefore+Date.now()-s.startedAt;const total=s.durationSec*1000;
    if(elapsed<total)return;
    const p=cur(s);let {phaseIndex,cycle,completedPomodoros}=s;let over=elapsed-total;
    while(true){
      if(phaseIndex===0)completedPomodoros++;
      phaseIndex++;if(phaseIndex>=p.phases.length){phaseIndex=0;cycle++;}
      if(cycle>p.cycles){
        const long=s.alarm==='long';feedback(s,long);
        set({running:false,startedAt:null,elapsedBefore:0,phaseIndex:0,cycle:1,completedPomodoros,finished:true,ringing:long,durationSec:phaseSec(p,0)});return;
      }
      const len=phaseSec(p,phaseIndex);
      if(!s.autoNext){
        const long=s.alarm==='long';feedback(s,long);
        set({running:false,startedAt:null,elapsedBefore:0,phaseIndex,cycle,completedPomodoros,waiting:true,ringing:long,durationSec:len});return;
      }
      if(over<len*1000){feedback(s,false);set({phaseIndex,cycle,completedPomodoros,durationSec:len,elapsedBefore:0,startedAt:Date.now()-over});return;}
      over-=len*1000;
    }
  },
  stopAlarm:()=>{Vibration.cancel();void Notifications.cancelAllScheduledNotificationsAsync();void Notifications.dismissAllNotificationsAsync();set({ringing:false});},

  selectPreset:id=>{
    void Notifications.cancelAllScheduledNotificationsAsync();Vibration.cancel();
    const p=cur({presets:get().presets,presetId:id});
    set({presetId:p.id,phaseIndex:0,cycle:1,running:false,startedAt:null,elapsedBefore:0,waiting:false,finished:false,ringing:false,durationSec:phaseSec(p,0)});
  },
  savePreset:p=>{
    const s=get();const exists=s.presets.some(x=>x.id===p.id);
    set({presets:exists?s.presets.map(x=>x.id===p.id?p:x):[...s.presets,p]});
    if(!s.running||p.id===s.presetId)get().selectPreset(p.id);
  },
  deletePreset:id=>{
    const s=get();if(s.presets.length<=1)return;
    set({presets:s.presets.filter(x=>x.id!==id)});
    if(s.presetId===id)get().selectPreset(get().presets[0].id);
  },
  setSettings:patch=>{set(patch);const s=get();if(s.running)schedule(s);},
  setDuration:durationSec=>set({durationSec,elapsedBefore:0}),
  addSequence:x=>set(s=>({sequences:[...s.sequences,x]})),
}),{name:'tempo-timer-v2',storage}));
