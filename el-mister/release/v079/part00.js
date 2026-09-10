/* v0.7.9 connected play */
const _79sc=makeMatchScenario,_79rc=resolveMatchChoice,_79rd=renderLiveDecision,_79ctx=liveContextHtml;
function s79(){let l=S.live;if(!l)return null;l.c79??={fouls:0,lastF:-99,lastC:-99,lastB:-99,exposed:null,covered:null,chain:null};return l.c79}
function line79(){return typeof v06LiveLineup==='function'?v06LiveLineup():bestXI()}
function p79(pos,skill='ovr'){let a=line79().filter(p=>pos.includes(p.pos));if(!a.length)a=line79();return [...a].sort((x,y)=>(y.skills?.[skill]||y.ovr)-(x.skills?.[skill]||x.ovr))[0]}
function back79(){let a=line79().filter(p=>['LI','LD'].includes(p.pos));if(!a.length)return null,q=p=>typeof v061EnergyOf==='function'?v061EnergyOf(p):(p.fitness||75);let p=[...a].sort((x,y)=>q(x)-q(y))[0];return{p,e:q(p),side:p.pos==='LI'?'izquierda':'derecha'}}
function start79(type){let v=s79();v.chain={type,choices:[]};v.lastC=S.live.minute}
function tr79(t){s79()?.chain?.choices.push(t)}
function seq79(k,x={}){let l=S.live,m=l.minute,mc=p79(['MCO','MC','MCD'],'passing'),ex=p79(['EI','ED','MI','MD'],'technique'),dc=p79(['DC','SD'],'finishing'),lat=p79(['LI','LD'],'passing'),z={
 throw:{kind:'seq79',stage:1,t:'Saque lateral en mitad de cancha',d:`${m}' · El rival todavía se acomoda. La forma de sacar define cómo puede crecer esta misma jugada.`,o:[
  {t:`Corto con ${lat.name}`,h:'Buscás una devolución para progresar por afuera.',a:'wide'},{t:`Por dentro con ${mc.name}`,h:'Intentás recibir de frente entre líneas.',a:'inside'},{t:`Directo a ${dc.name}`,h:'Saltás líneas y peleás la segunda pelota.',a:'second'}]},
 wide:{kind:'seq79',stage:2,t:'Se arma un 2 contra 1 por la banda',d:`${m}' · ${ex.name} arrastra al marcador y aparece espacio.`,o:[
  {t:'Pasar por afuera',h:'Hay que superar al lateral antes de la cobertura.',mini:'dribble',ok:'line'},{t:'Meterla por dentro',h:'La defensa se abre y aparece un pase interior.',a:'inside'},{t:'Proteger y buscar el contacto',h:'Intentás que el defensor llegue tarde.',contact:1}]},
 inside:{kind:'seq79',stage:3,t:`${mc.name} recibe entre líneas`,d:`${m}' · La defensa retrocede y la jugada entra en zona de peligro.`,o:[
  {t:`Filtrar para ${dc.name}`,h:'Buscás romper la última línea.',mini:'through',ok:'finish'},{t:`Abrir con ${ex.name}`,h:'Llevás la jugada otra vez a la banda.',a:'duel'},{t:'Buscar la falta de frente',h:'Protegés cerca de la medialuna.',contact:2}]},
 second:{kind:'seq79',stage:2,t:'La segunda pelota queda viva',d:`${m}' · El delantero descarga y hay que resolver la presión rival.`,o:[
  {t:'Jugar dos pases rápidos',h:'Si salís de la presión aparece campo para atacar.',mini:'playout',ok:'inside'},{t:'Cerrar detrás de la pelota',h:'Evitás quedar abierto si la perdés.',end:'safe'},{t:'Abrir de primera a la banda',h:'Intentás acelerar la jugada.',mini:'through',ok:'duel'}]},
 duel:{kind:'seq79',stage:3,t:`${ex.name} queda mano a mano`,d:`${m}' · El lateral rival está solo y hay metros por delante.`,o:[
  {t:'Encara por afuera',h:'Buscás ganar la línea de fondo.',mini:'dribble',ok:'line'},{t:'Engancha hacia adentro',h:'Buscás perfil de remate.',mini:'dribble',ok:'finish'},{t:'Esperar apoyo',h:'No forzás y conservás la posesión.',end:'keep'}]},
 line:{kind:'seq79',stage:4,t:'Llegaste a la línea de fondo',d:`${m}' · Hay compañeros entrando al área y defensores corriendo hacia su arco.`,o:[
  {t:'Pase atrás',h:'Buscás al que llega de frente.',mini:'passback',ok:'first'},{t:'Centro al segundo palo',h:'Intentás encontrar una llegada limpia.',mini:'cross',ok:'first'},{t:'Frenar y buscar la falta',h:'El defensor viene lanzado.',contact:2}]},
 finish:{kind:'seq79',stage:4,t:`${dc.name} rompe la última línea`,d:`${m}' · El pase lo deja entrando al área con un defensor recuperando.`,o:[
  {t:'Rematar de primera',h:'No dejás acomodar al arquero.',mini:'first',goal:1},{t:'Controlar y perfilarse',h:'Ganás precisión pero vuelve la marca.',a:'shot'},{t:'Abrir al compañero',h:'Transformás el mano a mano en pase atrás.',mini:'passback',ok:'first'}]},
 shot:{kind:'seq79',stage:5,t:'Hay ángulo de remate',d:`${m}' · La jugada llegó a la puerta del área.`,o:[{t:'Remate colocado',h:'Buscás el palo lejano.',mini:'first',goal:1},{t:'Pase al medio',h:'Buscás una llegada de frente.',mini:'passback',ok:'first'},{t:'Amagar y buscar la falta',h:'Forzás otro duelo.',contact:2}]},
