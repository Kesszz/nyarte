/* ==========================================================================
   04 — GENERATIVE ART (WebGL Biomorphic Petri-Dish & Bacterial Shader)
   Estética psicodélica, bacteriana e biomórfica em placa de Petri sobre
   fundo preto abissal (#040406): estruturas celulares translúcidas,
   membranas bioluminescentes (verde ácido, ciano elétrico, magenta,
   laranja-fogo, azul ultramarino e roxo), filamentos orgânicos ramificados
   e pigmento fluido em expansão radial. O cursor atua como pipeta e
   estímulo térmico em tempo real.
   ========================================================================== */
(function (M) {
  const N_SPORES = 12;
  const HEAD = '#extension GL_OES_standard_derivatives : enable\n';

  const FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 u_res;',
    'uniform vec2 u_m;',
    'uniform float u_t;',
    'uniform float u_seed;',
    'uniform int u_sys;',       // 0: Colônia Bacteriana, 1: Micélio & Filamentos, 2: Membranas Psicodélicas, 3: Expansão Radial
    'uniform float u_speed;',
    'uniform float u_dens;',    // Densidade celular / pigmento
    'uniform float u_branch;',  // Ramificação de filamentos
    'uniform float u_sym;',     // Simetria (1x a 12x)
    'uniform float u_heat;',    // Estímulo térmico & mutação espectral
    'uniform float u_press;',
    'uniform vec4 u_spores[' + N_SPORES + '];', // (x, y, radius, spectrumHue)
    M.GLSL_COMMON,

    // Paleta bioluminescente psicodélica:
    // Verde Ácido, Ciano Elétrico, Azul Ultramarino, Roxo Profundo, Magenta, Laranja-Fogo
    'const vec3 ACID_GREEN = vec3(0.46, 1.00, 0.12);',
    'const vec3 ELEC_CYAN  = vec3(0.00, 0.95, 1.00);',
    'const vec3 ULTRA_BLUE = vec3(0.11, 0.25, 0.94);',
    'const vec3 DEEP_PURP  = vec3(0.48, 0.14, 0.85);',
    'const vec3 MAGENTA    = vec3(1.00, 0.07, 0.54);',
    'const vec3 FIRE_ORNG  = vec3(1.00, 0.34, 0.02);',

    'vec2 hash2(vec2 p){',
    '  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));',
    '  return fract(sin(p + u_seed)*43758.5453);',
    '}',

    'vec3 bioSpectrum(float h, float sat){',
    '  float x = fract(h) * 6.0;',
    '  vec3 col = ACID_GREEN;',
    '  if(x < 1.0) col = mix(ACID_GREEN, ELEC_CYAN, smoothstep(0.0, 1.0, x));',
    '  else if(x < 2.0) col = mix(ELEC_CYAN, ULTRA_BLUE, smoothstep(0.0, 1.0, x - 1.0));',
    '  else if(x < 3.0) col = mix(ULTRA_BLUE, DEEP_PURP, smoothstep(0.0, 1.0, x - 2.0));',
    '  else if(x < 4.0) col = mix(DEEP_PURP, MAGENTA, smoothstep(0.0, 1.0, x - 3.0));',
    '  else if(x < 5.0) col = mix(MAGENTA, FIRE_ORNG, smoothstep(0.0, 1.0, x - 4.0));',
    '  else col = mix(FIRE_ORNG, ACID_GREEN, smoothstep(0.0, 1.0, x - 5.0));',
    '  vec3 irid = 0.5 + 0.5 * cos(6.28318 * (h * 1.5 + vec3(0.0, 0.33, 0.67)));',
    '  return mix(col, irid, 0.24) * (0.75 + 0.42 * sat);',
    '}',

    // Voronoi celular bacteriano (retorna dCentro, dParedeMembrana, idCélula)
    'vec3 bioVoronoi(vec2 p, float t){',
    '  vec2 n = floor(p);',
    '  vec2 f = fract(p);',
    '  float md = 8.0, md2 = 8.0, cid = 0.0;',
    '  for(int j=-1; j<=1; j++){',
    '    for(int i=-1; i<=1; i++){',
    '      vec2 g = vec2(float(i), float(j));',
    '      vec2 h = hash2(n + g);',
    '      vec2 o = 0.5 + 0.43 * sin(t * 0.8 + 6.28318 * h);',
    '      vec2 r = g + o - f;',
    '      float d = dot(r, r);',
    '      if(d < md){ md2 = md; md = d; cid = h.x; }',
    '      else if(d < md2){ md2 = d; }',
    '    }',
    '  }',
    '  float d1 = sqrt(md);',
    '  float d2 = sqrt(md2);',
    '  return vec3(d1, d2 - d1, cid);',
    '}',

    // Filamentos orgânicos ramificados (hifas e dendritos)
    'float filamentNetwork(vec2 p, float t, float branch){',
    '  float acc = 0.0;',
    '  float amp = 0.6;',
    '  vec2 q = p * (2.5 + branch * 0.95);',
    '  mat2 rot = mat2(0.78, -0.62, 0.62, 0.78);',
    '  for(int i=0; i<4; i++){',
    '    vec3 v = bioVoronoi(q + vec2(t*0.07, -t*0.05), t * (0.65 + float(i)*0.25));',
    '    float vein = exp(-v.y * (17.0 + float(i)*6.5));',
    '    float vacuoles = exp(-v.x * 9.5) * 0.42;',
    '    acc += (vein + vacuoles) * amp;',
    '    q = rot * q * 1.94 + vec2(3.7, 1.9);',
    '    amp *= 0.56;',
    '  }',
    '  return acc;',
    '}',

    'void main(){',
    '  vec2 asp = vec2(u_res.x / max(1.0, u_res.y), 1.0);',
    '  vec2 uv = vUv;',
    '  vec2 p0 = (uv - 0.5) * asp;',
    '  vec2 mp = (u_m - 0.5) * asp;',
    '  float t = u_t * u_speed;',

    // ---- 1. Placa de Petri & Estímulo Térmico da Pipeta (Cursor) ----
    '  float rDish = length(p0);',
    '  float ang0 = atan(p0.y, p0.x);',
    '  vec2 dm = p0 - mp;',
    '  float dMouse = length(dm) + 1e-4;',
    // Campo térmico ao redor da pipeta: expande membranas, acelera ramificação e desloca o espectro cromático
    '  float thermal = exp(-dMouse * dMouse * 4.8) * (0.85 + u_press * 0.9);',

    '  vec2 p = p0;',
    '  if(u_sym > 1.5){',
    '    float seg = 6.2831853 / floor(u_sym + 0.5);',
    '    float aFold = abs(mod(ang0 + seg*0.5, seg) - seg*0.5);',
    '    p = vec2(cos(aFold), sin(aFold)) * rDish;',
    '  }',

    // Expansão quimiotática causada pela pipeta
    '  vec2 pWarped = p - (dm / dMouse) * thermal * 0.085;',

    // ---- 2. Colônias Bacterianas em Expansão Radial na Placa de Petri ----
    '  float colonyField = 0.0;',
    '  float colonyRings = 0.0;',
    '  float colonyHue = 0.0;',
    '  float wCol = 0.0001;',
    '  for(int i=0; i<' + N_SPORES + '; i++){',
    '    vec4 sp = u_spores[i];',
    '    vec2 spPos = (sp.xy - 0.5) * asp;',
    '    vec2 d = p0 - spPos;',
    '    float dist = length(d) + 1e-4;',
    '    float angC = atan(d.y, d.x);',
    // Borda dendrítica viva da colônia em expansão radial
    '    float dendrite = fbm(vec2(cos(angC), sin(angC)) * (2.6 + u_branch) + sp.w * 8.0 + t * 0.18) * 0.095;',
    '    float rad = sp.z * (1.0 + thermal * 0.25) + dendrite;',
    '    float cMask = smoothstep(rad + 0.085, rad - 0.055, dist);',
    '    float radialWave = sin((dist / max(0.04, rad)) * (18.0 + u_branch * 7.0) - t * 2.2 + fbm(p0 * 7.5) * 4.5) * 0.5 + 0.5;',
    '    float rim = exp(-abs(dist - rad) * 26.0);',
    '    colonyField += cMask * 0.78 + rim * 0.95;',
    '    colonyRings += (radialWave * cMask + rim * 1.25) * (cMask + 0.12);',
    '    colonyHue += sp.w * (cMask + rim + 0.02);',
    '    wCol += (cMask + rim + 0.02);',
    '  }',
    '  colonyHue /= wCol;',

    // ---- 3. Estruturas Celulares Translúcidas, Filamentos & Pigmento Fluido ----
    '  float localBranch = u_branch + thermal * 0.85;',
    '  vec2 q = vec2(',
    '    fbm(pWarped * (2.4 + localBranch * 0.45) + vec2(0.0, t * 0.19)),',
    '    fbm(pWarped * (2.4 + localBranch * 0.45) + vec2(5.2, -t * 0.16))',
    '  );',
    '  vec2 r = vec2(',
    '    fbm(pWarped * 3.3 + q * (1.7 + u_dens * 0.55) + vec2(1.7, 9.2) + t * 0.13),',
    '    fbm(pWarped * 3.3 + q * (1.7 + u_dens * 0.55) + vec2(8.3, 2.8) - t * 0.12)',
    '  );',

    '  vec3 vCell1 = bioVoronoi(pWarped * (4.8 + u_dens * 2.2) + r * 1.15, t);',
    '  vec3 vCell2 = bioVoronoi(pWarped * (11.0 + u_dens * 3.0) - q * 1.25, t * 1.35);',
    '  float hyphae = filamentNetwork(pWarped + r * 0.38, t, localBranch);',

    '  float membrane = 0.0;',
    '  float filaments = 0.0;',
    '  float organelles = 0.0;',
    '  float hHeight = 0.0;',

    '  if(u_sys == 0){',
    // SISTEMA 0: COLÔNIA BACTERIANA & MEMBRANAS TRANSLÚCIDAS
    '    float wall1 = exp(-vCell1.y * 15.0);',
    '    float wall2 = exp(-vCell2.y * 20.0) * 0.68;',
    '    float nucleus = smoothstep(0.34, 0.03, vCell1.x);',
    '    membrane = clamp(colonyField * 0.75 + (1.0 - vCell1.x) * 0.52 * u_dens + r.x * 0.35, 0.0, 1.35);',
    '    filaments = clamp(wall1 + wall2 + hyphae * 0.6 + colonyRings * 0.4, 0.0, 1.5);',
    '    organelles = nucleus * (0.45 + 0.55 * sin(vCell1.z * 32.0 + t * 2.6)) + exp(-vCell2.x * 14.0) * 0.55;',
    '    hHeight = membrane * 0.46 + filaments * 0.38 + organelles * 0.26;',
    '  } else if(u_sys == 1){',
    // SISTEMA 1: FILAMENTOS ORGÂNICOS RAMIFICADOS (Micélio & Dendritos)
    '    float mainWeb = hyphae * (0.9 + colonyField * 0.55 + thermal * 0.85);',
    '    float fineWeb = exp(-vCell2.y * 25.0) * smoothstep(0.18, 0.85, r.x + colonyField * 0.45);',
    '    membrane = smoothstep(0.22, 0.92, r.y * 0.68 + colonyField * 0.55) * 0.68 * u_dens;',
    '    filaments = clamp(mainWeb * 1.2 + fineWeb * 0.85, 0.0, 1.65);',
    '    organelles = exp(-vCell1.x * 16.0) * smoothstep(0.3, 0.9, mainWeb);',
    '    hHeight = filaments * 0.64 + membrane * 0.26 + organelles * 0.3;',
    '  } else if(u_sys == 2){',
    // SISTEMA 2: MEMBRANAS PSICODÉLICAS & VESÍCULAS BIOLUMINESCENTES
    '    float fWarp = fbm(pWarped * 3.6 + r * 2.5);',
    '    float bands = sin((fWarp * 9.5 + colonyField * 3.8 + q.x * 4.2) * 3.14159) * 0.5 + 0.5;',
    '    float vesicles = smoothstep(0.06, 0.30, vCell1.y) * (1.0 - smoothstep(0.30, 0.44, vCell1.x));',
    '    membrane = clamp((bands * 0.85 + vesicles * 0.55 + colonyField * 0.42) * u_dens * 0.85, 0.0, 1.4);',
    '    filaments = exp(-abs(bands - 0.5) * 14.0) + exp(-vCell1.y * 17.0) * 0.75;',
    '    organelles = smoothstep(0.19, 0.02, vCell2.x) * bands;',
    '    hHeight = membrane * 0.56 + filaments * 0.34;',
    '  } else {',
    // SISTEMA 3: PIGMENTO FLUIDO EM EXPANSÃO RADIAL & CORAL QUIMIOTÁTICO
    '    float radialR = length(pWarped);',
    '    float radialFront = sin(radialR * (22.0 + u_dens * 8.0) - t * 2.4 + fbm(pWarped * 6.0 + r) * 6.5) * 0.5 + 0.5;',
    '    float turingWave = sin(r.x * 17.0 + sin(r.y * 15.0 + t)) * cos(q.y * 15.0 - sin(q.x * 17.0 - t));',
    '    float coral = smoothstep(-0.18, 0.34, turingWave + (colonyField - 0.35) * 0.55 + radialFront * 0.35);',
    '    float coralRim = exp(-abs(turingWave) * 11.5) + exp(-abs(radialFront - 0.5) * 12.0) * 0.5;',
    '    membrane = coral * 0.88 * clamp(u_dens, 0.4, 1.6);',
    '    filaments = coralRim * 1.1 + exp(-vCell2.y * 22.0) * coral * 0.65;',
    '    organelles = exp(-vCell2.x * 15.0) * (1.0 - coral) * 0.9 + exp(-vCell1.x * 18.0) * coral;',
    '    hHeight = coral * 0.58 + coralRim * 0.30 + organelles * 0.24;',
    '  }',

    // ---- 4. Relevo Vítreo Úmido & Iluminação Especular ----
    '  vec3 N = vec3(0.0, 0.0, 1.0);',
    '  #ifdef GL_OES_standard_derivatives',
    '    vec2 dH = vec2(dFdx(hHeight), dFdy(hHeight)) * u_res.y * 0.13;',
    '    N = normalize(vec3(-dH * 2.1, 1.0));',
    '  #endif',

    '  vec3 L1vec = vec3(mp - p0, 0.32);',
    '  float L1dist = length(L1vec);',
    '  vec3 L1 = L1vec / max(0.001, L1dist);',
    '  float att = (1.0 / (1.0 + L1dist * L1dist * 3.2)) * (0.9 + u_heat * 0.45);',
    '  vec3 L2 = normalize(vec3(-0.5, 0.65, 0.58));',
    '  vec3 V = vec3(0.0, 0.0, 1.0);',

    '  float diff = max(0.0, dot(N, L1)) * att + max(0.0, dot(N, L2)) * 0.34;',
    '  float spec = pow(max(0.0, dot(N, normalize(L1 + V))), 92.0) * att * 2.0',
    '             + pow(max(0.0, dot(N, normalize(L2 + V))), 65.0) * 0.78;',
    '  float fresnel = pow(1.0 - max(0.0, N.z), 2.3);',

    // ---- 5. Espectro Bioluminescente Dinâmico (sensível ao estímulo térmico do cursor) ----
    '  float thermalShift = thermal * 0.42 * u_heat;',
    '  float hueA = fract(colonyHue + r.x * 0.58 + q.y * 0.36 + vCell1.z * 0.24 + thermalShift + u_t * 0.025);',
    '  float hueB = fract(hueA + 0.28 + filaments * 0.24 + thermal * 0.25);',
    '  float hueC = fract(hueA + 0.56 + vCell2.z * 0.3);',

    '  vec3 colMembrane = bioSpectrum(hueA, u_dens);',
    '  vec3 colFilament = bioSpectrum(hueB, u_dens * 1.25);',
    '  vec3 colOrganelle = mix(ACID_GREEN, ELEC_CYAN, sin(vCell1.z * 16.0 + t)*0.5+0.5);',
    '  colOrganelle = mix(colOrganelle, MAGENTA, smoothstep(0.3, 0.9, thermal));',

    '  vec3 abyss = vec3(0.0157, 0.0157, 0.0235);', // #040406
    '  float presence = smoothstep(0.10, 0.76, membrane * 0.78 + filaments * 0.68 + organelles * 0.52 + colonyField * 0.48);',

    '  vec3 bioCol = colMembrane * membrane * (0.34 + diff * 1.28)',
    '              + colFilament * pow(max(0.0, filaments), 1.3) * (0.48 + u_heat * 0.8 + att * 0.75)',
    '              + colOrganelle * organelles * (0.72 + u_heat * 0.9)',
    '              + mix(colFilament, bioSpectrum(hueC, 1.3), 0.5) * fresnel * 0.72',
    '              + vec3(1.0, 0.98, 0.95) * spec * (0.45 + membrane * 0.55);',

    '  vec3 col = mix(abyss, bioCol, presence);',

    // Borda circular de vidro da Placa de Petri com cáustica bioluminescente
    '  float dishRad = 0.46 * min(asp.x, 1.0) * 1.08;',
    '  float dishRim = exp(-abs(rDish - dishRad) * 95.0) * 0.5 + exp(-abs(rDish - dishRad * 1.018) * 130.0) * 0.28;',
    '  float dishCaustic = dishRim * (0.5 + 0.5 * cos(ang0 * 4.0 - u_t * 0.5));',
    '  col += mix(ELEC_CYAN, MAGENTA, 0.45) * dishCaustic;',
    '  float outsideDish = smoothstep(dishRad * 1.02, dishRad * 1.46, rDish);',
    '  col = mix(col, abyss, outsideDish * 0.72);',

    '  col = 1.0 - exp(-col * 1.38);',
    '  col = max(col, abyss * 0.88);',
    '  col += (hash(gl_FragCoord.xy + fract(u_t)) - 0.5) * 0.016;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  M.labs.generative = class extends M.Base {
    constructor(canvas, opt) {
      super(canvas, opt);
      this.id = 'generative';
      this.params = {
        sys: 0,       // 0: Colônia Bacteriana, 1: Filamentos & Hifas, 2: Membranas Bioluminescentes, 3: Expansão Radial
        speed: 1.0,
        dens: 1.25,
        branch: 1.15,
        sym: 1,
        heat: 1.25
      };
      this.seed = Math.random() * 60 + 1;
      this.sx = 0.5;
      this.sy = 0.5;
      this.press = 0;
      this.spores = [];
      this.sporeData = new Float32Array(N_SPORES * 4);
      this.nextSporeIdx = 0;

      this.gl = M.makeGL(canvas);
      this.ok = false;
      if (!this.gl) return;
      const gl = this.gl;
      gl.getExtension('OES_standard_derivatives');
      this.prog = M.program(gl, FS, HEAD);
      if (!this.prog) return;
      this.u = M.uni(gl, this.prog, [
        'u_res', 'u_m', 'u_t', 'u_seed', 'u_sys',
        'u_speed', 'u_dens', 'u_branch', 'u_sym', 'u_heat', 'u_press', 'u_spores[0]'
      ]);
      this.ok = true;
      this.q = this.preview ? 0.65 : 0.72;
      this.initSpores();
    }

    controls() {
      return [
        {
          type: 'seg',
          key: 'sys',
          label: 'Cultura em Placa de Petri',
          opts: [
            [0, 'Colônia Bacteriana'],
            [1, 'Filamentos & Hifas'],
            [2, 'Membranas Líquidas'],
            [3, 'Expansão Radial']
          ]
        },
        { type: 'slider', key: 'dens', label: 'Densidade celular & pigmento', min: 0.4, max: 2.4, step: 0.05 },
        { type: 'slider', key: 'branch', label: 'Ramificação orgânica', min: 0.3, max: 2.4, step: 0.05 },
        { type: 'slider', key: 'sym', label: 'Simetria (1× a 16×)', min: 1, max: 16, step: 1 },
        { type: 'slider', key: 'heat', label: 'Estímulo térmico & bioluminescência', min: 0.3, max: 2.4, step: 0.05 },
        { type: 'slider', key: 'speed', label: 'Velocidade metabólica', min: 0.2, max: 2.5, step: 0.05 },
        { type: 'button', act: 'mutate', label: 'Mutação genética (aleatorizar)' }
      ];
    }

    initSpores() {
      this.spores = [];
      for (let i = 0; i < N_SPORES; i++) {
        const ang = (i / N_SPORES) * 6.2832 + M.rnd(-0.35, 0.35);
        const dist = i === 0 ? 0.02 : M.rnd(0.08, 0.30);
        const maxR = M.rnd(0.12, 0.25);
        this.spores.push({
          x: 0.5 + Math.cos(ang) * dist,
          y: 0.5 + Math.sin(ang) * dist,
          r: maxR * M.rnd(0.5, 0.96),
          maxR,
          vx: M.rnd(-0.012, 0.012),
          vy: M.rnd(-0.012, 0.012),
          hue: (i / N_SPORES + Math.random() * 0.15) % 1
        });
      }
    }

    inoculateAt(nx, ny) {
      const idx = this.nextSporeIdx % N_SPORES;
      this.nextSporeIdx++;
      this.spores[idx] = {
        x: nx,
        y: ny,
        r: 0.025,
        maxR: M.rnd(0.14, 0.26),
        vx: M.rnd(-0.015, 0.015),
        vy: M.rnd(-0.015, 0.015),
        hue: Math.random()
      };
    }

    act(a) {
      if (a === 'mutate') return this.randomize();
    }

    reset() {
      this.seed = Math.random() * 80 + 1;
      this.initSpores();
    }

    randomize() {
      this.seed = Math.random() * 100 + 1;
      this.params.sys = (this.params.sys + 1) % 4;
      this.params.dens = +M.rnd(0.85, 2.0).toFixed(2);
      this.params.branch = +M.rnd(0.75, 2.1).toFixed(2);
      this.params.sym = [1, 1, 2, 3, 5, 6, 8][Math.floor(Math.random() * 7)];
      this.params.heat = +M.rnd(0.9, 2.1).toFixed(2);
      this.initSpores();
      return true;
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
        this.inoculateAt(x, 1.0 - y);
        this.snd('pluck', x, y, 0.75);
      } else if (type === 'move') {
        if (this.down && Math.random() < 0.24) {
          this.inoculateAt(x, 1.0 - y);
        }
      } else if (type === 'up') {
        this.down = false;
      } else if (type === 'leave') {
        this.down = false;
        this.has = false;
      }
    }

    stepSpores(dt, t) {
      const spd = this.params.speed;
      for (let i = 0; i < N_SPORES; i++) {
        const sp = this.spores[i];
        sp.r += (sp.maxR - sp.r) * dt * 0.65 * spd;
        const pulse = 0.012 * Math.sin(t * 1.4 + i * 2.1);
        sp.x += (sp.vx + Math.sin(t * 0.35 + i) * 0.008) * dt * spd;
        sp.y += (sp.vy + Math.cos(t * 0.31 + i * 1.3) * 0.008) * dt * spd;

        const dx = sp.x - 0.5;
        const dy = sp.y - 0.5;
        const dist = Math.hypot(dx, dy);
        if (dist > 0.36) {
          sp.x -= (dx / dist) * (dist - 0.36) * 0.5;
          sp.y -= (dy / dist) * (dist - 0.36) * 0.5;
          sp.vx *= -0.7;
          sp.vy *= -0.7;
        }

        const o = i * 4;
        this.sporeData[o] = sp.x;
        this.sporeData[o + 1] = sp.y;
        this.sporeData[o + 2] = Math.max(0.02, sp.r + pulse);
        this.sporeData[o + 3] = sp.hue;
      }
    }

    frame(dt, t) {
      this.t = t;
      if (!this.ok) return;
      const stepDt = Math.min(dt, 0.033) || 0.016;

      let tx = this.mx;
      let ty = this.my;
      if (!this.has) {
        tx = 0.5 + 0.24 * Math.sin(t * 0.41);
        ty = 0.5 + 0.22 * Math.cos(t * 0.33);
      }
      this.sx += (tx - this.sx) * 0.12;
      this.sy += (ty - this.sy) * 0.12;
      this.press += ((this.down ? 1 : 0) - this.press) * 0.15;

      this.stepSpores(stepDt, t);

      const gl = this.gl;
      const u = this.u;
      const p = this.params;
      gl.useProgram(this.prog);
      gl.uniform2f(u.u_res, this.canvas.width, this.canvas.height);
      gl.uniform2f(u.u_m, this.sx, 1.0 - this.sy);
      gl.uniform1f(u.u_t, t);
      gl.uniform1f(u.u_seed, this.seed);
      gl.uniform1i(u.u_sys, p.sys);
      gl.uniform1f(u.u_speed, p.speed);
      gl.uniform1f(u.u_dens, p.dens);
      gl.uniform1f(u.u_branch, p.branch);
      gl.uniform1f(u.u_sym, p.sym);
      gl.uniform1f(u.u_heat, p.heat);
      gl.uniform1f(u.u_press, this.press);
      gl.uniform4fv(u['u_spores[0]'], this.sporeData);
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
