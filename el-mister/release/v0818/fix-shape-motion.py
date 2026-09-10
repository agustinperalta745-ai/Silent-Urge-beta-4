from pathlib import Path

p=Path('el-mister/match2d/match2d-v0818.js')
s=p.read_text(encoding='utf-8')

a=s.index('  function roleLayout818')
b=s.index('  function ensureVisual818',a)
layout="""  const FORMATION_VISUAL_FALLBACK={
    '4-3-3':[{pos:'EI',x:18,y:19},{pos:'DC',x:50,y:15},{pos:'ED',x:82,y:19},{pos:'MC',x:29,y:44},{pos:'MCD',x:50,y:55},{pos:'MC',x:71,y:44},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-2-3-1':[{pos:'DC',x:50,y:15},{pos:'EI',x:19,y:36},{pos:'MCO',x:50,y:34},{pos:'ED',x:81,y:36},{pos:'MCD',x:36,y:56},{pos:'MCD',x:64,y:56},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}],
    '4-4-2':[{pos:'DC',x:36,y:17},{pos:'DC',x:64,y:17},{pos:'EI',x:17,y:43},{pos:'MC',x:39,y:48},{pos:'MC',x:61,y:48},{pos:'ED',x:83,y:43},{pos:'LI',x:15,y:72},{pos:'DFC',x:38,y:75},{pos:'DFC',x:62,y:75},{pos:'LD',x:85,y:72},{pos:'ARQ',x:50,y:90}]
  };

  function formationName818(team,l){
    if(team===userSide818(l))return (S.formation&&FORMATION_VISUAL_FALLBACK[S.formation])?S.formation:'4-2-3-1';
    const explicit=l?.opponentFormation||l?.rivalFormation||l?.aiFormation||l?.em818OpponentFormation;
    if(explicit&&FORMATION_VISUAL_FALLBACK[explicit])return explicit;
    const forms=['4-2-3-1','4-3-3','4-4-2'],id=String(team==='home'?l?.home:l?.away||'rival');
    let h=0;for(let i=0;i<id.length;i++)h=((h*31)+id.charCodeAt(i))|0;
    const picked=forms[Math.abs(h)%forms.length];
    if(l)l.em818OpponentFormation=picked;
    return picked;
  }

  function formationSlots818(form){
    try{if(typeof FORMATION_SLOTS!=='undefined'&&Array.isArray(FORMATION_SLOTS[form])&&FORMATION_SLOTS[form].length===11)return FORMATION_SLOTS[form]}catch(e){}
    return FORMATION_VISUAL_FALLBACK[form]||FORMATION_VISUAL_FALLBACK['4-2-3-1'];
  }

  function roleLayout818(team,l){
    const form=formationName818(team,l),source=formationSlots818(form).slice(0,11);
    return source.map(slot=>{
      let x=8+(90-clamp818(Number(slot.y)||50,10,92))*.78;
      let y=4+clamp818(Number(slot.x)||50,4,96)*.56;
      if(team==='away')x=100-x;
      return {role:slot.pos||'MC',x:clamp818(x,5,95),y:clamp818(y,5,59),formation:form};
    });
  }

  function makePlayers818(team,l){
    return roleLayout818(team,l).map((slot,i)=>({
      id:`${team}-${i}`,team,idx:i,role:slot.role,formation:slot.formation,
      x:slot.x,y:slot.y,baseX:slot.x,baseY:slot.y,tx:slot.x,ty:slot.y,
      speed:rnd818(.82,1.08),seed:(team==='home'?17:43)+i*13+(i%3)*7
    }));
  }

"""
s=s[:a]+layout+s[b:]

a=s.index('  function applySavedPlan818')
b=s.index('  function assignBall818',a)
saved="""  function applySavedPlan818(l=S.live){
    if(!l||!EM818.visual)return;
    const side=userSide818(l),p=l.em818VisualPlan;
    if(p?.side&&p.plan)EM818.visual.plans[p.side]={...defaultPlan818(),...p.plan};
    else{
      const plan=EM818.visual.plans[side];
      if(S.tactic==='Ofensivo'){Object.assign(plan,planPreset818('controlledAttack')||{});plan.label='Ofensivo';plan.key='controlledAttack'}
      else if(S.tactic==='Defensivo'){Object.assign(plan,planPreset818('lowBlock')||{});plan.label='Defensivo';plan.key='lowBlock'}
      else{plan.label='Equilibrado';plan.key='balanced'}
    }
    const plan=EM818.visual.plans[side];
    if(l.context?.pressHigh){Object.assign(plan,planPreset818('pressHigh')||{});plan.label=p?.label||'Presión alta'}
    if(l.context?.lowBlock){Object.assign(plan,planPreset818('lowBlock')||{});plan.label=p?.label||'Bloque bajo'}
    if(l.context?.fullbacksHigh){Object.assign(plan,planPreset818('fullbacksHigh')||{});plan.label=p?.label||'Laterales altos'}
  }

"""
s=s[:a]+saved+s[b:]

