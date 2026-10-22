import {View,Text,Pressable,StyleSheet} from 'react-native';
import {ScreenHeader} from '../src/components/ScreenHeader';
import {useSettings,Mode} from '../src/stores/useSettings';
import {useTheme} from '../src/theme';

const modes:[Mode,string][]=[['dark','Sombre'],['light','Clair'],['pink','Rose'],['system','Système']];
const accents=['#e8b04b','#73a7ff','#64d69a','#f47d72','#ff5fa2','#b79ad6'];

export default function Settings(){
  const {colors}=useTheme();
  const s=useSettings();
  return <View style={[st.page,{backgroundColor:colors.bg}]}>
    <ScreenHeader title="Réglages" subtitle="Tempo, à votre image."/>
    <Text style={[st.heading,{color:colors.text}]}>Apparence</Text>
    <View style={st.row}>
      {modes.map(([m,label])=>
        <Pressable key={m} onPress={()=>s.setTheme(m)} style={[st.choice,{backgroundColor:s.themeMode===m?colors.accent:colors.card}]}>
          <Text style={{color:s.themeMode===m?colors.onAccent:colors.text}}>{label}</Text>
        </Pressable>)}
    </View>
    <Text style={[st.heading,{color:colors.text}]}>Accent</Text>
    <View style={st.row}>
      <Pressable onPress={()=>s.setAccent(null)} style={[st.choice,{backgroundColor:s.accentColor===null?colors.accent:colors.card}]}>
        <Text style={{color:s.accentColor===null?colors.onAccent:colors.text}}>Auto</Text>
      </Pressable>
      {accents.map(c=>
        <Pressable key={c} onPress={()=>s.setAccent(c)} style={[st.dot,{backgroundColor:c,borderColor:s.accentColor===c?colors.text:'transparent'}]}/>)}
    </View>
    <Text style={{color:colors.muted,padding:16}}>Les données sont conservées localement sur cet appareil.</Text>
  </View>;
}

const st=StyleSheet.create({
  page:{flex:1},
  heading:{fontSize:18,fontWeight:'800',padding:16,paddingBottom:8},
  row:{flexDirection:'row',gap:8,paddingHorizontal:16,flexWrap:'wrap',alignItems:'center'},
  choice:{padding:14,borderRadius:14,alignItems:'center',minWidth:80},
  dot:{width:44,height:44,borderRadius:22,borderWidth:3},
});
