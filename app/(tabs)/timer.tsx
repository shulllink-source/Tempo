import {View,Text,Pressable,StyleSheet,ScrollView,TextInput,Alert,Switch} from 'react-native';
import {useEffect,useState} from 'react';
import {ScreenHeader} from '../../src/components/ScreenHeader';
import {useTheme} from '../../src/theme';
import {useTimer,Preset,AlarmMode} from '../../src/stores/useTimer';

const fmt=(ms:number)=>{const t=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;};

function Btn({label,onPress,primary,danger,flex}:{label:string;onPress:()=>void;primary?:boolean;danger?:boolean;flex?:boolean}){
  const {colors}=useTheme();
  const bg=danger?colors.red:primary?colors.accent:colors.card;
  return <Pressable onPress={onPress} style={[s.btn,{backgroundColor:bg,borderColor:colors.line},flex?{flex:1}:null]}>
    <Text style={[s.btnTxt,{color:primary||danger?'#17191d':colors.text}]}>{label}</Text>
  </Pressable>;
}

type Draft={id:string;name:string;cycles:string;phases:{name:string;minutes:string}[]};

export default function Timer(){
  const {colors}=useTheme();
  const t=useTimer();
  const [,setTick]=useState(0);
  const [draft,setDraft]=useState<Draft|null>(null);

  useEffect(()=>{
    const id=setInterval(()=>{useTimer.getState().sync();setTick(x=>x+1);},250);
    return()=>clearInterval(id);
  },[]);

  const preset=t.presets.find(p=>p.id===t.presetId)||t.presets[0];
  const phase=preset.phases[t.phaseIndex]||preset.phases[0];
  const elapsed=t.elapsedBefore+(t.running&&t.startedAt?Date.now()-t.startedAt:0);
  const total=t.durationSec*1000;
  const remaining=total-elapsed;
  const progress=Math.min(1,Math.max(0,elapsed/total));

  const choose=(id:string)=>{
    if(id===t.presetId)return;
    if(t.running||t.elapsedBefore>0){
      Alert.alert('Changer de réglage ?','La séance en cours sera arrêtée.',[{text:'Annuler'},{text:'Changer',onPress:()=>t.selectPreset(id)}]);
    }else t.selectPreset(id);
  };

  const newDraft=()=>setDraft({id:Date.now().toString(),name:'',cycles:'4',phases:[{name:'Travail',minutes:'25'},{name:'Pause',minutes:'5'}]});
  const editDraft=(p:Preset)=>setDraft({id:p.id,name:p.name,cycles:String(p.cycles),phases:p.phases.map(x=>({name:x.name,minutes:String(x.minutes)}))});

  const saveDraft=()=>{
    if(!draft)return;
    if(!draft.name.trim()){Alert.alert('Nom manquant','Donnez un nom à ce réglage.');return;}
    const phases=draft.phases
      .map(x=>({name:x.name.trim()||'Phase',minutes:parseFloat(x.minutes.replace(',','.'))}))
      .filter(x=>x.minutes>0);
    if(!phases.length){Alert.alert('Phases invalides','Ajoutez au moins une phase avec une durée.');return;}
    t.savePreset({id:draft.id,name:draft.name.trim(),cycles:Math.max(1,parseInt(draft.cycles)||1),phases});
    setDraft(null);
  };

  const removePreset=(p:Preset)=>{
    if(t.presets.length<=1){Alert.alert('Impossible','Il faut garder au moins un réglage.');return;}
    Alert.alert('Supprimer ?',p.name,[{text:'Annuler'},{text:'Supprimer',style:'destructive',onPress:()=>{t.deletePreset(p.id);setDraft(null);}}]);
  };

  const updPhase=(i:number,key:'name'|'minutes',v:string)=>draft&&setDraft({...draft,phases:draft.phases.map((x,j)=>j===i?{...x,[key]:v}:x)});

  const status=t.ringing?'⏰ Alarme':t.finished?'Séance terminée 🎉':t.waiting?'En attente de votre appui':t.running?'En cours':elapsed>0?'En pause':'Prêt';

  return <View style={[s.page,{backgroundColor:colors.bg}]}>
    <ScreenHeader title="Pomodoro" subtitle="Enchaînez vos phases."/>
    <ScrollView contentContainerStyle={{paddingBottom:40}}>

      {/* Affichage */}
      <View style={[s.card,{backgroundColor:colors.card}]}>
        <Text style={[s.phase,{color:colors.accent}]}>{phase.name}</Text>
        <Text style={{color:colors.muted}}>{preset.name} · Cycle {t.cycle}/{preset.cycles} · Phase {t.phaseIndex+1}/{preset.phases.length}</Text>
        <Text style={[s.time,{color:colors.text}]}>{fmt(remaining)}</Text>
        <View style={[s.bar,{backgroundColor:colors.line}]}><View style={[s.fill,{backgroundColor:colors.accent,width:`${progress*100}%`}]}/></View>
        <Text style={{color:colors.muted,marginTop:8}}>{status}</Text>
      </View>

      {/* Commandes */}
      <View style={s.controls}>
        {t.ringing&&<Btn label="Arrêter l'alarme" danger onPress={t.stopAlarm}/>}
        {t.finished?<Btn label="Recommencer" primary onPress={()=>{t.stop();t.start();}}/>
        :t.waiting?<Btn label={`Lancer : ${phase.name}`} primary onPress={t.start}/>
        :<View style={s.row}>
          <Btn flex primary label={t.running?'Pause':elapsed>0?'Reprendre':'Démarrer'} onPress={t.running?t.pause:t.start}/>
          <Btn flex label="Passer" onPress={t.skip}/>
          <Btn flex label="Arrêter" onPress={t.stop}/>
        </View>}
      </View>

      {/* Réglages sauvegardés */}
      <Text style={[s.section,{color:colors.text}]}>Mes réglages</Text>
      <Text style={[s.hint,{color:colors.muted}]}>Appui : choisir · Appui long : modifier</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {t.presets.map(p=>{const on=p.id===t.presetId;return <Pressable key={p.id} onPress={()=>choose(p.id)} onLongPress={()=>editDraft(p)} style={[s.chip,{backgroundColor:on?colors.accent:colors.card}]}>
          <Text style={{color:on?'#17191d':colors.text,fontWeight:'800'}}>{p.name}</Text>
          <Text style={{color:on?'#17191d':colors.muted,fontSize:12}}>{p.phases.map(x=>x.minutes).join('/')} min ×{p.cycles}</Text>
        </Pressable>;})}
        <Pressable onPress={newDraft} style={[s.chip,{borderWidth:1,borderColor:colors.line,borderStyle:'dashed'}]}>
          <Text style={{color:colors.text,fontWeight:'800'}}>+ Nouveau</Text>
        </Pressable>
      </ScrollView>

      {/* Éditeur */}
      {draft&&<View style={[s.card,{backgroundColor:colors.card}]}>
        <Text style={[s.section,{color:colors.text,marginLeft:0,marginTop:0}]}>{t.presets.some(p=>p.id===draft.id)?'Modifier':'Nouveau réglage'}</Text>
        <TextInput value={draft.name} onChangeText={v=>setDraft({...draft,name:v})} placeholder="Nom (ex : Écriture)" placeholderTextColor={colors.muted} style={[s.input,{color:colors.text,borderColor:colors.line}]}/>
        {draft.phases.map((x,i)=><View key={i} style={s.row}>
          <TextInput value={x.name} onChangeText={v=>updPhase(i,'name',v)} placeholder="Phase" placeholderTextColor={colors.muted} style={[s.input,{flex:1,color:colors.text,borderColor:colors.line}]}/>
          <TextInput value={x.minutes} onChangeText={v=>updPhase(i,'minutes',v)} keyboardType="numeric" placeholder="min" placeholderTextColor={colors.muted} style={[s.input,{width:70,color:colors.text,borderColor:colors.line}]}/>
          <Pressable onPress={()=>setDraft({...draft,phases:draft.phases.filter((_,j)=>j!==i)})} style={s.x}><Text style={{color:colors.muted,fontSize:22}}>×</Text></Pressable>
        </View>)}
        <Btn label="+ Ajouter une phase" onPress={()=>setDraft({...draft,phases:[...draft.phases,{name:'',minutes:'5'}]})}/>
        <View style={[s.row,{alignItems:'center',marginTop:10}]}>
          <Text style={{color:colors.text,flex:1,fontSize:16}}>Nombre de cycles</Text>
          <TextInput value={draft.cycles} onChangeText={v=>setDraft({...draft,cycles:v})} keyboardType="numeric" style={[s.input,{width:70,color:colors.text,borderColor:colors.line}]}/>
        </View>
        <View style={[s.row,{marginTop:10}]}>
          <Btn flex primary label="Enregistrer" onPress={saveDraft}/>
          <Btn flex label="Annuler" onPress={()=>setDraft(null)}/>
        </View>
        {t.presets.some(p=>p.id===draft.id)&&<Btn danger label="Supprimer ce réglage" onPress={()=>{const p=t.presets.find(p=>p.id===draft.id);if(p)removePreset(p);}}/>}
      </View>}

      {/* Options */}
      <Text style={[s.section,{color:colors.text}]}>Options</Text>
      <View style={[s.card,{backgroundColor:colors.card}]}>
        <View style={s.opt}>
          <View style={{flex:1}}>
            <Text style={[s.optTitle,{color:colors.text}]}>Enchaînement automatique</Text>
            <Text style={{color:colors.muted}}>{t.autoNext?'La phase suivante démarre seule':'Attend votre appui'}</Text>
          </View>
          <Switch value={t.autoNext} onValueChange={v=>t.setSettings({autoNext:v})} trackColor={{true:colors.accent,false:colors.line}}/>
        </View>
        <View style={s.opt}>
          <Text style={[s.optTitle,{color:colors.text,flex:1}]}>Vibration</Text>
          <Switch value={t.vibrate} onValueChange={v=>t.setSettings({vibrate:v})} trackColor={{true:colors.accent,false:colors.line}}/>
        </View>
        <Text style={[s.optTitle,{color:colors.text,marginTop:8}]}>Son de fin de phase</Text>
        <View style={[s.row,{marginTop:8}]}>
          {([['off','Muet'],['short','Bref'],['long','Jusqu’à arrêt']] as [AlarmMode,string][]).map(([k,l])=>{const on=t.alarm===k;return <Pressable key={k} onPress={()=>t.setSettings({alarm:k})} style={[s.mode,{backgroundColor:on?colors.accent:colors.bg}]}>
            <Text style={{color:on?'#17191d':colors.text,fontWeight:'700'}}>{l}</Text>
          </Pressable>;})}
        </View>
      </View>
    </ScrollView>
  </View>;
}

