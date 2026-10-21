import {Tabs,router} from 'expo-router';
import {View,Pressable,StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../src/theme';

const icon=(name:any)=>({color,size}:{color:string;size:number})=><Ionicons name={name} size={size} color={color}/>;

function MusicButton({onPress,focused}:{onPress?:any;focused:boolean}){
  const {colors}=useTheme();
  return <View style={s.wrap} pointerEvents="box-none">
    <Pressable onPress={onPress} style={[s.btn,{backgroundColor:colors.accent,borderColor:colors.bg}]}>
      <Ionicons name={focused?'musical-notes':'musical-notes-outline'} size={34} color={colors.onAccent}/>
    </Pressable>
  </View>;
}

export default function TabsLayout(){
  const {colors}=useTheme();
  const insets=useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown:false,
    tabBarActiveTintColor:colors.accent,
    tabBarInactiveTintColor:colors.muted,
    tabBarLabelStyle:{fontSize:12,fontWeight:'600'},
    tabBarStyle:{backgroundColor:colors.card,borderTopColor:colors.line,height:62+insets.bottom,paddingBottom:insets.bottom+6,paddingTop:6}
  }}>
    <Tabs.Screen name="index" options={{title:'Accueil',tabBarIcon:icon('home-outline')}}/>
    <Tabs.Screen name="clock" options={{title:'Horloge',tabBarIcon:icon('time-outline')}}/>
    <Tabs.Screen name="music" options={{title:'',tabBarButton:(p:any)=><MusicButton onPress={()=>router.navigate('/music' as never)} focused={!!p.accessibilityState?.selected}/>}}/>
    <Tabs.Screen name="activities" options={{title:'Activités',tabBarIcon:icon('flash-outline')}}/>
    <Tabs.Screen name="more" options={{title:'Plus',tabBarIcon:icon('grid-outline')}}/>
    <Tabs.Screen name="timer" options={{href:null}}/>
  </Tabs>;
}

const s=StyleSheet.create({
  wrap:{flex:1,alignItems:'center',justifyContent:'flex-start'},
  btn:{width:70,height:70,borderRadius:35,alignItems:'center',justifyContent:'center',marginTop:-26,borderWidth:5,elevation:8}
});
