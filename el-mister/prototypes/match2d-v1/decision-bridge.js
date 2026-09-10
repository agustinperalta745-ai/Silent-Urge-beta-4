(function(global){
  'use strict';
  class HistoricalDecisionBridge{
    constructor(engine,opts={}){this.engine=engine;this.onResolve=opts.onResolve||null;this.pendingScenario=null;this.enabled=true;}
    pauseForScenario(scenario){if(!scenario||!Array.isArray(scenario.o)||!scenario.o.length)return false;this.pendingScenario=scenario;this.engine.pause('historical-decision');return true;}
    mirrorChoice(index,team='home'){const s=this.pendingScenario;if(!s||!s.o||!s.o[index])return false;const choice=s.o[index];this.engine.applyVisualDecision(choice,team);this.pendingScenario=null;return true;}
    resumeAfterHistoricalResolution(){this.engine.resume();}
    failVisualOnly(err){try{console.error('[Match2D visual]',err);}catch(_){}this.engine.stop();return {scenarioStillPending:!!this.pendingScenario};}
  }
  global.HistoricalDecisionBridge=HistoricalDecisionBridge;if(typeof module!=='undefined'&&module.exports)module.exports={HistoricalDecisionBridge};
})(typeof window!=='undefined'?window:globalThis);
