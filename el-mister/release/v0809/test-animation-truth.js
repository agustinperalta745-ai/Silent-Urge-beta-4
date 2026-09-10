const fs=require('fs');
const vm=require('vm');
const assert=require('assert');
const patch=fs.readFileSync('el-mister/release/v0809/animation-truth.js','utf8');

let staged=0,drawn=0;
const canvas={id:'em80DecisionCanvas'};
const live={scenario:null,em804Scene:{old:true},em804SceneStamp:'old'};
const ctx={
  console,
  S:{live},
  document:{getElementById:id=>id==='em80DecisionCanvas'?canvas:null},
  em80Draw:(c,l)=>{assert.strictEqual(c,canvas);assert.strictEqual(l,live);drawn++},
  window:{
    em804SceneType:sc=>sc && sc.fakeType || null,
    em804StageScenario:()=>{staged++}
  }
};
vm.createContext(ctx);
vm.runInContext(patch,ctx);
assert.ok(ctx.window.em809AnimationTruth,'animation truth hook missing');

// 1) Una decisión contextual de zona debe dibujar exactamente el estado actual, sin staging.
live.scenario={kind:'seq79',em806ZoneKey:'us:attacking:left',fakeType:'wide'};
const before={ball:{x:18,y:27},players:[{x:11,y:44},{x:32,y:38}]};
live.visualState=JSON.parse(JSON.stringify(before));
ctx.window.em809AnimationTruth.drawDecision();
assert.strictEqual(staged,0,'zone-driven decision must never stage/teleport');
assert.strictEqual(drawn,1,'zone-driven decision must draw');
assert.deepStrictEqual(live.visualState,before,'visual state changed unexpectedly');

// 2) Incluso un escenario viejo de banda/medio no debe fabricar posiciones.
live.scenario={kind:'seq79',fakeType:'wide'};
ctx.window.em809AnimationTruth.drawDecision();
assert.strictEqual(staged,0,'legacy ordinary decision must not stage');
assert.strictEqual(drawn,2);

// 3) Penal, córner y tiro libre sí pueden preparar la puesta en juego.
for(const type of ['penalty','corner','freekick']){
  live.scenario={kind:'setpiece',fakeType:type};
  ctx.window.em809AnimationTruth.drawDecision();
}
assert.strictEqual(staged,3,'only real restarts should stage');
assert.strictEqual(drawn,5);

// 4) Remate/mano a mano/volea tampoco deben teletransportar la escena.
for(const type of ['longshot','oneonone','volley','edge','rebound','attack','defend','mid','buildout','striker']){
  live.scenario={kind:'seq79',fakeType:type};
  ctx.window.em809AnimationTruth.drawDecision();
}
assert.strictEqual(staged,3,'open-play scenarios must keep the live pitch state');
assert.strictEqual(drawn,15);

console.log('v0.8.9 animation truth regression tests: OK');
