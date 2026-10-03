import {effectSamples} from './sound-effects.js?v=character-depth-6';
import {loadRecordedEffects} from './recorded-effects.js?v=reference-audio-1';
export class SchoolAudio {
  constructor() { this.volume = .5; this.muted = false; this.effects=new Set(); this.effectBuffers=new Map(); this.recordedBuffers=new Map(); this.foot=0; this.lastStep=-Infinity; }
  async start() {
    const request=this.request=(this.request||0)+1;this.requested=true;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) throw new Error('이 브라우저는 오디오 재생을 지원하지 않습니다.');
    if (!this.ctx) {
      this.ctx = new Audio();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0;
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.samples = new Float32Array(this.analyser.fftSize);
      this.master.connect(this.analyser).connect(this.ctx.destination);
      this.ambient = this.ctx.createGain();
      this.ambient.gain.value = .7;
      this.ambient.connect(this.master);
      // Quiet drones and fluorescent hum. Same bed for normal and abnormal rooms.
      [[55,.09],[82.7,.035],[110,.035],[196,.055],[207.65,.025],[329.63,.025]].forEach(([frequency, level]) => {
        const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
        osc.frequency.value = frequency; gain.gain.value = level;
        osc.connect(gain).connect(this.ambient); osc.start();
      });
      const lfo = this.ctx.createOscillator(); const depth = this.ctx.createGain();
      lfo.frequency.value = .13; depth.gain.value = .12;
      lfo.connect(depth).connect(this.ambient.gain); lfo.start();
      // A seamless, slow music phrase in a range laptop speakers can reproduce.
      const duration = 24, rate = this.ctx.sampleRate;
      const buffer = this.ctx.createBuffer(1, duration * rate, rate);
      const data = buffer.getChannelData(0);
      [293.66,277.18,220,233.08,293.66,349.23,277.18,220].forEach((frequency, note) => {
        const offset = note * 3 * rate;
        for (let i = 0; i < 2.7 * rate; i++) {
          const t = i / rate;
          const envelope = Math.min(t / .12, 1) * Math.pow(1 - t / 2.7, 2);
          data[offset + i] += .14 * envelope * (Math.sin(2 * Math.PI * frequency * t) + .2 * Math.sin(4 * Math.PI * frequency * t));
        }
      });
      this.music = this.ctx.createBufferSource(); this.music.buffer = buffer; this.music.loop = true;
      this.music.connect(this.ambient); this.music.start();
    }
    this.ambient.gain.cancelScheduledValues(this.ctx.currentTime);
    this.ambient.gain.setTargetAtTime(.7, this.ctx.currentTime, .2);
    await this.ctx.resume();
    if(request!==this.request){if(!this.requested)await this.ctx.suspend();return;}
    this.update();
    await this.loadEffectFiles();
  }
  loadEffectFiles(fetcher = globalThis.fetch) {
    if (!this.ctx) return Promise.resolve([]);
    if (!this.effectLoad) {
      this.effectLoad = loadRecordedEffects(this.ctx, this.recordedBuffers, fetcher)
        .finally(() => { this.effectLoad = null; });
    }
    return this.effectLoad;
  }
  update() { if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, .15); }
  level() {
    if (!this.ctx || this.ctx.state !== 'running') return 0;
    this.analyser.getFloatTimeDomainData(this.samples);
    return Math.sqrt(this.samples.reduce((sum, sample) => sum + sample * sample, 0) / this.samples.length);
  }
  async test() {
    await this.start();
    this.tone(523.25,.5,.22); this.tone(659.25,.6,.18,.4);
  }
  tone(frequency, duration = .4, level = .13, delay = 0) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + delay, osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, t); gain.gain.linearRampToValueAtTime(level, t + .04); gain.gain.exponentialRampToValueAtTime(.0001, t + duration);
    osc.connect(gain).connect(this.master); osc.start(t); osc.stop(t + duration + .05);
    osc.onended = () => { osc.disconnect(); gain.disconnect(); };
  }
  playEffect(kind,level,variant=0) {
    if(!this.ctx||this.ctx.state!=='running'||this.muted||this.volume===0)return false;
    const key=`${kind}:${variant}`;
    const recorded=this.recordedBuffers.get(kind);
    if(!recorded&&!this.effectBuffers.has(key)){
      const samples=effectSamples(kind,this.ctx.sampleRate,variant),buffer=this.ctx.createBuffer(1,samples.length,this.ctx.sampleRate);
      buffer.getChannelData(0).set(samples);this.effectBuffers.set(key,buffer);
    }
    const source=this.ctx.createBufferSource(),gain=this.ctx.createGain();
    source.buffer=recorded||this.effectBuffers.get(key);gain.gain.value=level;source.connect(gain);gain.connect(this.master);
    const effect={source,gain};this.effects.add(effect);
    source.onended=()=>{source.disconnect();gain.disconnect();this.effects.delete(effect);};
    source.start();this.onEffect?.(kind,{source:recorded?'recording':'synthesis'});return true;
  }
  footstep(scene='corridor') {
    if(!this.ctx||this.ctx.currentTime-this.lastStep<.18)return false;
    if(!this.playEffect('footstep',scene==='classroom'?.24:.32,this.foot%2))return false;
    this.lastStep=this.ctx.currentTime;this.foot++;return true;
  }
  jumpscare(){return this.playEffect('jumpscare',.58);}
  doorSlide(){return this.playEffect('door-slide',.27);}
  babyCry(){return this.playEffect('baby-cry',.14);}
  ghostLaugh(){return this.playEffect('ghost-laugh',.24);}
  catMeow(variant=0){return this.playEffect('cat-meow',.16,variant);}
  clearEffects(){
    for(const {source,gain} of this.effects){source.onended=null;source.stop();source.disconnect();gain.disconnect();}
    this.effects.clear();this.lastStep=-Infinity;this.foot=0;
  }
  // Short, soft toy/broadcast cues. All tones route through master gain,
  // so mute and the player's volume also apply to these effects.
  cue(name) {
    const phrases = {
      'key-pickup': [[659.25, .22, .035, 0], [523.25, .3, .025, .12]],
      'door-unlock': [[220, .65, .04, 0], [233.08, .6, .025, .08], [440, .3, .018, .3]],
      'doll-rise': [[174.61,.12,.025,0],[185,.45,.025,.08],[349.23,.28,.013,.18]],
      'mascot-reveal': [[130.81, .7, .04, 0], [138.59, .65, .03, .04], [277.18, .35, .012, .18]],
    };
    if (!Object.hasOwn(phrases, name)) return false;
    phrases[name].forEach(args => this.tone(...args));
    return true;
  }
  inspect() { this.tone(220,.15,.045); }
  result(correct) { if (correct) this.tone(440,.65,.09); else {this.tone(65,.8,.13); this.tone(69,.8,.1);} }
  end() { if (this.ctx) this.ambient.gain.setTargetAtTime(.12,this.ctx.currentTime,1); [261.6,329.6,392].forEach((f,i)=>this.tone(f,2,.08,i*.3)); }
  async stop() { this.request=(this.request||0)+1;this.requested=false;this.clearEffects(); if (this.ctx) { this.master.gain.cancelScheduledValues(this.ctx.currentTime); this.master.gain.value = 0; this.ambient.gain.cancelScheduledValues(this.ctx.currentTime); this.ambient.gain.value = .7; await this.ctx.suspend(); } }
}
