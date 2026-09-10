const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const patch=fs.readFileSync('el-mister/release/v0809/animation-truth.js','utf8');

let hiddenStageCalls=0,drawn=0,saved=0,rendered=0;
const canvas={id:'em80DecisionCanvas'};
const us=[
  {idx:0,pos:'MC',x:30,y:50,tx:30,ty:50,vx:0,vy:0,active:true},
  {idx:1,pos:'ED',x:55,y:45,tx:55,ty:45,vx:0,vy:0,active:true},
  {idx:2,pos:'DC',x:34,y:31,tx:34,ty:31,vx:0,vy:0,active:true}
];
const them=[
  {idx:0,pos:'DFC',x:30,y:28,tx:30,ty:28,vx:0,vy:0,active:true},
  {idx:1,pos:'DC',x:34,y:67,tx:34,ty:67,vx:0,vy:0,active:true}
];
const live={
  minute:40,gh:0,ga:0,home:'a',away:'b',scenario:{kind:'seq79',em806ZoneKey:'us_midfield'},
  _state:{ball:{x:30,y:50,vx:0,vy:0,ownerTeam:'us',ownerIdx:0,lastTeam:'us',flight:null}},
  _v:{chain:{stage:'start'}}
};
const ctx={
  console,
  Math,
  S:{live},
  EM80_W:68,
  document:{
    getElementById:id=>id==='em80DecisionCanvas'?canvas:id==='modalRoot'?{innerHTML:''}:null,
    querySelectorAll:()=>[]
  },
  performance:{now:()=>0},
  requestAnimationFrame:cb=>{cb(1000);return 1},
  em80State:l=>l._state,
  em80Players:(team)=>team==='us'?us:them,
  em80P:(team,idx)=>(team==='us'?us:them).find(p=>p.idx===idx),
  em80Dir:team=>team==='us'?-1:1,
  em80Draw:(c,l)=>{assert.strictEqual(c,canvas);assert.strictEqual(l,live);drawn++},
  s79:()=>live._v,
  seq79:(k)=>({kind:'seq79',key:k,em806ZoneKey:'us_attacking'}),
  back79:()=>({}),
  save:()=>{saved++},
  renderLiveDecision:()=>{rendered++},
  go79:()=>{throw new Error('old go79 must be replaced')},
  window:{em806MoveForStage:()=>{hiddenStageCalls++}}
};
vm.createContext(ctx);
vm.runInContext(patch,ctx);
assert.ok(ctx.window.em809AnimationTruth,'animation truth hook missing');

// 1) Dibujar una decisión jamás puede recolocar la cancha, ni siquiera en una pelota parada.
const before=JSON.stringify({ball:live._state.ball,us,them});
for(const key of ['open_play','penalty','corner','freekick']){
  live.scenario={kind:key==='open_play'?'seq79':'keyplay',key,em806ZoneKey:key==='open_play'?'us_midfield':undefined};
  ctx.em80DrawDecision();
}
assert.strictEqual(JSON.stringify({ball:live._state.ball,us,them}),before,'drawing a decision changed the live pitch state');
assert.strictEqual(hiddenStageCalls,0,'legacy staging must never run while drawing');
assert.strictEqual(drawn,4,'every decision draw should render the actual live state');

// 2) El plan de una continuación sale de la posición REAL, no de coordenadas prefabricadas.
const widePlan=ctx.window.em809AnimationTruth.planTransition('wide',live);
assert.ok(widePlan,'wide transition plan missing');
assert.strictEqual(widePlan.fromBall.x,30);
assert.strictEqual(widePlan.fromBall.y,50);
assert.strictEqual(widePlan.to.y,40,'wide progression should advance relative to the real ball position');
assert.strictEqual(widePlan.p.idx,1,'wide transition should find the winger');

// 3) go79 debe mostrar el recorrido y recién después fijar la nueva situación.
ctx.go79('wide');
assert.strictEqual(hiddenStageCalls,0,'v0.8.6 hidden moveForStage must not be called');
assert.ok(drawn>=6,'the transition must draw before and during the visible movement');
assert.strictEqual(live._state.ball.ownerTeam,'us');
assert.strictEqual(live._state.ball.ownerIdx,1);
assert.strictEqual(live._state.ball.y,40);
assert.strictEqual(live.scenario.key,'wide');
assert.strictEqual(live._v.chain.stage,'wide');
assert.strictEqual(live.em809Transitioning,false);
assert.ok(saved>=1,'finished transition should save state');
assert.strictEqual(rendered,1,'next decision should render only after movement finishes');

console.log('v0.8.9 visual continuity regression tests: OK');
