export class SchoolAudio {
  constructor() { this.volume = .5; this.muted = false; }
  async start() {
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
    this.ambient.gain.setTargetAtTime(.7, this.ctx.currentTime, .2);
    await this.ctx.resume(); this.update();
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
  inspect() { this.tone(220,.15,.045); }
  result(correct) { if (correct) this.tone(440,.65,.09); else {this.tone(65,.8,.13); this.tone(69,.8,.1);} }
  end() { if (this.ctx) this.ambient.gain.setTargetAtTime(.12,this.ctx.currentTime,1); [261.6,329.6,392].forEach((f,i)=>this.tone(f,2,.08,i*.3)); }
  async stop() { if (this.ctx) { this.master.gain.cancelScheduledValues(this.ctx.currentTime); this.master.gain.value = 0; await this.ctx.suspend(); this.ambient.gain.value = .7; } }
}
