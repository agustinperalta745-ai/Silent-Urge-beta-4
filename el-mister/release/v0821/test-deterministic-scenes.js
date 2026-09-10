const fs=require('fs');
const p=process.argv[2]||'el-mister/scenematch/scenematch-v0821.js';
const s=fs.readFileSync(p,'utf8');
const checks=[
  [!s.includes('Math.random'),'visual module must not use Math.random'],
  [!s.includes('requestAnimationFrame'),'visual module must not run an autonomous RAF loop'],
  [s.includes("mode:'deterministic-keyframes'"),'deterministic keyframe marker missing'],
  [s.includes('randomVisual:false'),'random visual guard missing'],
  [s.includes('aspect-ratio:64/100'),'pitch must be portrait'],
  [s.includes('viewBox="0 0 64 100"'),'SVG must match portrait pitch'],
  [s.includes('f.arrows.length<2'),'arrows must be limited'],
  [s.includes('approachPoint'),'defenders must approach without collapsing on the ball'],
  [s.includes('startFrames(play)'),'scripted frame playback missing'],
  [s.includes('simulateSegment(to)'),'historical match engine must remain authoritative'],
  [!s.includes('.scenario=null'),'visual layer must never clear a historical scenario'],
  [!s.includes('El partido se resuelve con el sistema histórico'),'internal implementation hint must not be shown to players'],
  [s.includes("if(flags.offensive)shift+=dir*3.0;"),'offensive shape direction is wrong'],
  [s.includes("if(flags.defensive)shift+=-dir*2.5;"),'defensive shape direction is wrong'],
  [s.includes('removeDismissed'),'red-card visual removal missing']
];
for(const [ok,msg] of checks){if(!ok){console.error('FAIL:',msg);process.exit(1)}}
console.log('v0.8.21 deterministic scene guards: OK');
