import {Tabs} from 'expo-router';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../src/theme';

const icon=(name:any)=>({color,size}:{color:string;size:number})=><Ionicons name={name} size={size} color={color}/>;

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
    <Tabs.Screen name="timer" options={{title:'Timer',tabBarIcon:icon('timer-outline')}}/>
    <Tabs.Screen name="activities" options={{title:'Activités',tabBarIcon:icon('flash-outline')}}/>
    <Tabs.Screen name="more" options={{title:'Plus',tabBarIcon:icon('grid-outline')}}/>
  </Tabs>;
}
