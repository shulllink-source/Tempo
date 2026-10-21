import {View,Text,Pressable,StyleSheet,ScrollView,FlatList,useWindowDimensions} from 'react-native';
import {router} from 'expo-router';
import {useRef,useState,useEffect} from 'react';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '../../src/theme';
import {useTimer} from '../../src/stores/useTimer';
import {useMusic} from '../../src/stores/useMusic';

const fmt=(ms:number)=>{const t=Math.max(0,Math.ceil(ms/1000));return `${String(Math.floor(t/60)).padStart(2,'0')}:${String(t%60).padStart(2,'0')}`;};

type Page={key:string;title:string;icon:any;route:string;sub:string};
const PAGES:Page[]=[
  {key:'note',title:'Notes',icon:'create-outline',route:'/note',sub:'Capturez une idée'},
  {key:'agenda',title:'Agenda',icon:'calendar-outline',route:'/agenda',sub:'Votre journée'},
  {key:'home',title:'Accueil',icon:'home-outline',route:'',sub:''},
  {key:'timer',title:'Pomodoro',icon:'timer-outline',route:'/timer',sub:'Concentration'},
  {key:'activity',title:'Activités',icon:'flash-outline',route:'/activities',sub:'Suivez votre temps'},
  {key:'stats',title:'Statistiques',icon:'stats-chart-outline',route:'/stats',sub:'Votre progression'},
  {key:'clock',title:'Horloge',icon:'time-outline',route:'/clock',sub:'Heure et styles'},
];

function BigLink({p}:{p:Page}){
  const {colors}=useTheme();
  return <View style={s.center}>
    <Pressable onPress={()=>router.push(p.route as never)} style={[s.bigCard,{backgroundColor:colors.card,borderColor:colors.line}]}>
      <Ionicons name={p.icon} size={72} color={colors.accent}/>
      <Text style={[s.bigTitle,{color:colors.text}]}>{p.title}</Text>
      <Text style={{color:colors.muted,fontSize:15}}>{p.sub}</Text>
      <View style={[s.open,{backgroundColor:colors.accent}]}><Text style={{color:colors.onAccent,fontWeight:'800',fontSize:16}}>Ouvrir</Text></View>
    </Pressable>
  </View>;
}

function Home(){
  const {colors}=useTheme();
  const t=useTimer();
  const m=useMusic();
  const [,setTick]=useState(0);
  useEffect(()=>{const id=setInterval(()=>{useTimer.getState().sync();setTick(x=>x+1);},500);return()=>clearInterval(id);},[]);
  const preset=t.presets.find(p=>p.id===t.presetId)||t.presets[0];
  const phase=preset?.phases?.[t.phaseIndex];
  const track=m.tracks[m.currentIndex];
  const plays=Object.values(m.playCounts).reduce((a:number,b:any)=>a+b,0);
  const card=[s.card,{backgroundColor:colors.card,borderColor:colors.line}];
  return <ScrollView contentContainerStyle={s.homeContent}>
    <Text style={[s.hello,{color:colors.text}]}>Tempo</Text>

    <Pressable style={card} onPress={()=>router.navigate('/music' as never)}>
      <Text style={[s.cardLabel,{color:colors.muted}]}>MUSIQUE</Text>
      <Text style={[s.cardTitle,{color:colors.text}]} numberOfLines={1}>{track?.filename?.replace(/\.[^.]+$/,'')||'Aucune musique en cours'}</Text>
      <View style={s.ctrl}>
        <Pressable onPress={()=>m.previous()} hitSlop={10}><Ionicons name="play-skip-back" size={30} color={colors.text}/></Pressable>
        <Pressable onPress={()=>m.toggle()} style={[s.play,{backgroundColor:colors.accent}]}><Ionicons name={m.isPlaying?'pause':'play'} size={30} color={colors.onAccent}/></Pressable>
        <Pressable onPress={()=>m.next()} hitSlop={10}><Ionicons name="play-skip-forward" size={30} color={colors.text}/></Pressable>
      </View>
    </Pressable>

    <Pressable style={card} onPress={()=>router.push('/timer' as never)}>
      <Text style={[s.cardLabel,{color:colors.muted}]}>POMODORO</Text>
      <Text style={[s.cardTitle,{color:colors.text}]}>{t.running?`${phase?.name||'En cours'} · ${fmt(t.remainingMs??0)}`:'Prêt à démarrer'}</Text>
      <Text style={{color:colors.muted}}>{preset?.name}</Text>
    </Pressable>

    <Pressable style={card} onPress={()=>router.push('/activities' as never)}>
      <Text style={[s.cardLabel,{color:colors.muted}]}>ACTIVITÉS</Text>
      <Text style={[s.cardTitle,{color:colors.text}]}>Ouvrir mes activités</Text>
      <Text style={{color:colors.muted}}>Démarrez ou arrêtez une activité</Text>
    </Pressable>

    <Pressable style={card} onPress={()=>router.push('/stats' as never)}>
      <Text style={[s.cardLabel,{color:colors.muted}]}>STATISTIQUES</Text>
      <Text style={[s.cardTitle,{color:colors.text}]}>{plays} écoute{plays>1?'s':''} comptabilisée{plays>1?'s':''}</Text>
      <Text style={{color:colors.muted}}>Voir le détail</Text>
    </Pressable>
  </ScrollView>;
}

export default function Dashboard(){
  const {colors}=useTheme();
  const insets=useSafeAreaInsets();
  const {width}=useWindowDimensions();
  const ref=useRef<FlatList>(null);
  const [idx,setIdx]=useState(2);
  return <View style={{flex:1,backgroundColor:colors.bg,paddingTop:insets.top}}>
    <FlatList
      ref={ref}
      data={PAGES}
      keyExtractor={p=>p.key}
      horizontal pagingEnabled showsHorizontalScrollIndicator={false}
      initialScrollIndex={2}
      getItemLayout={(_,i)=>({length:width,offset:width*i,index:i})}
      onMomentumScrollEnd={e=>setIdx(Math.round(e.nativeEvent.contentOffset.x/width))}
      renderItem={({item})=><View style={{width}}>{item.key==='home'?<Home/>:<BigLink p={item}/>}</View>}
    />
    <View style={s.dots}>
      {PAGES.map((p,i)=><Pressable key={p.key} hitSlop={8} onPress={()=>{ref.current?.scrollToIndex({index:i});setIdx(i);}}>
        <View style={[s.dot,{backgroundColor:i===idx?colors.accent:colors.line,width:i===idx?22:8}]}/>
      </Pressable>)}
    </View>
  </View>;
}

const s=StyleSheet.create({
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:24},
  bigCard:{width:'100%',alignItems:'center',gap:10,padding:32,borderRadius:28,borderWidth:1},
  bigTitle:{fontSize:28,fontWeight:'800',marginTop:8},
  open:{marginTop:16,paddingVertical:16,paddingHorizontal:40,borderRadius:18},
  homeContent:{padding:16,gap:12},
  hello:{fontSize:34,fontWeight:'800',marginBottom:4},
  card:{padding:18,borderRadius:22,borderWidth:1,gap:6},
  cardLabel:{fontSize:12,fontWeight:'800',letterSpacing:1},
  cardTitle:{fontSize:20,fontWeight:'800'},
  ctrl:{flexDirection:'row',alignItems:'center',justifyContent:'space-around',marginTop:10},
  play:{width:62,height:62,borderRadius:31,alignItems:'center',justifyContent:'center'},
  dots:{flexDirection:'row',gap:6,justifyContent:'center',alignItems:'center',paddingVertical:12},
  dot:{height:8,borderRadius:4}
});
