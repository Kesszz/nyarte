/* MATÉRIA // LAB — síntese sonora generativa (Web Audio API) */
window.M = window.M || {};
(function (M) {
  const SC = {
    texture: [110, 130.81, 164.81, 196, 220, 261.63, 329.63, 392],
    ferro: [98, 116.54, 146.83, 174.61, 196, 233.08, 293.66, 349.23],
    cosmic: [87.31, 130.81, 174.61, 220, 261.63, 349.23, 440, 523.25],
    generative: [130.81, 146.83, 164.81, 196, 220, 261.63, 293.66, 329.63],
    molecular: [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23, 392],
    crystal: [261.63, 329.63, 392, 493.88, 587.33, 659.25, 783.99, 987.77]
  };
  class Audio {
    constructor() { this.ctx = null; this.on = false; this.lab = 'texture'; this.last = 0; this.drones = []; }
    init() {
      if (this.ctx) return true;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      try {
        const c = this.ctx = new AC();
        this.master = c.createGain(); this.master.gain.value = 0.0001;
        this.filter = c.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.frequency.value = 500; this.filter.Q.value = 1.2;
        this.delay = c.createDelay(1.5); this.delay.delayTime.value = 0.41;
        const fb = c.createGain(); fb.gain.value = 0.34;
        const df = c.createBiquadFilter(); df.type = 'lowpass'; df.frequency.value = 1600;
        this.delay.connect(df); df.connect(fb); fb.connect(this.delay); df.connect(this.master);
        this.filter.connect(this.master); this.master.connect(c.destination);
        [55, 82.41, 110, 164.81].forEach((f, i) => {
          const o = c.createOscillator(), g = c.createGain();
          o.type = i % 2 ? 'triangle' : 'sine'; o.frequency.value = f; g.gain.value = i === 0 ? 0.13 : 0.05;
          o.connect(g); g.connect(this.filter); o.start(); this.drones.push(o);
        });
        const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.09; lg.gain.value = 180;
        lfo.connect(lg); lg.connect(this.filter.frequency); lfo.start();
        return true;
      } catch (e) { return false; }
    }
    async toggle() {
      if (!this.on) {
        if (!this.init()) return false;
        if (this.ctx.state === 'suspended') await this.ctx.resume();
        const n = this.ctx.currentTime; this.master.gain.cancelScheduledValues(n);
        this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), n);
        this.master.gain.exponentialRampToValueAtTime(0.26, n + 1); this.on = true; this.setLab(this.lab);
        this.pluck(0.5, 0.5, 0.7);
      } else {
        const n = this.ctx.currentTime; this.master.gain.cancelScheduledValues(n);
        this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), n);
        this.master.gain.exponentialRampToValueAtTime(0.0001, n + 0.5); this.on = false;
      }
      return this.on;
    }
    setLab(id) {
      this.lab = id; if (!this.on) return;
      const s = SC[id] || SC.texture, n = this.ctx.currentTime, r = [s[0] / 2, s[2] / 2, s[4] / 2, s[5] / 2];
      this.drones.forEach((o, i) => o.frequency.exponentialRampToValueAtTime(r[i % 4], n + 1.2));
    }
    move(nx, ny, speed) {
      if (!this.on) return; const n = this.ctx.currentTime;
      this.filter.frequency.setTargetAtTime(240 + (1 - M.clamp(ny, 0, 1)) * 900 + Math.min(500, speed * 12), n, 0.15);
      if (n - this.last > 0.2 && speed > 0.25) { this.last = n; this.pluck(nx, ny, Math.min(1, 0.3 + speed * 0.04)); }
    }
    pluck(nx, ny, vel) {
      if (!this.on) return; const s = SC[this.lab] || SC.texture;
      const f = s[Math.floor(M.clamp(nx, 0, 0.999) * s.length)] * (ny < 0.35 ? 2 : 1);
      this.tone(f, vel || 0.6, this.lab === 'crystal' ? 'sine' : 'triangle', 1.4, nx);
    }
    bell(f) { this.tone(f, 0.7, 'sine', 2.2, 0.5); this.tone(f * 2.756, 0.25, 'sine', 1.4, 0.5); }
    tone(f, vel, type, dur, pan) {
      if (!this.on) return; const c = this.ctx, n = c.currentTime, o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, n); g.gain.linearRampToValueAtTime(0.06 * vel, n + 0.03); g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g);
      if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = (pan - 0.5) * 1.2; g.connect(p); p.connect(this.master); p.connect(this.delay); }
      else { g.connect(this.master); g.connect(this.delay); }
      o.start(n); o.stop(n + dur + 0.05);
    }
    boom() {
      if (!this.on) return; const c = this.ctx, n = c.currentTime;
      const len = Math.floor(c.sampleRate * 2), buf = c.createBuffer(1, len, c.sampleRate), d = buf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2);
      const s = c.createBufferSource(); s.buffer = buf;
      const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(3000, n); f.frequency.exponentialRampToValueAtTime(80, n + 1.8);
      const g = c.createGain(); g.gain.value = 0.5; s.connect(f); f.connect(g); g.connect(this.master); s.start(n);
      const o = c.createOscillator(), og = c.createGain(); o.frequency.setValueAtTime(120, n); o.frequency.exponentialRampToValueAtTime(30, n + 1.5);
      og.gain.setValueAtTime(0.4, n); og.gain.exponentialRampToValueAtTime(0.0001, n + 1.8); o.connect(og); og.connect(this.master); o.start(n); o.stop(n + 1.9);
    }
  }
  M.audio = new Audio();
})(window.M);
