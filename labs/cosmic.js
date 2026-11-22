/* ==========================================================================
   03 — COSMIC LAB (WebGL / GLSL Volumetric Deep-Space Shader + Particle Layer)
   Estética cinematográfica inspirada no James Webb / Hubble sobre vazio
   abissal (#020204): filamentos de gás ionizado via Domain Warping múltiplo,
   nuvens escuras de poeira cósmica (dark dust lanes) com absorção óptica,
   4 fenômenos astronômicos (Olho Cósmico / Hélice, Nebulosa Bipolar /
   Borboleta, Berçário Estelar / Pilares e Galáxia Espiral), estrelas em
   paralaxe 3D com picos de difração óptica, lente gravitacional de Buraco
   Negro ao segurar o clique, explosão de Supernova no duplo clique e camada
   de partículas + constelações reativas ao cursor.
   ========================================================================== */
(function (M) {
  const NEB_FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 u_res;',
    'uniform vec2 u_m;',
    'uniform vec2 u_cam;',
    'uniform float u_t;',
    'uniform float u_seed;',
    'uniform int u_phenom;',     // 0: Olho Cósmico (Hélice), 1: Nebulosa Bipolar, 2: Berçário Estelar, 3: Galáxia Espiral
    'uniform float u_dust;',     // Densidade das faixas escuras de poeira
    'uniform float u_stars;',    // Intensidade do campo estelar
    'uniform float u_vort;',     // Intensidade do Buraco Negro / Lente (0..1)
    'uniform float u_grav;',     // Força gravitacional
    'uniform vec4 u_nova;',      // (x, y, age, active)
    M.GLSL_COMMON,

    'vec2 hash2(vec2 p){',
    '  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));',
    '  return fract(sin(p + u_seed)*43758.5453);',
    '}',

    // Ruído filamentoso turbulento (cristas afiadas de gás ionizado e choque)
    'float ridgeFbm(vec2 p){',
    '  float v = 0.0;',
    '  float a = 0.52;',
    '  mat2 rot = mat2(0.80, -0.60, 0.60, 0.80);',
    '  for(int i=0; i<5; i++){',
    '    float n = 1.0 - abs(2.0 * noise(p) - 1.0);',
    '    v += a * (n * n);',
    '    p = rot * p * 2.08 + vec2(2.3, 7.1);',
    '    a *= 0.52;',
    '  }',
    '  return v;',
    '}',

    // Campo estelar procedural com paralaxe 3D e picos de difração óptica (JWST / Hubble)
    'vec3 starLayer(vec2 p, float scale, float density, float hasSpikes){',
    '  vec2 gp = p * scale;',
    '  vec2 id = floor(gp);',
    '  vec2 f = fract(gp) - 0.5;',
    '  vec2 h = hash2(id);',
    '  float thresh = clamp(1.0 - 0.14 * density, 0.72, 0.98);',
    '  if(h.x < thresh) return vec3(0.0);',
    '  vec2 pos = (h - 0.5) * 0.62;',
    '  vec2 d = f - pos;',
    '  float r = length(d) + 1e-4;',
    '  float lum = fract(h.x * 17.3);',
    '  float tw = 0.78 + 0.22 * sin(u_t * (1.5 + h.y * 4.0) + h.x * 40.0);',
    // Temperatura estelar: branco-azulado (O/B), dourado (G/K), carmim pálido (M)
    '  vec3 sCol = mix(vec3(0.74, 0.86, 1.0), vec3(1.0, 0.93, 0.80), smoothstep(0.25, 0.7, h.y));',
    '  sCol = mix(sCol, vec3(1.0, 0.58, 0.44), smoothstep(0.75, 0.98, h.y));',
    '  float core = exp(-r * r * (420.0 / (0.35 + lum)));',
    '  float halo = exp(-r * (14.0 / (0.4 + lum))) * 0.35;',
    '  float spikes = 0.0;',
    '  if(hasSpikes > 0.5 && lum > 0.62){',
    // Picos de difração cruzados + hexagonais estilo James Webb
    '    float sx = exp(-abs(d.y) * 95.0) * exp(-abs(d.x) * 6.5);',
    '    float sy = exp(-abs(d.x) * 95.0) * exp(-abs(d.y) * 6.5);',
    '    vec2 d60 = vec2(d.x * 0.5 + d.y * 0.866, -d.x * 0.866 + d.y * 0.5);',
    '    float s6 = exp(-abs(d60.y) * 120.0) * exp(-abs(d60.x) * 9.0) * 0.55;',
    '    spikes = (sx + sy + s6) * (lum - 0.5) * 1.9;',
    '  }',
    '  return sCol * (core * 1.8 + halo + spikes) * tw * (0.4 + 0.9 * lum);',
    '}',

    'void main(){',
    '  vec2 asp = vec2(u_res.x / max(1.0, u_res.y), 1.0);',
    '  vec2 uv = vUv;',
    '  vec2 p0 = (uv - 0.5) * asp;',
    '  vec2 mp = (u_m - 0.5) * asp;',

    // ---- 1. Lente Gravitacional (Buraco Negro ao segurar o clique) & Onda de Supernova ----
    '  vec2 dm = p0 - mp;',
    '  float rMouse = length(dm) + 1e-4;',
    '  float bhStrength = u_vort * u_grav;',
    '  float rEvent = 0.042 * bhStrength;',
    '  float rPhoton = rEvent * 1.48;',

    // Deflexão relativística da luz + arrasto de referencial (frame dragging)
    '  vec2 p = p0 + u_cam * 0.18;',
    '  if(bhStrength > 0.01){',
    '    float lens = (rEvent * rEvent * 2.4) / (rMouse * rMouse + 0.0008);',
    '    float swirl = exp(-rMouse * 6.5) * bhStrength * 1.45;',
    '    float ca = cos(swirl), sa = sin(swirl);',
    '    vec2 bent = mat2(ca, -sa, sa, ca) * (dm * (1.0 - lens));',
    '    p = mp + bent + u_cam * 0.18;',
    '  }',

    // Deslocamento radial de gás causado pela onda de choque da Supernova
    '  float novaShock = 0.0;',
    '  float novaFlash = 0.0;',
    '  vec3 novaCol = vec3(0.0);',
    '  if(u_nova.w > 0.5){',
    '    vec2 np = (u_nova.xy - 0.5) * asp;',
    '    vec2 dn = p0 - np;',
    '    float rn = length(dn) + 1e-4;',
    '    float age = u_nova.z;',
    '    float shockR = 0.03 + (1.0 - exp(-age * 0.85)) * 0.72;',
    '    float angN = atan(dn.y, dn.x);',
    '    float filN = ridgeFbm(vec2(cos(angN), sin(angN)) * 3.5 + dn * 4.5 - age * 0.4);',
    '    float shell = exp(-abs(rn - shockR + (filN - 0.5)*0.055) * (24.0 + age * 4.0));',
    '    float fadeN = clamp(1.0 - age * 0.28, 0.0, 1.0);',
    '    novaShock = shell * fadeN;',
    '    p -= (dn / rn) * novaShock * 0.065;',
    '    novaFlash = exp(-rn * rn * 18.0) * exp(-age * 2.6) * 2.8;',
    '    novaCol = mix(vec3(0.35, 0.75, 1.0), mix(GOLD, CARM, smoothstep(shockR - 0.05, shockR + 0.04, rn)), 0.65)',
    '            * novaShock * (1.6 + filN * 1.8) + vec3(1.0, 0.96, 0.90) * novaFlash;',
    '  }',

    // Perturbação sutil da poeira próxima ao cursor
    '  float cursorWake = exp(-rMouse * rMouse * 11.0);',
    '  vec2 pNeb = p - dm * cursorWake * 0.045;',

    // ---- 2. Domain Warping Múltiplo para Gás Ionizado & Poeira Escura ----
    '  float t = u_t * 0.025;',
    '  vec2 q = vec2(',
    '    fbm(pNeb * 2.1 + vec2(0.0, t)),',
    '    fbm(pNeb * 2.1 + vec2(5.2, 1.3 - t))',
    '  );',
    '  vec2 r = vec2(',
    '    fbm(pNeb * 2.8 + 2.2 * q + vec2(1.7, 9.2) + t * 0.7),',
    '    fbm(pNeb * 2.8 + 2.2 * q + vec2(8.3, 2.8) - t * 0.6)',
    '  );',
    '  float fGas = fbm(pNeb * 2.6 + 2.1 * r);',
    '  float fRidge = ridgeFbm(pNeb * 3.2 + 1.6 * r);',

    // ---- 3. Os 4 Fenômenos Astronômicos Reais (u_phenom) ----
    '  vec3 gasEmission = vec3(0.0);',
    '  float dustLane = 0.0;',
    '  float rimGlow = 0.0;',

    '  if(u_phenom == 0){',
    // 0: OLHO CÓSMICO (NEBULOSA DA HÉLICE — NGC 7293)
    '    vec2 hp = pNeb * mat2(0.92, -0.39, 0.39, 0.92) * vec2(1.0, 1.18);',
    '    float rad = length(hp) + 1e-4;',
    '    float ang = atan(hp.y, hp.x);',
    // Nós cometários radiais (radial cometary knots & spokes)
    '    float spokes = ridgeFbm(vec2(ang * 4.5, rad * 7.5 - fGas * 1.4) + u_seed);',
    '    float innerOIII = smoothstep(0.36, 0.04, rad) * (0.45 + 0.55 * fGas);',
    '    float mainRing = exp(-pow((rad - 0.29 + (fGas - 0.5)*0.09) * 5.8, 2.0));',
    '    float outerSkirt = exp(-pow((rad - 0.44 + (r.x - 0.5)*0.14) * 3.8, 2.0)) * fRidge;',
    '    vec3 colOIII = mix(vec3(0.02, 0.28, 0.88), vec3(0.08, 0.85, 0.96), smoothstep(0.28, 0.04, rad));',
    '    vec3 colInnerRim = mix(GOLD, vec3(0.95, 0.48, 0.14), smoothstep(0.22, 0.34, rad));',
    '    vec3 colOuterHa = mix(CARM, vec3(0.55, 0.04, 0.14), smoothstep(0.30, 0.56, rad));',
    '    gasEmission = colOIII * innerOIII * (0.75 + spokes * 0.65)',
    '                + colInnerRim * mainRing * (0.65 + spokes * 1.15)',
    '                + colOuterHa * (mainRing * 0.75 + outerSkirt * 1.35) * (0.55 + fRidge * 0.9);',
    '    dustLane = smoothstep(0.46, 0.78, fRidge * 0.75 + q.y * 0.4) * smoothstep(0.14, 0.55, rad);',
    '    rimGlow = exp(-abs(dustLane - 0.35) * 12.0) * mainRing;',

    '  } else if(u_phenom == 1){',
    // 1: NEBULOSA BIPOLAR (BORBOLETA / AMPULHETA — NGC 6302)
    '    vec2 bp = pNeb * mat2(0.76, -0.65, 0.65, 0.76);',
    '    float rad = length(bp) + 1e-4;',
    '    float axial = abs(bp.x);',
    '    float waist = abs(bp.y) / (0.045 + axial * 1.35);',
    '    float lobeMask = smoothstep(1.35, 0.25, waist) * exp(-rad * 2.15);',
    '    float shockWings = ridgeFbm(vec2(bp.x * 4.2, bp.y * 3.8) + r * 1.5);',
    '    vec3 jetCore = mix(vec3(0.18, 0.42, 1.0), vec3(0.62, 0.18, 0.95), smoothstep(0.05, 0.35, rad));',
    '    vec3 wingFire = mix(vec3(0.96, 0.10, 0.48), mix(CARM, OCRE, shockWings), smoothstep(0.18, 0.52, axial));',
    '    gasEmission = (jetCore * exp(-waist * 1.8) + wingFire * (0.45 + shockWings * 1.35)) * lobeMask * 1.55;',
    // Cinturão equatorial denso de poeira escura bloqueando o núcleo
    '    float torus = exp(-abs(bp.x) * 18.0) * exp(-abs(bp.y) * 6.5) * (0.7 + fGas * 0.6);',
    '    dustLane = clamp(torus + smoothstep(0.52, 0.82, fRidge) * lobeMask * 0.85, 0.0, 1.0);',
    '    rimGlow = exp(-abs(bp.x) * 26.0) * exp(-abs(bp.y) * 9.0) * 1.2;',

    '  } else if(u_phenom == 2){',
    // 2: BERÇÁRIO ESTELAR (PILARES DA CRIAÇÃO & POEIRA — JWST M16 / CARINA)
    '    vec2 pp = pNeb * mat2(0.85, 0.52, -0.52, 0.85);',
    '    float pillar1 = smoothstep(0.22, -0.04, abs(pp.x + 0.14 + (q.x - 0.5)*0.22) - 0.06) * smoothstep(0.28, -0.35, pp.y + r.y*0.18);',
    '    float pillar2 = smoothstep(0.18, -0.03, abs(pp.x - 0.18 + (q.y - 0.5)*0.18) - 0.04) * smoothstep(0.14, -0.38, pp.y + r.x*0.15);',
    '    float cloudBank = smoothstep(0.22, -0.42, pp.y + (fGas - 0.5) * 0.42 + fRidge * 0.22);',
    '    float rawPillars = clamp((pillar1 + pillar2 * 0.85 + cloudBank * 0.75) * (0.65 + fRidge * 0.75), 0.0, 1.0);',
    // Fundo ionizado azul-cobalto/ciano no topo e carmim-ouro nas bordas foto-evaporadas
    '    float backGlow = exp(-length(pNeb - vec2(0.05, 0.18)) * 2.2) * (0.55 + fGas * 0.75);',
    '    vec3 skyIon = mix(vec3(0.04, 0.16, 0.58), vec3(0.12, 0.55, 0.85), fGas) * backGlow * 0.95;',
    // Borda incandescente (photo-ionized bright rim) ao redor das colunas de poeira escura
    '    float photoRim = smoothstep(0.18, 0.52, rawPillars) * (1.0 - smoothstep(0.52, 0.78, rawPillars));',
    '    photoRim *= (0.6 + fRidge * 1.4);',
    '    vec3 rimCol = mix(CARM, mix(OCRE, GOLD, fRidge), smoothstep(-0.2, 0.25, pp.y));',
    '    gasEmission = skyIon + rimCol * photoRim * 2.35 + CARM * fRidge * cloudBank * 0.45;',
    '    dustLane = smoothstep(0.45, 0.78, rawPillars);',
    '    rimGlow = photoRim * 1.4;',

    '  } else {',
    // 3: GALÁXIA ESPIRAL & LENTE (BRAÇOS DE POEIRA & NÚCLEO DOURADO)
    '    vec2 gp = pNeb * mat2(0.88, -0.47, 0.47, 0.88) * vec2(1.0, 1.65);',
    '    float rad = length(gp) + 1e-4;',
    '    float ang = atan(gp.y, gp.x);',
    '    float logSpiral = ang * 2.0 - log(rad + 0.035) * 5.2 + fGas * 2.4;',
    '    float arms = pow(0.5 + 0.5 * cos(logSpiral), 2.4) * exp(-rad * 2.4);',
    '    float dustArm = pow(0.5 + 0.5 * cos(logSpiral - 0.55), 4.0) * exp(-rad * 2.6) * fRidge;',
    '    float bulge = exp(-rad * rad * 28.0);',
    '    float knots = pow(fRidge, 3.0) * arms;',
    '    vec3 armCol = mix(vec3(0.14, 0.36, 0.98), vec3(0.52, 0.22, 0.92), fGas) * arms * 1.45;',
    '    armCol += CARM * knots * 1.9 + mix(GOLD, vec3(1.0, 0.92, 0.78), bulge) * bulge * 1.85;',
    '    gasEmission = armCol;',
    '    dustLane = dustArm * 1.35 * smoothstep(0.05, 0.35, rad);',
    '    rimGlow = knots * 0.8;',
    '  }',

    // ---- 4. Vazio Abissal (#020204), Absorção por Poeira Escura & Estrelas 3D ----
    '  vec3 abyss = vec3(0.0078, 0.0078, 0.0157);', // #020204
    // Absorção física Beer-Lambert pelas nuvens escuras de poeira cósmica
    '  float dustAbsorb = exp(-dustLane * u_dust * 3.4);',
    '  vec3 dustAmbient = vec3(0.03, 0.015, 0.012) * dustLane * min(1.0, u_dust);',
    '  vec3 nebCol = gasEmission * (0.75 + cursorWake * 0.45) * dustAbsorb',
    '              + mix(GOLD, CARM, 0.45) * rimGlow * (0.45 + 0.35 * u_dust)',
    '              + dustAmbient;',

    // Estrelas em 3 camadas de profundidade com paralaxe 3D ao mover o cursor
    '  vec2 stP1 = p + u_cam * 0.08;',
    '  vec2 stP2 = p + u_cam * 0.22 + vec2(3.7, 1.9);',
    '  vec2 stP3 = p + u_cam * 0.42 + vec2(8.1, 4.4);',
    '  vec3 starsBg = starLayer(stP1, 46.0, u_stars, 0.0) * 0.55 * dustAbsorb;',
    '  vec3 starsMid = starLayer(stP2, 24.0, u_stars, 0.0) * (0.35 + 0.65 * dustAbsorb);',
    '  vec3 starsFg = starLayer(stP3, 12.0, u_stars, 1.0);',

    '  vec3 col = abyss + nebCol + starsBg + starsMid + starsFg + novaCol;',

    // ---- 5. Horizonte de Eventos, Anel de Fótons & Disco de Acreção (Buraco Negro) ----
    '  if(bhStrength > 0.01){',
    '    float photonRing = exp(-abs(rMouse - rPhoton) * 95.0) * bhStrength;',
    // Disco de acreção inclinado com efeito Doppler relativístico
    '    vec2 dp = dm * mat2(0.92, -0.38, 0.38, 0.92) * vec2(1.0, 2.8);',
    '    float rDisk = length(dp);',
    '    float diskBand = exp(-pow((rDisk - rPhoton * 2.1) * 22.0, 2.0)) * bhStrength;',
    '    float doppler = 0.65 + 0.55 * (dp.x / max(0.01, rDisk));',
    '    vec3 diskCol = mix(CARM, mix(OCRE, vec3(0.85, 0.95, 1.0), clamp(doppler, 0.0, 1.0)), 0.7);',
    '    col += diskCol * diskBand * (1.2 + fRidge * 0.8) + vec3(1.0, 0.92, 0.76) * photonRing * 2.2;',
    // Sombra negra absoluta do Horizonte de Eventos
    '    float shadow = smoothstep(rEvent * 0.92, rEvent * 1.18, rMouse);',
    '    col *= shadow;',
    '  }',

    // Mantém as regiões externas do quadro em preto abissal (#020204)
    '  float vig = smoothstep(1.38, 0.22, length(p0));',
    '  col = mix(abyss, col, 0.35 + 0.65 * vig);',
    '  col = 1.0 - exp(-col * 1.35);',
    '  col = max(col, abyss);',
    '  col += (hash(gl_FragCoord.xy + fract(u_t)) - 0.5) * 0.014;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  // Segundo programa WebGL: Camada de Partículas 3D de Alta Precisão + Constelações Geométricas
  const PART_VS = [
    'attribute vec4 a_p;', // x (NDC), y (NDC), size, alpha
    'attribute vec3 a_c;', // r, g, b
    'varying vec3 v_c;',
    'varying float v_a;',
    'void main(){',
    '  v_c = a_c;',
    '  v_a = a_p.w;',
    '  gl_Position = vec4(a_p.xy, 0.0, 1.0);',
    '  gl_PointSize = a_p.z;',
    '}'
  ].join('\n');

  const PART_FS = [
    'precision mediump float;',
    'varying vec3 v_c;',
    'varying float v_a;',
    'uniform int u_isPoint;',
    'void main(){',
    '  if(u_isPoint == 1){',
    '    vec2 d = gl_PointCoord - 0.5;',
    '    float r = length(d) * 2.0;',
    '    if(r > 1.0) discard;',
    '    float core = exp(-r * r * 6.5);',
    '    float cross = (exp(-abs(d.x)*26.0)*exp(-abs(d.y)*4.0) + exp(-abs(d.y)*26.0)*exp(-abs(d.x)*4.0)) * 0.45;',
    '    gl_FragColor = vec4(v_c, (core + cross) * v_a);',
    '  } else {',
    '    gl_FragColor = vec4(v_c, v_a);',
    '  }',
    '}'
  ].join('\n');

  M.labs.cosmic = class extends M.Base {
    constructor(canvas, opt) {
      super(canvas, opt);
      this.id = 'cosmic';
      this.params = {
        phenom: 0,     // 0: Olho Cósmico (Hélice), 1: Nebulosa Bipolar, 2: Berçário Estelar, 3: Galáxia Espiral
        grav: 1.15,
        dust: 1.1,
        stars: 1.1,
        link: 155,
        speed: 1.0
      };
      this.seed = 3.7;
      this.sx = 0.5;
      this.sy = 0.5;
      this.camX = 0;
      this.camY = 0;
      this.vort = 0;
      this.holdT = 0;
      this.novaState = { x: 0.5, y: 0.5, age: 99, active: 0 };

      this.gl = M.makeGL(canvas);
      this.ok = false;
      if (!this.gl) return;
      const gl = this.gl;

      // Programa 1: Shader Volumétrico Deep-Space
      this.prog = M.program(gl, NEB_FS);
      if (!this.prog) return;
      this.quadBuf = gl.getParameter(gl.ARRAY_BUFFER_BINDING);
      this.u = M.uni(gl, this.prog, [
        'u_res', 'u_m', 'u_cam', 'u_t', 'u_seed', 'u_phenom',
        'u_dust', 'u_stars', 'u_vort', 'u_grav', 'u_nova'
      ]);

      // Programa 2: Partículas Astrofísicas + Constelações
      this.pProg = this._makeParticleProg(gl);
      if (this.pProg) {
        this.pBuf = gl.createBuffer();
        this.a_p = gl.getAttribLocation(this.pProg, 'a_p');
        this.a_c = gl.getAttribLocation(this.pProg, 'a_c');
        this.u_isPoint = gl.getUniformLocation(this.pProg, 'u_isPoint');
      }

      this.ok = true;
      this.q = this.preview ? 0.68 : 0.76;
      this.nodes = [];
      this.vertData = new Float32Array(2400 * 7);
    }

    _makeParticleProg(gl) {
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) return null;
        return s;
      };
      const vs = compile(gl.VERTEX_SHADER, PART_VS);
      const fs = compile(gl.FRAGMENT_SHADER, PART_FS);
      if (!vs || !fs) return null;
      const p = gl.createProgram();
      gl.attachShader(p, vs);
      gl.attachShader(p, fs);
      gl.linkProgram(p);
      return gl.getProgramParameter(p, gl.LINK_STATUS) ? p : null;
    }

    controls() {
      return [
        {
          type: 'seg',
          key: 'phenom',
          label: 'Fenômeno Cósmico',
          opts: [
            [0, 'Olho Cósmico (Hélice)'],
            [1, 'Nebulosa Bipolar'],
            [2, 'Berçário Estelar'],
            [3, 'Galáxia Espiral']
          ]
        },
        { type: 'slider', key: 'grav', label: 'Lente & vórtice gravitacional', min: 0.3, max: 2.6, step: 0.05 },
        { type: 'slider', key: 'dust', label: 'Nuvens de poeira escura', min: 0.2, max: 2.2, step: 0.05 },
        { type: 'slider', key: 'stars', label: 'Campo estelar & difração', min: 0.4, max: 2.2, step: 0.05 },
        { type: 'slider', key: 'link', label: 'Constelações (alcance)', min: 70, max: 280, step: 5 },
        { type: 'slider', key: 'speed', label: 'Paralaxe & deriva 3D', min: 0.1, max: 2.8, step: 0.05 },
        { type: 'button', act: 'nova', label: 'Detonar Supernova' }
      ];
    }

    set(k, v) {
      this.params[k] = v;
      if (k === 'phenom') {
        this.seed = 2.1 + v * 4.3 + (this.seed % 1);
      }
    }

    act(a) {
      if (a === 'nova') {
        this.triggerNova(0.35 + Math.random() * 0.3, 0.35 + Math.random() * 0.3);
      }
    }

    reset() {
      this.novaState.active = 0;
      this.vort = 0;
      this.seed = 3.7 + this.params.phenom * 4.3;
      this.buildNodes();
    }

    randomize() {
      this.params.phenom = (this.params.phenom + 1) % 4;
      this.seed = Math.random() * 70 + 1;
      this.buildNodes();
      return true;
    }

    buildNodes() {
      const count = this.preview ? 85 : 190;
      const palette = [
        [0.82, 0.90, 1.00], // Branco-azulado O/B
        [1.00, 0.94, 0.82], // Branco-dourado F/G
        [0.92, 0.72, 0.32], // Ouro mineral
        [1.00, 0.46, 0.36], // Gigante vermelha pálida
        [0.45, 0.78, 1.00]  // Azul ciano jovem
      ];
      this.nodes = [];
      for (let i = 0; i < count; i++) {
        const z = 0.25 + Math.pow(Math.random(), 1.4) * 0.85;
        const c = palette[i % palette.length];
        this.nodes.push({
          x: Math.random(),
          y: Math.random(),
          vx: M.rnd(-0.012, 0.012) * z,
          vy: M.rnd(-0.012, 0.012) * z,
          z,
          size: (1.6 + Math.random() * 3.4) * z,
          alpha: 0.35 + 0.6 * z,
          c,
          star: i < (this.preview ? 38 : 85)
        });
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
      if (!this.nodes.length) this.buildNodes();
    }

    triggerNova(nx, ny) {
      this.novaState = { x: nx, y: 1.0 - ny, age: 0, active: 1 };
      this.snd('boom');
      // Impulso radial nas partículas de poeira próximas
      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        const dx = n.x - nx;
        const dy = n.y - ny;
        const d = Math.hypot(dx, dy) + 0.02;
        if (d < 0.45) {
          const push = (0.45 - d) * 0.42 * n.z;
          n.vx += (dx / d) * push;
          n.vy += (dy / d) * push;
        }
      }
    }

    pointer(type, x, y) {
      this.mx = x;
      this.my = y;
      this.has = true;
      if (type === 'down') {
        this.down = true;
        this.holdT = 0;
        this.snd('pluck', x, y, 0.75);
      } else if (type === 'up') {
        this.down = false;
      } else if (type === 'leave') {
        this.down = false;
        this.has = false;
      } else if (type === 'dbl') {
        this.down = false;
        this.triggerNova(x, y);
      }
    }

    frame(dt, t) {
      this.t = t;
      if (!this.ok) return;
      const stepDt = Math.min(dt, 0.033) || 0.016;
      const p = this.params;

      let tx = this.mx;
      let ty = this.my;
      if (!this.has) {
        tx = 0.5 + 0.25 * Math.sin(t * 0.28);
        ty = 0.5 + 0.20 * Math.cos(t * 0.21);
      }
      this.sx += (tx - this.sx) * 0.1;
      this.sy += (ty - this.sy) * 0.1;

      // Paralaxe suave 3D da câmera espacial
      const targetCamX = (this.sx - 0.5) * p.speed;
      const targetCamY = (0.5 - this.sy) * p.speed;
      this.camX += (targetCamX - this.camX) * 0.07;
      this.camY += (targetCamY - this.camY) * 0.07;

      // Buraco negro / lente gravitacional ao segurar o clique
      if (this.down) this.holdT += stepDt;
      else this.holdT = 0;
      const targetVort = this.down ? Math.min(1.0, 0.35 + this.holdT * 1.25) : 0.0;
      this.vort += (targetVort - this.vort) * Math.min(1, stepDt * 6.5);

      if (this.novaState.active > 0.5) {
        this.novaState.age += stepDt;
        if (this.novaState.age > 3.8) this.novaState.active = 0;
      }

      const gl = this.gl;
      const u = this.u;

      // ---- PASSO 1: Shader Volumétrico Deep-Space ----
      gl.disable(gl.BLEND);
      gl.useProgram(this.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.quadBuf);
      const loc = gl.getAttribLocation(this.prog, 'a');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(u.u_res, this.canvas.width, this.canvas.height);
      gl.uniform2f(u.u_m, this.sx, 1.0 - this.sy);
      gl.uniform2f(u.u_cam, this.camX, this.camY);
      gl.uniform1f(u.u_t, t * p.speed);
      gl.uniform1f(u.u_seed, this.seed);
      gl.uniform1i(u.u_phenom, p.phenom);
      gl.uniform1f(u.u_dust, p.dust);
      gl.uniform1f(u.u_stars, p.stars);
      gl.uniform1f(u.u_vort, this.vort);
      gl.uniform1f(u.u_grav, p.grav);
      gl.uniform4f(u.u_nova, this.novaState.x, this.novaState.y, this.novaState.age, this.novaState.active);
      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // ---- PASSO 2: Partículas de Alta Precisão & Constelações Próximas ao Cursor ----
      if (this.pProg && this.nodes.length) {
        this._renderParticlesAndConstellations(gl, stepDt, t);
      }
    }

    _renderParticlesAndConstellations(gl, dt, t) {
      const p = this.params;
      const w = Math.max(1, this.w);
      const h = Math.max(1, this.h);
      const linkNorm = p.link / Math.max(w, h);
      const dprScale = this.canvas.width / w;

      const nearStars = [];
      let ptCount = 0;
      const vd = this.vertData;

      for (let i = 0; i < this.nodes.length; i++) {
        const n = this.nodes[i];
        // Movimento orbital sutil + atração gravitacional quando o vórtice está ativo
        if (this.vort > 0.02) {
          const dx = this.sx - n.x;
          const dy = this.sy - n.y;
          const d = Math.hypot(dx, dy) + 0.015;
          if (d < 0.38) {
            const f = (this.vort * p.grav * 0.018) / (d + 0.04);
            n.vx += (dx / d) * f + (-dy / d) * f * 1.15;
            n.vy += (dy / d) * f + (dx / d) * f * 1.15;
          }
        }

        n.vx *= 0.985;
        n.vy *= 0.985;
        n.x = ((n.x + (n.vx + 0.0025 * n.z * p.speed) * dt) % 1 + 1) % 1;
        n.y = ((n.y + n.vy * dt) % 1 + 1) % 1;

        // Posição com paralaxe 3D
        const px = n.x - (this.sx - 0.5) * 0.075 * n.z;
        const py = n.y - (this.sy - 0.5) * 0.075 * n.z;
        const ndcX = px * 2.0 - 1.0;
        const ndcY = (1.0 - py) * 2.0 - 1.0;

        // Sombra do buraco negro oculta partículas dentro do horizonte de eventos
        const dCursor = Math.hypot(px - this.sx, py - this.sy);
        if (this.vort > 0.2 && dCursor < 0.035 * this.vort * p.grav) continue;

        const tw = 0.72 + 0.28 * Math.sin(t * 2.4 + i * 1.7);
        const o = ptCount * 7;
        vd[o] = ndcX;
        vd[o + 1] = ndcY;
        vd[o + 2] = n.size * dprScale * (0.7 + 0.35 * p.stars);
        vd[o + 3] = n.alpha * tw;
        vd[o + 4] = n.c[0];
        vd[o + 5] = n.c[1];
        vd[o + 6] = n.c[2];
        ptCount++;

        if (n.star && this.has && dCursor < linkNorm) {
          nearStars.push({ ndcX, ndcY, px, py, d: dCursor, c: n.c });
        }
      }

      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
      gl.useProgram(this.pProg);
      gl.bindBuffer(gl.ARRAY_BUFFER, this.pBuf);

      const stride = 7 * 4;
      gl.enableVertexAttribArray(this.a_p);
      gl.vertexAttribPointer(this.a_p, 4, gl.FLOAT, false, stride, 0);
      gl.enableVertexAttribArray(this.a_c);
      gl.vertexAttribPointer(this.a_c, 3, gl.FLOAT, false, stride, 4 * 4);

      // Desenha estrelas e poeira 3D em paralaxe
      gl.uniform1i(this.u_isPoint, 1);
      gl.bufferData(gl.ARRAY_BUFFER, vd.subarray(0, ptCount * 7), gl.DYNAMIC_DRAW);
      gl.drawArrays(gl.POINTS, 0, ptCount);

      // Desenha linhas sutis de constelação apenas entre as estrelas próximas ao ponteiro
      if (nearStars.length > 1) {
        nearStars.sort((a, b) => a.d - b.d);
        const sel = nearStars.slice(0, 11);
        let lineVerts = 0;
        const pushV = (x, y, a, r, g, b) => {
          const o = lineVerts * 7;
          vd[o] = x; vd[o + 1] = y; vd[o + 2] = 1.0; vd[o + 3] = a;
          vd[o + 4] = r; vd[o + 5] = g; vd[o + 6] = b;
          lineVerts++;
        };

        const cNdcX = this.sx * 2.0 - 1.0;
        const cNdcY = (1.0 - this.sy) * 2.0 - 1.0;

        for (let i = 0; i < sel.length; i++) {
          const a = sel[i];
          if (i < 3) {
            const al = (1.0 - a.d / linkNorm) * 0.28;
            pushV(cNdcX, cNdcY, al, 0.89, 0.71, 0.29);
            pushV(a.ndcX, a.ndcY, al, 0.89, 0.71, 0.29);
          }
          for (let j = i + 1; j < sel.length; j++) {
            const b = sel[j];
            const dd = Math.hypot(a.px - b.px, a.py - b.py);
            if (dd < linkNorm * 0.62) {
              const al = (1.0 - dd / (linkNorm * 0.62)) * (1.0 - a.d / linkNorm) * 0.36;
              pushV(a.ndcX, a.ndcY, al, 0.88, 0.92, 1.0);
              pushV(b.ndcX, b.ndcY, al, 0.88, 0.92, 1.0);
            }
          }
        }

        if (lineVerts > 0) {
          gl.uniform1i(this.u_isPoint, 0);
          gl.bufferData(gl.ARRAY_BUFFER, vd.subarray(0, lineVerts * 7), gl.DYNAMIC_DRAW);
          gl.drawArrays(gl.LINES, 0, lineVerts);
        }
      }
      gl.disable(gl.BLEND);
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