const s=StyleSheet.create({
  page:{flex:1},
  card:{marginHorizontal:16,marginTop:12,padding:18,borderRadius:20},
  phase:{fontSize:20,fontWeight:'800'},
  time:{fontSize:64,fontWeight:'800',textAlign:'center',marginVertical:12,fontVariant:['tabular-nums']},
  bar:{height:6,borderRadius:3,overflow:'hidden'},
  fill:{height:6},
  controls:{paddingHorizontal:16,paddingTop:12,gap:10},
  row:{flexDirection:'row',gap:8,marginBottom:8},
  btn:{paddingVertical:16,paddingHorizontal:12,borderRadius:16,alignItems:'center',borderWidth:1},
  btnTxt:{fontSize:16,fontWeight:'800'},
  section:{fontSize:18,fontWeight:'800',marginLeft:16,marginTop:24,marginBottom:4},
  hint:{marginLeft:16,fontSize:12},
  chips:{gap:8,paddingHorizontal:16,paddingVertical:10},
  chip:{paddingVertical:12,paddingHorizontal:16,borderRadius:16,justifyContent:'center'},
  input:{borderWidth:1,borderRadius:12,padding:12,fontSize:16,marginBottom:8},
  x:{justifyContent:'center',paddingHorizontal:6,paddingBottom:8},
  opt:{flexDirection:'row',alignItems:'center',paddingVertical:8},
  optTitle:{fontSize:16,fontWeight:'700'},
  mode:{flex:1,padding:12,borderRadius:12,alignItems:'center'},
});
