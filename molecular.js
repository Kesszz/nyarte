/* ==========================================================================
   05 — MOLECULAR / BIO-MATTER LAB (WebGL Alchemical Ferrofluid & Turing Shader)
   Estética macro de ferrofluido magnético misturado com óleos densos,
   anéis de interferência iridescente, espumas de reação-difusão (Turing)
   e filamentos biomórficos viscosos sobre fundo preto abissal (#040406).
   ========================================================================== */
(function (M) {
  const N_BLOBS = 16;
  const HEAD = '#extension GL_OES_standard_derivatives : enable\n';

  const FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 u_res;',
    'uniform vec2 u_m;',
    'uniform float u_t;',
    'uniform float u_seed;',
    'uniform int u_state;',      // 0: Ferrofluido & Óleo, 1: Reação-Difusão Celular, 2: Plasma Biomórfico
    'uniform float u_tension;',  // Tensão superficial
    'uniform float u_mag;',      // Campo magnético do cursor
    'uniform float u_pigment;',  // Densidade dos pigmentos & óleo
    'uniform float u_press;',
    'uniform float u_pulse;',
    'uniform vec4 u_blobs[' + N_BLOBS + '];', // (x, y, radius, phase)
    M.GLSL_COMMON,

    'vec2 hash2(vec2 p){',
    '  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));',
    '  return fract(sin(p + u_seed)*43758.5453);',
    '}',

    // Voronoi celular orgânico para espumas e poros biológicos
    'vec3 voronoiCell(vec2 p){',
    '  vec2 n = floor(p);',
    '  vec2 f = fract(p);',
    '  float md = 8.0, md2 = 8.0;',
    '  float cid = 0.0;',
    '  for(int j=-1; j<=1; j++){',
    '    for(int i=-1; i<=1; i++){',
    '      vec2 g = vec2(float(i), float(j));',
    '      vec2 o = 0.5 + 0.42 * sin(u_t * 0.65 + 6.2831 * hash2(n + g));',
    '      vec2 r = g + o - f;',
    '      float d = dot(r, r);',
    '      if(d < md){ md2 = md; md = d; cid = hash(n + g); }',
    '      else if(d < md2){ md2 = d; }',
    '    }',
    '  }',
    '  return vec3(sqrt(md), sqrt(md2) - sqrt(md), cid);',
    '}',

    // Padrão de Turing (reação-difusão multi-escala acoplada a ruído domain-warped)
    'float turingPattern(vec2 p, float t){',
    '  vec2 q = vec2(fbm(p * 2.2 + vec2(0.0, t*0.14)), fbm(p * 2.2 + vec2(5.2, -t*0.12)));',
    '  vec2 r = p * 3.6 + q * 1.45;',
    '  float n1 = sin(r.x * 4.5 + sin(r.y * 4.5 + t * 0.4));',
    '  float n2 = cos(r.y * 5.2 - sin(r.x * 4.8 - t * 0.35));',
    '  float band = sin((n1 + n2) * 3.14159 + fbm(r * 1.8) * 3.2);',
    '  return band * 0.5 + 0.5;',
    '}',

    'void main(){',
    '  vec2 asp = vec2(u_res.x / max(1.0, u_res.y), 1.0);',
    '  vec2 uv = vUv;',
    '  vec2 p = (uv - 0.5) * asp;',
    '  vec2 mp = (u_m - 0.5) * asp;',
    '  vec2 dm = p - mp;',
    '  float dMouse = length(dm) + 1e-4;',
    '  float angMouse = atan(dm.y, dm.x);',

    // ---- 1. Campo Metaball dos Glóbulos + Instabilidade Magnética de Rosensweig ----
    '  float field = 0.0;',
    '  float subField = 0.0;',
    '  float colorPhase = 0.0;',
    '  float weightSum = 0.0001;',
    '  float kSmooth = 18.0 / max(0.35, u_tension);',

    '  for(int i=0; i<' + N_BLOBS + '; i++){',
    '    vec4 b = u_blobs[i];',
    '    vec2 bp = (b.xy - 0.5) * asp;',
    '    vec2 d = p - bp;',
    '    float dist = length(d) + 0.001;',
    '    float contrib = (b.z * b.z) / (dist * dist + 0.0018 * u_tension);',
    '    field += contrib;',
    '    float w = exp(-dist * kSmooth);',
    '    colorPhase += b.w * contrib;',
    '    weightSum += contrib;',
    '  }',
    '  colorPhase /= weightSum;',

    // Distorção orgânica viscosa e campo magnético do cursor
    '  vec2 warp = vec2(fbm(p * 3.2 + u_t * 0.16), fbm(p * 3.2 - u_t * 0.14 + 4.7)) - 0.5;',
    '  float magZone = exp(-dMouse * dMouse * 7.5) * u_mag * (1.0 + u_press * 0.65);',
    '  float spikeFreq = 14.0 + floor(u_mag * 5.0);',
    '  float spikes = pow(max(0.0, sin(angMouse * spikeFreq + dMouse * 52.0 - u_t * 3.5 + warp.x * 5.0)), 3.0);',
    '  float rings = sin(dMouse * 68.0 - u_t * 4.5 + warp.y * 6.0) * 0.5 + 0.5;',
    '  float magMod = magZone * (spikes * 0.55 + rings * 0.35 + 0.35);',

    '  float turing = turingPattern(p + warp * 0.35 - dm * magZone * 0.18, u_t);',
    '  vec3 cellV = voronoiCell((p + warp * 0.15) * (6.5 + u_mag * 1.5));',

    // ---- 2. Morfologia segundo o Estado Selecionado (u_state) ----
    '  float ferroMask = 0.0;',
    '  float oilMask = 0.0;',
    '  float foamRim = 0.0;',
    '  float h = 0.0;',

    '  if(u_state == 0){',
    // ESTADO 0: FERROFLUIDO & ÓLEO DENSO
    '    float fPot = field + warp.x * 0.25 + magMod * 0.95;',
    '    float spikesCore = smoothstep(0.82, 1.55, fPot);',
    '    float labyr = smoothstep(0.32, 0.72, turing) * smoothstep(0.65, 1.35, fPot) * (0.35 + magZone * 0.65);',
    '    ferroMask = clamp(spikesCore - labyr * 0.45, 0.0, 1.0);',
    // Halos de óleo denso e menisco ao redor dos glóbulos negros
    '    oilMask = smoothstep(0.32, 0.88, fPot + turing * 0.28 * u_pigment) * (1.0 - ferroMask * 0.92);',
    '    foamRim = exp(-abs(fPot - 0.85) * 14.0) + exp(-cellV.y * 22.0) * oilMask * 0.55;',
    '    h = ferroMask * (0.72 + magMod * 0.65 + (1.0 - cellV.x) * 0.18) + oilMask * (0.28 + turing * 0.16);',
    '  } else if(u_state == 1){',
    // ESTADO 1: REAÇÃO-DIFUSÃO CELULAR (Células de Turing & Espuma Biológica)
    '    float fPot = field * 0.85 + magZone * 0.75;',
    '    float tCell = mix(turing, smoothstep(0.06, 0.24, cellV.y), 0.42);',
    '    float envelope = smoothstep(0.24, 0.95, fPot + 0.22);',
    '    ferroMask = smoothstep(0.48, 0.74, tCell) * envelope;',
    '    oilMask = smoothstep(0.18, 0.55, 1.0 - tCell) * envelope * clamp(u_pigment, 0.3, 1.8);',
    '    foamRim = exp(-abs(tCell - 0.5) * 18.0) * envelope + exp(-cellV.y * 28.0) * envelope * 0.8;',
    '    h = ferroMask * 0.62 + oilMask * 0.32 + foamRim * 0.18;',
    '  } else {',
    // ESTADO 2: PLASMA BIOMÓRFICO (Filamentos Viscosos & Membranas Iridescentes)
    '    float web = exp(-cellV.y * (11.0 / max(0.4, u_tension))) * smoothstep(0.18, 0.85, field + magZone);',
    '    float core = smoothstep(0.95, 1.65, field + magMod * 0.8);',
    '    ferroMask = clamp(core + web * 0.85, 0.0, 1.0);',
    '    oilMask = smoothstep(0.28, 1.05, field + warp.y * 0.4) * (1.0 - core * 0.85);',
    '    foamRim = web + exp(-abs(field - 0.9) * 12.0);',
    '    h = ferroMask * (0.68 + web * 0.35) + oilMask * 0.34;',
    '  }',

    // Onda de choque de fissão/pulso magnético
    '  if(u_pulse > 0.01){',
    '    float pWave = sin((dMouse - (1.0 - u_pulse) * 0.65) * 38.0) * exp(-dMouse * 4.5) * u_pulse;',
    '    h += pWave * 0.22;',
    '  }',

    // ---- 3. Normais 3D Líquidas Especulares ----
    '  vec3 N = vec3(0.0, 0.0, 1.0);',
    '  #ifdef GL_OES_standard_derivatives',
    '    vec2 dH = vec2(dFdx(h), dFdy(h)) * u_res.y * 0.16;',
    '    N = normalize(vec3(-dH * 2.2, 1.0));',
    '  #endif',

    // ---- 4. Paleta Alquímica de Óleos, Pigmentos & Interferência Iridescente ----
    // Âmbar/Terracota queimado, Vermelho Carmim, Azul Cobalto, Roxo Profundo e Branco Iridescente
    '  float pHue = fract(colorPhase + turing * 0.38 + warp.x * 0.35);',
    '  vec3 pigA = mix(OCRE, TERR, smoothstep(0.0, 0.35, pHue));',
    '  pigA = mix(pigA, CARM, smoothstep(0.28, 0.58, pHue));',
    '  pigA = mix(pigA, VIOL, smoothstep(0.52, 0.78, pHue));',
    '  pigA = mix(pigA, COBA, smoothstep(0.72, 0.96, pHue));',

    // Anéis de interferência iridescente (filme fino de óleo/sabão nas bordas dos glóbulos)
    '  float filmPhase = field * 2.6 + turing * 2.2 + dot(N.xy, vec2(1.2, -0.9)) + u_t * 0.08;',
    '  vec3 irid = 0.5 + 0.5 * cos(6.28318 * (filmPhase + vec3(0.0, 0.31, 0.64)));',
    '  irid = mix(irid, WHIT, 0.28);',

    '  vec3 oilCol = mix(pigA, irid, clamp(foamRim * 0.65, 0.0, 1.0)) * (0.65 + 0.55 * u_pigment);',
    // Glóbulo negro de ferrofluido: breu metálico com reflexo de filme fino nas bordas Fresnel
    '  float fresnel = pow(1.0 - max(0.0, N.z), 2.6);',
    '  vec3 ferroCol = vec3(0.012, 0.012, 0.018) + mix(pigA, irid, 0.55) * fresnel * (0.85 + 0.35 * u_pigment);',

    // ---- 5. Iluminação Chiaroscuro de Estúdio Macro ----
    '  vec3 L1vec = vec3(mp - p, 0.28);',
    '  float L1dist = length(L1vec);',
    '  vec3 L1 = L1vec / max(0.001, L1dist);',
    '  float att = 1.0 / (1.0 + L1dist * L1dist * 3.8);',
    '  vec3 L2 = normalize(vec3(-0.55, 0.62, 0.56));',
    '  vec3 L3 = normalize(vec3(0.60, -0.45, 0.66));',
    '  vec3 V = vec3(0.0, 0.0, 1.0);',

    '  float diff1 = max(0.0, dot(N, L1)) * att;',
    '  float diff2 = max(0.0, dot(N, L2)) * 0.45 + max(0.0, dot(N, L3)) * 0.25;',

    // Reflexos especulares líquidos intensos (efeito molhado de macrofotografia)
    '  float spec1 = pow(max(0.0, dot(N, normalize(L1 + V))), 110.0) * att * 2.4;',
    '  float spec2 = pow(max(0.0, dot(N, normalize(L2 + V))), 75.0) * 1.15;',
    '  float spec3 = pow(max(0.0, dot(N, normalize(L3 + V))), 55.0) * 0.65;',
    '  float coatSpec = spec1 + spec2 + spec3;',

    // Composição sobre fundo preto abissal (#040406)
    '  vec3 abyss = vec3(0.0157, 0.0157, 0.0235);',
    '  vec3 col = abyss;',

    // Brilho subsuperficial do óleo e pigmentos
    '  vec3 litOil = oilCol * (0.22 + diff1 * 1.55 + diff2 * 0.9) + irid * foamRim * (0.22 + att * 0.65) * u_pigment;',
    '  vec3 litFerro = ferroCol * (0.35 + diff1 * 1.3 + diff2) + vec3(1.0, 0.97, 0.92) * coatSpec * 0.95;',

    '  float totalPresence = clamp(oilMask + ferroMask, 0.0, 1.0);',
    '  vec3 matterCol = mix(litOil, litFerro, ferroMask);',
    '  matterCol += vec3(1.0, 0.96, 0.90) * coatSpec * oilMask * 0.55;',

    '  col = mix(abyss, matterCol, totalPresence);',
    // Halo atmosférico sutil sob o cursor magnético
    '  col += mix(CARM, OCRE, 0.5) * exp(-L1dist * L1dist * 7.0) * 0.08 * u_pigment;',

    '  col = 1.0 - exp(-col * 1.42);',
    '  col = max(col, abyss * 0.88);',
    '  col += (hash(gl_FragCoord.xy + fract(u_t)) - 0.5) * 0.016;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  M.labs.molecular = class extends M.Base {
    constructor(canvas, opt) {
      super(canvas, opt);
      this.id = 'molecular';
      this.params = {
        state: 0,      // 0: Ferrofluido & Óleo, 1: Reação-Difusão Celular, 2: Plasma Biomórfico
        tension: 1.0,
        mag: 1.2,
        pigment: 1.15,
        flow: 1.0
      };
      this.seed = 3.4;
      this.sx = 0.5;
      this.sy = 0.5;
      this.press = 0;
      this.pulse = 0;
      this.blobs = [];
      this.blobData = new Float32Array(N_BLOBS * 4);

      this.gl = M.makeGL(canvas);
      this.ok = false;
      if (!this.gl) return;
      const gl = this.gl;
      gl.getExtension('OES_standard_derivatives');
      this.prog = M.program(gl, FS, HEAD);
      if (!this.prog) return;
      this.u = M.uni(gl, this.prog, [
        'u_res', 'u_m', 'u_t', 'u_seed', 'u_state',
        'u_tension', 'u_mag', 'u_pigment', 'u_press', 'u_pulse', 'u_blobs[0]'
      ]);
      this.ok = true;
      this.q = this.preview ? 0.65 : 0.72;
      this.initBlobs();
    }

    controls() {
      return [
        {
          type: 'seg',
          key: 'state',
          label: 'Estado da Matéria',
          opts: [
            [0, 'Ferrofluido & Óleo'],
            [1, 'Reação-Difusão'],
            [2, 'Plasma Biomórfico']
          ]
        },
        { type: 'slider', key: 'tension', label: 'Tensão superficial', min: 0.35, max: 2.2, step: 0.05 },
        { type: 'slider', key: 'mag', label: 'Campo magnético (cursor)', min: 0.2, max: 2.4, step: 0.05 },
        { type: 'slider', key: 'pigment', label: 'Densidade dos pigmentos', min: 0.3, max: 2.2, step: 0.05 },
        { type: 'slider', key: 'flow', label: 'Agitação alquímica', min: 0.2, max: 2.4, step: 0.05 },
        { type: 'button', act: 'fission', label: 'Induzir fissão / pulso' }
      ];
    }

    initBlobs() {
      this.blobs = [];
      for (let i = 0; i < N_BLOBS; i++) {
        const ang = (i / N_BLOBS) * 6.2832 + M.rnd(-0.2, 0.2);
        const rad = 0.08 + (i % 4) * 0.065;
        this.blobs.push({
          x: 0.5 + Math.cos(ang) * rad * 1.15,
          y: 0.5 + Math.sin(ang) * rad,
          vx: M.rnd(-0.04, 0.04),
          vy: M.rnd(-0.04, 0.04),
          r: 0.065 + (i % 5) * 0.015,
          baseR: 0.065 + (i % 5) * 0.015,
          phase: i / N_BLOBS
        });
      }
    }

    act(a) {
      if (a === 'fission') this.triggerFission(this.sx, this.sy);
    }

    reset() {
      this.seed = Math.random() * 50 + 1;
      this.initBlobs();
    }

    randomize() {
      this.seed = Math.random() * 80 + 1;
      this.params.state = (this.params.state + 1) % 3;
      this.params.tension = +M.rnd(0.55, 1.75).toFixed(2);
      this.params.mag = +M.rnd(0.8, 2.0).toFixed(2);
      this.params.pigment = +M.rnd(0.85, 1.85).toFixed(2);
      this.triggerFission(0.5, 0.5);
      return true;
    }

    triggerFission(cx, cy) {
      this.pulse = 1.0;
      this.snd('pluck', cx, cy, 0.85);
      for (let i = 0; i < this.blobs.length; i++) {
        const b = this.blobs[i];
        const dx = b.x - cx;
        const dy = b.y - cy;
        const d = Math.hypot(dx, dy) + 0.02;
        const ang = Math.atan2(dy, dx) + M.rnd(-0.45, 0.45);
        const kick = Math.min(0.42, 0.09 / d);
        b.vx += Math.cos(ang) * kick;
        b.vy += Math.sin(ang) * kick;
        b.r = b.baseR * M.rnd(0.78, 1.25);
      }
    }

    resize(w, h, dpr) {
      this.w = w;
      this.h = h;
      this.dpr = dpr;
      const s = Math.min(dpr, 2) * this.q;
      this.canvas.width = Math.max(2, Math.floor(w * s));
      this.canvas.height = Math.max(2, Math.floor(h * s));
      if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    pointer(type, x, y) {
      this.mx = x;
      this.my = y;
      this.has = true;
      if (type === 'down') {
        this.down = true;
        this.triggerFission(x, 1.0 - y);
      } else if (type === 'up') {
        this.down = false;
      } else if (type === 'leave') {
        this.down = false;
        this.has = false;
      }
    }

    stepBlobs(dt, t) {
      const p = this.params;
      const flow = p.flow;
      const mx = this.sx;
      const my = 1.0 - this.sy;

      for (let i = 0; i < N_BLOBS; i++) {
        const a = this.blobs[i];
        // Deriva orgânica suave
        let fx = (0.5 - a.x) * 0.45 + Math.sin(t * 0.7 * flow + i * 1.7) * 0.16 * flow;
        let fy = (0.5 - a.y) * 0.45 + Math.cos(t * 0.55 * flow + i * 2.3) * 0.16 * flow;

        // Interação entre glóbulos (coesão por tensão superficial + repulsão de núcleo)
        for (let j = 0; j < N_BLOBS; j++) {
          if (i === j) continue;
          const b = this.blobs[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d = Math.hypot(dx, dy) + 0.001;
          const rest = (a.r + b.r) * (0.85 + p.tension * 0.25);
          if (d < rest) {
            const rep = (rest - d) * 3.6;
            fx -= (dx / d) * rep;
            fy -= (dy / d) * rep;
          } else if (d < rest * 2.2) {
            const coh = (d - rest) * 0.55 * p.tension;
            fx += (dx / d) * coh;
            fy += (dy / d) * coh;
          }
        }

        // Atração e vórtice magnético do cursor
        if (this.has) {
          const dx = mx - a.x;
          const dy = my - a.y;
          const d = Math.hypot(dx, dy) + 0.02;
          if (d < 0.48) {
            const mForce = (1.0 - d / 0.48) * p.mag * (this.down ? 1.85 : 0.95);
            // Atrai até a coroa do ímã e faz orbitar sutilmente
            const radial = d > 0.08 ? 1.0 : -1.4;
            fx += (dx / d) * mForce * radial * 0.85 + (-dy / d) * mForce * 0.35;
            fy += (dy / d) * mForce * radial * 0.85 + (dx / d) * mForce * 0.35;
          }
        }

        a.vx = (a.vx + fx * dt) * Math.exp(-dt * 2.8);
        a.vy = (a.vy + fy * dt) * Math.exp(-dt * 2.8);
        a.x = M.clamp(a.x + a.vx * dt, 0.1, 0.9);
        a.y = M.clamp(a.y + a.vy * dt, 0.1, 0.9);
        a.r += (a.baseR * (0.92 + 0.14 * Math.sin(t * 1.5 + i)) - a.r) * dt * 2.0;

        const o = i * 4;
        this.blobData[o] = a.x;
        this.blobData[o + 1] = a.y;
        this.blobData[o + 2] = a.r;
        this.blobData[o + 3] = a.phase;
      }
    }

    frame(dt, t) {
      this.t = t;
      if (!this.ok) return;
      const stepDt = Math.min(dt, 0.033) || 0.016;

      let tx = this.mx;
      let ty = this.my;
      if (!this.has) {
        tx = 0.5 + 0.25 * Math.sin(t * 0.48);
        ty = 0.5 + 0.22 * Math.cos(t * 0.37);
      }
      this.sx += (tx - this.sx) * 0.14;
      this.sy += (ty - this.sy) * 0.14;
      this.press += ((this.down ? 1 : 0) - this.press) * 0.15;
      this.pulse *= Math.exp(-stepDt * 3.2);

      this.stepBlobs(stepDt, t);

      const gl = this.gl;
      const u = this.u;
      const p = this.params;
      gl.useProgram(this.prog);
      gl.uniform2f(u.u_res, this.canvas.width, this.canvas.height);
      gl.uniform2f(u.u_m, this.sx, 1.0 - this.sy);
      gl.uniform1f(u.u_t, t);
      gl.uniform1f(u.u_seed, this.seed);
      gl.uniform1i(u.u_state, p.state);
      gl.uniform1f(u.u_tension, p.tension);
      gl.uniform1f(u.u_mag, p.mag);
      gl.uniform1f(u.u_pigment, p.pigment);
      gl.uniform1f(u.u_press, this.press);
      gl.uniform1f(u.u_pulse, this.pulse);
      gl.uniform4fv(u['u_blobs[0]'], this.blobData);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    snapshot() {
      if (!this.ok) return this.canvas.toDataURL('image/png');
      const w0 = this.canvas.width;
      const h0 = this.canvas.height;
      const s = Math.min(this.dpr, 2) * 1.0;
      this.canvas.width = Math.floor(this.w * s * 1.25);
      this.canvas.height = Math.floor(this.h * s * 1.25);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      this.frame(0, this.t);
      const url = this.canvas.toDataURL('image/png');
      this.canvas.width = w0;
      this.canvas.height = h0;
      this.gl.viewport(0, 0, w0, h0);
      this.frame(0, this.t);
      return url;
    }
  };
})(window.M);
