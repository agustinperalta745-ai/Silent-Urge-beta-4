(function(global){
  'use strict';

  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const lerp=(a,b,t)=>a+(b-a)*t;
  const rnd=(a,b)=>a+Math.random()*(b-a);
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  const FORMATION_433=[
    ['GK',5,32],['LB',18,10],['LCB',15,24],['RCB',15,40],['RB',18,54],
    ['LCM',38,18],['CM',35,32],['RCM',38,46],['LW',60,10],['ST',66,32],['RW',60,54]
  ];

  class Match2DEngine{
    constructor(opts={}){
      this.width=100; this.height=64;
      this.msPerMatchMinute=opts.msPerMatchMinute||850;
      this.tickMs=opts.tickMs||80;
      this.onFrame=opts.onFrame||(()=>{});
      this.onEvent=opts.onEvent||(()=>{});
      this.onClock=opts.onClock||(()=>{});
      this.timer=null;
      this.lastTs=0;
      this.reset();
    }

    reset(){
      this.state={
        minute:0, running:false, paused:false, pauseReason:null, finished:false,
        score:{home:0,away:0}, possession:'home', phase:'settled', phaseTime:0,
        ball:{x:50,y:32,vx:0,vy:0,owner:null,lastTeam:'home'},
        tactics:{home:this.defaultTactics(),away:this.defaultTactics()},
        players:[...this.makeTeam('home'),...this.makeTeam('away')],
        visualDecision:null,events:[]
      };
      this.assignBall('home',6);
      this.emitFrame();
    }

    defaultTactics(){return {lineHeight:0,width:0,press:0,tempo:0,directness:0,fullbacks:0,compactness:0,risk:0};}

    makeTeam(team){
      return FORMATION_433.map((f,i)=>{
        const mirrored=team==='away';
        const bx=mirrored?100-f[1]:f[1];
        return {id:`${team}-${i}`,team,role:f[0],number:i+1,x:bx,y:f[2],baseX:bx,baseY:f[2],tx:bx,ty:f[2],speed:rnd(.84,1.08)};
      });
    }

    start(snapshot={}){
      if(snapshot.score){this.state.score.home=Number(snapshot.score.home)||0;this.state.score.away=Number(snapshot.score.away)||0;}
      if(Number.isFinite(snapshot.minute))this.state.minute=clamp(snapshot.minute,0,90);
      this.state.running=true;this.state.paused=false;this.state.finished=false;this.lastTs=Date.now();this.schedule();this.onEvent({type:'start'});
    }
    stop(){this.state.running=false;if(this.timer){clearTimeout(this.timer);this.timer=null;}}
    pause(reason='external'){this.state.paused=true;this.state.pauseReason=reason;this.onEvent({type:'pause',reason});this.emitFrame();}
    resume(){if(this.state.finished)return;this.state.paused=false;this.state.pauseReason=null;this.lastTs=Date.now();if(this.state.running)this.schedule();this.onEvent({type:'resume'});}
    sync(snapshot={}){
      if(Number.isFinite(snapshot.minute))this.state.minute=clamp(snapshot.minute,0,90);
      if(snapshot.score){if(Number.isFinite(snapshot.score.home))this.state.score.home=snapshot.score.home;if(Number.isFinite(snapshot.score.away))this.state.score.away=snapshot.score.away;}
      if(snapshot.possession==='home'||snapshot.possession==='away')this.state.possession=snapshot.possession;
      this.emitFrame();
    }

    applyVisualDecision(choice,team='home'){
      if(!choice)return;
      const t=this.state.tactics[team],key=choice.set||choice.visualSet||'';
      const map={
        pressHigh:{lineHeight:.95,press:1,tempo:.55,risk:.45},lowBlock:{lineHeight:-.95,press:-.65,compactness:.9,tempo:-.35,risk:-.45},
        fullbacksHigh:{fullbacks:1,width:.75,lineHeight:.3,risk:.3},coverFlanks:{fullbacks:-.2,width:.25,compactness:.5,risk:-.15},
        possession:{tempo:-.2,directness:-.9,compactness:.25,risk:-.2},direct:{tempo:.45,directness:1,risk:.25},
        controlledAttack:{lineHeight:.35,tempo:.25,risk:.05},extraForward:{lineHeight:.5,compactness:-.2,risk:.65},
        manageEnergy:{tempo:-.55,press:-.45,risk:-.25},shootMore:{tempo:.25,directness:.35,risk:.2},
        targetBooked:{width:.45,tempo:.35,risk:.15},diagonal:{width:.2,directness:.45,tempo:.2},holdPosition:{compactness:.55,lineHeight:-.1,risk:-.2},
        calmDuels:{press:-.25,risk:-.25},coverBooked:{compactness:.6,press:-.1,risk:-.15},aggressiveBooked:{press:.55,risk:.55}
      };
      const preset=map[key];if(preset)Object.assign(t,preset);
      if(choice.e){const att=Number(choice.e.att)||0,def=Number(choice.e.def)||0;t.lineHeight=clamp(t.lineHeight+att*9-def*5,-1,1);t.risk=clamp(t.risk+att*7-def*5,-1,1);}
      this.state.visualDecision={team,key:key||choice.t||'decision',label:choice.t||key,minute:this.state.minute};
      this.onEvent({type:'visualDecision',team,key,label:choice.t||key});this.emitFrame();
    }
    clearVisualDecision(team='home'){this.state.tactics[team]=this.defaultTactics();this.state.visualDecision=null;}
    schedule(){if(this.timer||!this.state.running||this.state.finished)return;this.timer=setTimeout(()=>{this.timer=null;this.tick();},this.tickMs);}
    tick(){
      if(!this.state.running||this.state.finished)return;
      const now=Date.now(),dt=Math.min(220,Math.max(16,now-this.lastTs));this.lastTs=now;
      if(!this.state.paused){this.state.minute+=dt/this.msPerMatchMinute;if(this.state.minute>=90){this.state.minute=90;this.state.finished=true;this.stop();this.onEvent({type:'finished'});}this.updatePlay(dt/1000);this.onClock(this.state.minute);}
      this.emitFrame();if(!this.state.finished)this.schedule();
    }
    updatePlay(dt){const s=this.state;s.phaseTime-=dt;if(s.phaseTime<=0)this.nextPhase();this.updateTargets();for(const p of s.players){const gain=clamp(dt*(1.6+p.speed*.9),0,.28);p.x=lerp(p.x,p.tx,gain);p.y=lerp(p.y,p.ty,gain);}this.updateBall(dt);}
    nextPhase(){
      const s=this.state,atk=s.possession,def=atk==='home'?'away':'home',at=s.tactics[atk],dt=s.tactics[def],pressure=Math.max(0,dt.press*.12),direct=Math.max(0,at.directness*.16),roll=Math.random();
      if(roll<.08+pressure){s.possession=def;s.phase='turnover';s.phaseTime=rnd(.35,.8);s.ball.lastTeam=def;const candidates=s.players.filter(p=>p.team===def&&['LCM','CM','RCM','LW','RW'].includes(p.role));this.assignBall(def,Math.floor(Math.random()*candidates.length),candidates);this.onEvent({type:'turnover',team:def});}
      else if(roll<.28+direct){s.phase='vertical';s.phaseTime=rnd(.55,1.15);this.passForward(atk,true);}
      else if(roll<.78){s.phase='circulation';s.phaseTime=rnd(.55,1.2);this.passForward(atk,false);}
      else{s.phase='attack';s.phaseTime=rnd(.5,1.05);this.createAttack(atk);}
    }
    assignBall(team,index=0,list=null){const arr=list||this.state.players.filter(p=>p.team===team);if(!arr.length)return;const p=arr[clamp(index,0,arr.length-1)];this.state.ball.owner=p.id;this.state.ball.x=p.x;this.state.ball.y=p.y;this.state.ball.lastTeam=team;this.state.possession=team;}
    passForward(team,direct){const arr=this.state.players.filter(p=>p.team===team),owner=arr.find(p=>p.id===this.state.ball.owner)||arr[5],dir=team==='home'?1:-1;let targets=arr.filter(p=>dir*(p.x-owner.x)>4);if(!targets.length)targets=arr;targets.sort((a,b)=>dir*(b.x-a.x));const target=direct?targets[Math.floor(Math.random()*Math.min(4,targets.length))]:targets[Math.floor(Math.random()*targets.length)];this.kickTo(target.x,target.y,target.id,direct?28:18);}
    createAttack(team){
      const arr=this.state.players.filter(p=>p.team===team&&['LW','ST','RW','LCM','RCM'].includes(p.role)),target=arr[Math.floor(Math.random()*arr.length)],goalX=team==='home'?96:4,t=this.state.tactics[team];
      if(Math.random()<.28+Math.max(0,t.risk)*.12){this.kickTo(goalX,rnd(25,39),null,34);this.onEvent({type:'shot',team});setTimeout(()=>{if(this.state.paused||this.state.finished)return;const goalChance=.07+Math.max(0,t.risk)*.018;if(Math.random()<goalChance){this.state.score[team]++;this.onEvent({type:'goal',team,minute:this.state.minute,score:{...this.state.score}});}const other=team==='home'?'away':'home';this.assignBall(other,0);},340);}else if(target)this.kickTo(target.x,target.y,target.id,22);
    }
    kickTo(x,y,ownerAfter,speed){const b=this.state.ball,dx=x-b.x,dy=y-b.y,d=Math.max(.01,Math.hypot(dx,dy));b.owner=null;b.vx=dx/d*speed;b.vy=dy/d*speed;b.target={x,y,ownerAfter};}
    updateBall(dt){const b=this.state.ball;if(b.owner){const p=this.state.players.find(x=>x.id===b.owner);if(p){b.x=lerp(b.x,p.x,.55);b.y=lerp(b.y,p.y,.55);}return;}b.x+=b.vx*dt;b.y+=b.vy*dt;if(b.target&&Math.hypot(b.target.x-b.x,b.target.y-b.y)<2.1){b.x=b.target.x;b.y=b.target.y;if(b.target.ownerAfter)b.owner=b.target.ownerAfter;b.target=null;b.vx=0;b.vy=0;}b.x=clamp(b.x,0,100);b.y=clamp(b.y,0,64);}
    updateTargets(){
      const s=this.state;for(const p of s.players){const t=s.tactics[p.team],dir=p.team==='home'?1:-1;let x=p.baseX,y=p.baseY;x+=dir*t.lineHeight*8;if(p.role==='LB'||p.role==='RB')x+=dir*t.fullbacks*13;if(['LW','RW'].includes(p.role))x+=dir*t.risk*5;if(p.role==='ST')x+=dir*t.directness*4;y=32+(y-32)*(1+t.width*.18-t.compactness*.22);const hasBall=s.possession===p.team;if(hasBall){x+=dir*(5+t.tempo*2.5);if(s.ball.owner===p.id)x+=dir*3;}else if(t.press>0){x=lerp(x,s.ball.x,clamp(.10+t.press*.12,0,.3));y=lerp(y,s.ball.y,clamp(.08+t.press*.1,0,.25));}p.tx=clamp(x,3,97);p.ty=clamp(y,3,61);}
    }
    snapshot(){return JSON.parse(JSON.stringify({minute:this.state.minute,score:this.state.score,paused:this.state.paused,pauseReason:this.state.pauseReason,possession:this.state.possession,ball:this.state.ball,players:this.state.players,tactics:this.state.tactics,visualDecision:this.state.visualDecision,finished:this.state.finished}));}
    emitFrame(){this.onFrame(this.snapshot());}
  }
  global.Match2DEngine=Match2DEngine;if(typeof module!=='undefined'&&module.exports)module.exports={Match2DEngine};
})(typeof window!=='undefined'?window:globalThis);