a=s.index('  function updateTargets818')
b=s.index('  function updateBall818',a)
movement="""  function group818(role){
    if(role==='ARQ'||role==='GK')return 'GK';
    if(['LI','LD','LB','RB','DFC','CB','LCB','RCB'].includes(role))return 'DEF';
    if(['MCD','MC','MCO','CM','CDM','CAM','LCM','RCM'].includes(role))return 'MID';
    return 'ATT';
  }
  function isWide818(p){return ['LI','LD','LB','RB','EI','ED','LW','RW'].includes(p.role)}
  function isFullback818(p){return ['LI','LD','LB','RB'].includes(p.role)}
  function dBall818(p,b){return Math.hypot(p.x-b.x,(p.y-b.y)*1.15)}
  function clampAround818(v,base,r){return clamp818(v,base-r,base+r)}

  function individualTarget818(p,v,plan,rank,now){
    const dir=p.team==='home'?1:-1,b=v.ball,g=group818(p.role),has=v.possession===p.team,owner=b.owner===p.id;
    const phase=(Number(p.seed)||1)*.73,slow=Math.sin(now*(.68+(p.idx%4)*.07)+phase),sideWave=Math.cos(now*(.52+(p.idx%5)*.045)+phase*1.7);
    let x=p.baseX,y=p.baseY;
    const lineWeight=g==='DEF'?6.2:g==='MID'?7.6:g==='ATT'?4.3:1.0;
    x+=dir*plan.line*lineWeight;
    const widthWeight=isWide818(p)?1.0:g==='MID'?.62:g==='ATT'?.55:.28;
    y=32+(y-32)*(1+plan.width*.22*widthWeight-plan.compact*.18*(g==='DEF'?.78:1));
    if(isFullback818(p))x+=dir*plan.fullbacks*13;
    if(g==='ATT')x+=dir*plan.direct*2.7;

    if(g==='GK'){
      const ownGoal=p.team==='home'?5:95;
      x=lerp818(x,ownGoal,.78);y=lerp818(y,b.y,.16);
      x+=slow*.18;y+=sideWave*.28;
      return {x:clamp818(x,3,97),y:clamp818(y,8,56)};
    }

    if(has){
      if(owner){
        const maxRun=g==='ATT'?12:g==='MID'?9:6;
        x=clampAround818(p.x+dir*(1.2+Math.max(-.2,plan.tempo)*.8),p.baseX,maxRun);
        y=lerp818(y,b.y,.22)+sideWave*(g==='ATT'?1.15:.72);
      }else if(g==='ATT'){
        const lane=p.baseY<28?-1:p.baseY>36?1:0,run=3.2+Math.max(0,plan.risk)*3.3+(p.idx%3)*.75;
        x+=dir*run;
        if(isWide818(p))y+=lane*(1.7+Math.max(0,plan.width)*2.5)+sideWave*1.0;
        else y=lerp818(y,b.y,.10)+sideWave*.85;
      }else if(g==='MID'){
        if(rank<=1){x=lerp818(x,b.x-dir*(6+rank*3),.22);y=lerp818(y,b.y+(rank===0?-7:7),.18)}
        else{x+=dir*(1.0+Math.max(0,plan.tempo)*1.3);y+=sideWave*.72}
      }else{
        x+=dir*(.5+(p.idx%2)*.7+Math.max(0,plan.line)*1.2);
        y=lerp818(y,b.y,.035+(p.idx%3)*.012)+sideWave*.38;
      }
    }else{
      if(rank===0){
        const chase=g==='ATT'?18:g==='MID'?16:12,amount=.43+Math.max(0,plan.press)*.20;
        x=clampAround818(lerp818(x,b.x,amount),p.baseX,chase);
        y=clampAround818(lerp818(y,b.y,.56+Math.max(0,plan.press)*.15),p.baseY,chase*.72);
      }else if(rank===1){
        const coverX=b.x-dir*(5.5+(g==='DEF'?2:0));
        x=clampAround818(lerp818(x,coverX,.24),p.baseX,g==='DEF'?9:12);
        y=clampAround818(lerp818(y,b.y,.28),p.baseY,9);
      }else{
        const lateral=g==='MID'?.10:g==='DEF'?.065:.055;
        y=lerp818(y,b.y,lateral)+sideWave*(g==='ATT'?.50:g==='MID'?.42:.28);
        if(g==='MID')x-=dir*(.5+Math.max(0,-plan.line)*1.4);
        if(g==='ATT')x-=dir*(1.0+Math.max(0,plan.compact)*1.4);
      }
    }
    const amp=g==='ATT'?.70:g==='MID'?.55:.32;
    x+=slow*amp*.45;y+=sideWave*amp;
    return {x:clamp818(x,3,97),y:clamp818(y,3,61)};
  }

  function updateTargets818(l=S.live){
    const v=EM818.visual;if(!v||!l)return;
    applySavedPlan818(l);
    const now=now818()/1000,ranks={};
    for(const team of ['home','away'])ranks[team]=v.players.filter(p=>p.team===team&&group818(p.role)!=='GK').sort((a,b)=>dBall818(a,v.ball)-dBall818(b,v.ball));
    for(const p of v.players){
      const plan=v.plans[p.team],rank=Math.max(0,ranks[p.team].indexOf(p)),t=individualTarget818(p,v,plan,rank,now);
      p.tx=t.x;p.ty=t.y;
    }
  }

"""
s=s[:a]+movement+s[b:]

assert "if(v.possession===p.team)x+=dir*(4.5+plan.tempo*2.4)" not in s
assert 'formationSlots818' in s and 'S.formation' in s
assert 'individualTarget818' in s
assert s.count("'4-3-3'")>=2 and s.count("'4-2-3-1'")>=2 and s.count("'4-4-2'")>=2
p.write_text(s,encoding='utf-8')

wf=Path('.github/workflows/el-mister-v0818-prepare.yml')
w=wf.read_text(encoding='utf-8')
needle="      - '.github/workflows/el-mister-v0818-prepare.yml'\n"
addition=needle+"      - 'el-mister/match2d/match2d-v0818.js'\n"
if "el-mister/match2d/match2d-v0818.js" not in w:
    assert needle in w
    w=w.replace(needle,addition,1)
    wf.write_text(w,encoding='utf-8')
