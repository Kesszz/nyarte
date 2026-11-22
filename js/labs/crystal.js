/* ==========================================================================
   06 — CRYSTAL & TAROT LAB (WebGL Macro-Mineral Shader + Oráculo)
   Microscópio geológico em close-up extremo sobre preto abissal (#040406):
   Drusas reais com estrias de crescimento, fraturas internas em paralaxe,
   inclusões minerais, refração vítrea, matriz rochosa bruta na base,
   micro-partículas em suspensão e condensação energética para o Tarot.
   ========================================================================== */
(function (M) {
  const MINERALS = [
    {
      id: 0,
      n: 'Esmeralda Bruta',
      sub: 'Berilo Cromo-Vanádio · Matriz de Xisto',
      c: '#0D9E5A',
      c2: '#032818',
      hi: '#88FFD2',
      f: 415.3,
      aff: [3, 17, 1, 6, 14, 21]
    },
    {
      id: 1,
      n: 'Drusa de Ametista',
      sub: 'Quartzo Violáceo · Geodo de Basalto',
      c: '#7B2CBF',
      c2: '#1D0636',
      hi: '#E5C4FF',
      f: 392.0,
      aff: [2, 18, 9, 12, 13, 20]
    },
    {
      id: 2,
      n: 'Lápis-Lazúli & Pirita',
      sub: 'Lazurita Ultramarina · Inclusões de Ouro',
      c: '#183BF0',
      c2: '#060D3A',
      hi: '#E4B54A',
      f: 440.0,
      aff: [5, 10, 11, 17, 19, 21]
    },
    {
      id: 3,
      n: 'Quartzo Hialino',
      sub: 'Cristal de Rocha · Dispersão Prismática',
      c: '#D8E6F5',
      c2: '#1C2636',
      hi: '#FFFFFF',
      f: 523.25,
      aff: [0, 8, 17, 19, 20, 21]
    },
    {
      id: 4,
      n: 'Jaspe Vermelho',
      sub: 'Calcedônia Ferruginosa · Veios de Hematita',
      c: '#C1122F',
      c2: '#33050C',
      hi: '#FF9E8A',
      f: 329.63,
      aff: [4, 7, 8, 11, 15, 16]
    },
    {
      id: 5,
      n: 'Obsidiana Iridescente',
      sub: 'Vidro Vulcânico · Fratura Concoidal',
      c: '#262235',
      c2: '#050508',
      hi: '#C8B6FF',
      f: 293.66,
      aff: [9, 13, 15, 16, 18, 0]
    }
  ];

  M.ARCANA = [
    ['0', 'O Louco', 'O salto no abismo', 'Diante da fenda cristalina, o passo sem mapa inaugura a forma. Toda gênese começa no escuro.'],
    ['I', 'O Mago', 'A transmutação', 'Sílica, fogo, pressão e tempo estão postos. O seu gesto é o catalisador que precipita o cristal.'],
    ['II', 'A Sacerdotisa', 'A câmara interna', 'No interior do geodo fechado, a luz aguarda em silêncio. Escute as inclusões ocultas sob a face polida.'],
    ['III', 'A Imperatriz', 'O jardim mineral', 'Como o jardim interno da esmeralda, a matéria viva floresce dentro da rocha aparentemente imóvel.'],
    ['IV', 'O Imperador', 'A rede cristalina', 'Átomos alinhados em simetria rigorosa: é a disciplina invisível da grade que sustenta o brilho.'],
    ['V', 'O Hierofante', 'A memória geológica', 'Cada estria de crescimento guarda um milênio. Aprenda a ler as camadas que antecedem o seu olhar.'],
    ['VI', 'Os Enamorados', 'A geminação', 'Dois prismas que crescem entrelaçados na mesma matriz: permanecer distintos e, ainda assim, inseparáveis.'],
    ['VII', 'O Carro', 'O vetor de luz', 'O feixe atravessa o meio denso sem perder o rumo. Direcione a refração do seu próprio impulso.'],
    ['VIII', 'A Força', 'A dureza silenciosa', 'O mineral não grita contra a pressão da terra — ele a converte em transparência e resistência.'],
    ['IX', 'O Eremita', 'A lanterna rasante', 'Um único feixe no escuro abissal basta para acordar veios de ouro e carmim adormecidos na pedra.'],
    ['X', 'A Roda da Fortuna', 'O ciclo litológico', 'Magma, cristal, erosão, sedimento. Toda forma sólida é apenas uma estação no giro da matéria.'],
    ['XI', 'A Justiça', 'O plano de clivagem', 'Quando a força incide no ângulo exato, a pedra se abre em faces perfeitas. Não há excesso nem falta.'],
    ['XII', 'O Enforcado', 'A refração invertida', 'A luz que entra no prisma dobra seu caminho. Mudar de meio exige aceitar outro índice de visão.'],
    ['XIII', 'A Morte', 'A metamorfose', 'A rocha antiga precisa recristalizar sob calor extremo para renascer como gema translúcida.'],
    ['XIV', 'A Temperança', 'A solução saturada', 'Gota a gota, na cavidade escura, o mineral se deposita. A pressa turva; a paciência clarifica.'],
    ['XV', 'O Diabo', 'O espelho de obsidiana', 'Na fratura negra e afiada do vidro vulcânico, aquilo que parecia sombra devolve um arco-íris oculto.'],
    ['XVI', 'A Torre', 'A fratura concoidal', 'O impacto rompe a superfície rígida — e é justamente pela fissura recém-aberta que a luz penetra o núcleo.'],
    ['XVII', 'A Estrela', 'A inclusão luminosa', 'Mesmo sepultada na matriz bruta, uma agulha de rutilo guarda o clarão inteiro de uma constelação.'],
    ['XVIII', 'A Lua', 'A adularescência', 'Um brilho azulado desliza sob a superfície como maré subterrânea. Confie no que cintila nas profundezas.'],
    ['XIX', 'O Sol', 'A dispersão prismática', 'Luz branca que entra no quartzo puro e se abre em espectro total: clareza sem esconderijo.'],
    ['XX', 'O Julgamento', 'O despertar da drusa', 'O martelo abre o geodo escuro e milhões de facetas respondem ao primeiro contato com o dia.'],
    ['XXI', 'O Mundo', 'A síntese mineral', 'Matriz bruta, cristal translúcido, luz e olhar tornam-se um único corpo em equilíbrio.']
  ];

  const HEAD = '#extension GL_OES_standard_derivatives : enable\n';

  const FS = [
    'precision highp float;',
    'varying vec2 vUv;',
    'uniform vec2 u_res;',
    'uniform vec2 u_m;',
    'uniform float u_t;',
    'uniform float u_seed;',
    'uniform int u_kind;',
    'uniform float u_light;',
    'uniform float u_refract;',
    'uniform float u_stria;',
    'uniform float u_charge;',
    'uniform vec2 u_cardPos;',
    'uniform float u_cardOn;',
    M.GLSL_COMMON,

    'vec2 hash2(vec2 p){',
    '  p = vec2(dot(p,vec2(127.1,311.7)), dot(p,vec2(269.5,183.3)));',
    '  return fract(sin(p + u_seed)*43758.5453);',
    '}',

    // Voronoi cristalino anisotrópico: retorna (distCentro, distBorda, cellId.x, cellId.y)
    'vec4 voronoiCrystal(vec2 p, float skew){',
    '  vec2 n = floor(p);',
    '  vec2 f = fract(p);',
    '  vec2 mg, mr;',
    '  float md = 8.0;',
    '  vec2 cid = vec2(0.0);',
    '  for(int j=-1; j<=1; j++){',
    '    for(int i=-1; i<=1; i++){',
    '      vec2 g = vec2(float(i), float(j));',
    '      vec2 o = hash2(n + g);',
    '      o = 0.15 + 0.70*o;',
    '      vec2 r = g + o - f;',
    '      r.x *= skew;',
    '      // Métrica poliédrica hexagonal/prismática em vez de distância circular lisa',
    '      float hex = max(abs(r.x)*0.866025 + abs(r.y)*0.5, abs(r.y));',
    '      float d = mix(dot(r,r), hex*hex, 0.65);',
    '      if(d < md){ md = d; mr = r; mg = g; cid = n + g; }',
    '    }',
    '  }',
    '  float md2 = 8.0;',
    '  for(int j=-1; j<=1; j++){',
    '    for(int i=-1; i<=1; i++){',
    '      vec2 g = mg + vec2(float(i), float(j));',
    '      vec2 o = 0.15 + 0.70*hash2(n + g);',
    '      vec2 r = g + o - f;',
    '      r.x *= skew;',
    '      if(dot(mr-r, mr-r) > 0.0001){',
    '        md2 = min(md2, dot(0.5*(mr+r), normalize(r-mr)));',
    '      }',
    '    }',
    '  }',
    '  return vec4(sqrt(md), md2, cid);',
    '}',

    // Fraturas internas ramificadas no volume do cristal
    'float internalFracture(vec2 p){',
    '  vec4 v1 = voronoiCrystal(p * 3.4, 1.0);',
    '  vec4 v2 = voronoiCrystal(p * 7.8 + vec2(4.2, 1.9), 1.2);',
    '  float f1 = exp(-v1.y * 28.0) * smoothstep(0.25, 0.75, fbm(p*5.0));',
    '  float f2 = exp(-v2.y * 38.0) * smoothstep(0.35, 0.80, fbm(p*9.0 + 3.1));',
    '  return clamp(f1 + f2 * 0.7, 0.0, 1.0);',
    '}',

    // Poeira mineral macro em suspensão
    'float dustLayer(vec2 uv, float scale, float t, vec2 lp){',
    '  vec2 p = uv * scale + vec2(sin(t*0.18)*0.4, -t*0.22);',
    '  vec2 id = floor(p);',
    '  vec2 f = fract(p) - 0.5;',
    '  vec2 h = hash2(id);',
    '  if(h.x < 0.74) return 0.0;',
    '  vec2 pos = (h - 0.5) * 0.55;',
    '  pos += 0.08 * vec2(sin(t*1.4 + h.x*12.0), cos(t*1.1 + h.y*12.0));',
    '  float d = length(f - pos);',
    '  float spark = 0.5 + 0.5 * sin(t * (2.5 + h.y*4.0) + h.x * 20.0);',
    '  float rad = 0.018 + 0.035 * h.y;',
    '  float glow = smoothstep(rad, 0.0, d) * spark;',
    '  glow += exp(-d * 42.0) * 0.35 * spark;',
    '  return glow;',
    '}',

    'void main(){',
    '  vec2 asp = vec2(u_res.x / max(1.0, u_res.y), 1.0);',
    '  vec2 uv = vUv;',
    '  vec2 p = (uv - vec2(0.5, 0.48)) * asp;',
    '  vec2 lp = (u_m - vec2(0.5, 0.48)) * asp;',

    // ---- 1. Silhueta macro do espécime mineral + matriz rochosa na base ----
    '  vec2 sp = p * vec2(1.05, 1.12);',
    '  float ang = atan(sp.y + 0.14, sp.x);',
    '  float r = length(sp + vec2(0.0, 0.06));',
    // Terminações prismáticas irregulares no contorno da drusa
    '  float crown = 0.44 + 0.12 * sin(ang * 5.0 + u_seed) + 0.08 * cos(ang * 11.0 - u_seed*2.0)',
    '              + 0.09 * (fbm(vec2(cos(ang), sin(ang))*3.2 + u_seed) - 0.5);',
    // Alongamento vertical para colunas de esmeralda/quartzo ou cúpula de drusa
    '  if(u_kind == 0 || u_kind == 3){',
    '    crown = 0.42 + 0.16 * pow(max(0.0, sin(ang)), 1.4) + 0.08 * cos(ang * 9.0 + u_seed);',
    '  }',
    '  float edgeNoise = (fbm(p * 6.5 + u_seed) - 0.5) * 0.08;',
    '  float specimenDist = r - (crown + edgeNoise);',
    '  float inSpecimen = 1.0 - smoothstep(-0.015, 0.012, specimenDist);',

    // Matriz rochosa bruta na base e bordas inferiores do geodo
    '  float matrixNoise = fbm(p * 9.0 + vec2(2.4, 7.1) + u_seed);',
    '  float matrixZone = smoothstep(-0.08, -0.34, p.y + (matrixNoise - 0.5)*0.22)',
    '                   + smoothstep(-0.11, 0.0, specimenDist) * smoothstep(0.18, -0.22, p.y + matrixNoise*0.14);',
    '  matrixZone = clamp(matrixZone, 0.0, 1.0) * inSpecimen;',
    '  float crystalMask = inSpecimen * (1.0 - matrixZone * 0.88);',

    // ---- 2. Geometria de cristais Voronoi + Facetas Poliédricas + Estrias ----
    // Coordenadas orientadas em leque a partir da base da drusa
    '  vec2 cp = p;',
    '  float fan = p.x * (0.45 - p.y * 0.65);',
    '  vec2 prismCoord = (u_kind == 0 || u_kind == 3)',
    '    ? vec2(cp.x * 4.8 + fan * 2.2, cp.y * 2.1)',
    '    : (u_kind == 5 ? cp * 3.4 : vec2(cp.x * 4.2 + fan * 1.4, cp.y * 3.6));',

    '  vec4 V1 = voronoiCrystal(prismCoord + fbm(cp * 4.0) * 0.22, (u_kind == 0 || u_kind == 3) ? 1.55 : 1.1);',
    '  vec4 V2 = voronoiCrystal(prismCoord * 2.4 + vec2(7.3, 2.9), 1.15);',
    '  vec2 cellRnd = hash2(V1.zw);',
    '  vec2 cellRnd2 = hash2(V2.zw + 13.7);',

    // Ângulo individual de cada prisma cristalino
    '  float prismAng = (cellRnd.x - 0.5) * 0.75 + cp.x * 0.55;',
    '  vec2 axisDir = vec2(cos(prismAng), sin(prismAng));',
    '  vec2 perpDir = vec2(-axisDir.y, axisDir.x);',

    // Estrias naturais de crescimento cristalino (transversais no quartzo, longitudinais na esmeralda)
    '  float striaCoord = (u_kind == 0) ? dot(cp, axisDir) * 140.0 : dot(cp, perpDir) * 125.0;',
    '  float striaWave = sin(striaCoord + cellRnd.y * 30.0 + fbm(cp * 18.0) * 4.5);',
    '  float striaStep = floor((striaCoord + cellRnd.x*10.0) * 0.25);',
    '  float striation = (striaWave * 0.65 + (hash(vec2(striaStep, cellRnd.y*99.0)) - 0.5) * 0.8) * u_stria;',

    // Fratura concoidal concêntrica para Obsidiana (u_kind == 5)
    '  if(u_kind == 5){',
    '    float conch = sin(V1.x * 58.0 + fbm(cp * 8.0) * 7.0) * 0.75 + sin(V2.x * 95.0) * 0.35;',
    '    striation = conch * u_stria;',
    '  }',

    // Campo de altura 3D das facetas cristalinas vs matriz rochosa bruta
    '  float facetPlane = V1.y * 0.72 + V2.y * 0.28;',
    '  float stepped = floor(facetPlane * 9.0) / 9.0;',
    '  float crystalH = mix(facetPlane, stepped, 0.32) + striation * 0.028;',
    '  float matrixH = fbm(cp * 24.0 + u_seed) * 0.35 + fbm(cp * 58.0) * 0.18;',
    '  float h = mix(crystalH, matrixH * 0.45, matrixZone) * inSpecimen;',

    // Normal 3D analítica + derivadas para facetas afiadas e micro-relevo da rocha
    '  vec3 N = vec3(0.0, 0.0, 1.0);',
    '  #ifdef GL_OES_standard_derivatives',
    '    vec2 dH = vec2(dFdx(h), dFdy(h)) * u_res.y * 0.14;',
    '    vec3 facetTilt = vec3((cellRnd - 0.5) * 1.15 + (cellRnd2 - 0.5) * 0.45, 1.0);',
    '    facetTilt.xy += axisDir * striation * 0.32;',
    '    vec3 nCryst = normalize(vec3(-dH * 1.8 + facetTilt.xy * 0.85, 1.0));',
    '    vec3 nMat = normalize(vec3(-dH * 2.6, 1.0));',
    '    N = normalize(mix(nCryst, nMat, matrixZone));',
    '  #endif',

    // ---- 3. Feixe de Luz Rasante (Cursor) + Paralaxe de Refração Subsuperficial ----
    '  vec3 Lvec = vec3(lp - p, 0.26);',
    '  float Ldist = length(Lvec);',
    '  vec3 L = Lvec / max(0.001, Ldist);',
    '  float beamAtt = (1.0 / (1.0 + Ldist * Ldist * 5.2)) * u_light * (1.0 + u_charge * 0.65);',
    '  vec3 V = vec3(0.0, 0.0, 1.0);',
    '  vec3 H = normalize(L + V);',

    // Vetor refratado para camadas internas em paralaxe
    '  vec2 refr = (N.xy * 0.055 + (lp - p) * 0.035) * u_refract;',
    '  float frac1 = internalFracture(cp + refr * 1.0);',
    '  float frac2 = internalFracture(cp * 1.35 + refr * 2.1 + vec2(1.7, 3.2));',
    '  float frac3 = internalFracture(cp * 1.80 + refr * 3.2 - vec2(2.4, 1.1));',

    // Dispersão cromática prismática nas fraturas internas
    '  float dispR = internalFracture(cp + refr * 1.65);',
    '  float dispG = frac2;',
    '  float dispB = internalFracture(cp + refr * 2.55);',
    '  vec3 internalPrism = vec3(dispR, dispG, dispB);',

    // ---- 4. Assinatura Material & Inclusões dos 6 Minerais ----
    '  vec3 bodyCol = vec3(0.0);',
    '  vec3 deepCol = vec3(0.0);',
    '  vec3 specCol = vec3(1.0);',
    '  float gloss = 0.88;',
    '  float translucency = 0.78;',
    '  vec3 inclusionCol = vec3(0.0);',

    '  if(u_kind == 0){',
    // ESMERALDA BRUTA: verde cromo profundo + "jardim" interno musgoso + fissuras líquidas
    '    deepCol = vec3(0.01, 0.09, 0.05);',
    '    bodyCol = mix(vec3(0.03, 0.42, 0.22), vec3(0.10, 0.82, 0.48), cellRnd.x * 0.6 + V1.y * 0.5);',
    '    float garden = fbm(cp * 16.0 + refr * 2.5) * fbm(cp * 32.0 - refr * 1.5);',
    '    bodyCol = mix(bodyCol, vec3(0.01, 0.16, 0.08), smoothstep(0.22, 0.52, garden) * 0.75);',
    '    inclusionCol = vec3(0.35, 1.0, 0.72) * (frac1 * 0.9 + frac2 * 0.7) + vec3(0.88, 0.98, 0.92) * pow(frac1, 2.5);',
    '    specCol = vec3(0.85, 1.0, 0.93);',
    '  } else if(u_kind == 1){',
    // DRUSA DE AMETISTA: zonamento violeta-púrpura + lampejos carmim/ouro nas pontas
    '    deepCol = vec3(0.06, 0.01, 0.13);',
    '    float zone = smoothstep(0.0, 0.55, V1.y + cellRnd.y * 0.25);',
    '    bodyCol = mix(vec3(0.32, 0.08, 0.58), vec3(0.68, 0.20, 0.88), zone);',
    '    bodyCol = mix(bodyCol, CARM, smoothstep(0.55, 0.95, frac2) * 0.42);',
    '    inclusionCol = mix(vec3(0.85, 0.55, 1.0), vec3(1.0, 0.45, 0.72), cellRnd2.x) * (frac1 + frac2 * 0.8);',
    '    specCol = vec3(0.96, 0.90, 1.0);',
    '  } else if(u_kind == 2){',
    // LÁPIS-LAZÚLI & PIRITA: azul ultramarino denso + veios brancos de calcita + pirita dourada
    '    deepCol = vec3(0.02, 0.04, 0.18);',
    '    float laz = fbm(cp * 10.0 + refr * 0.5);',
    '    bodyCol = mix(vec3(0.05, 0.14, 0.58), vec3(0.14, 0.34, 0.96), laz);',
    '    float calcite = smoothstep(0.64, 0.74, fbm(cp * 7.5 + vec2(4.1, 2.3))) * (1.0 - smoothstep(0.0, 0.08, abs(fbm(cp*6.0)-0.5)));',
    '    bodyCol = mix(bodyCol, vec3(0.88, 0.90, 0.95), calcite * 0.75);',
    '    vec4 pyrV = voronoiCrystal(cp * 26.0, 1.0);',
    '    float pyriteMask = step(0.76, hash(pyrV.zw)) * smoothstep(0.28, 0.05, pyrV.x);',
    '    float pyrGlint = pow(max(0.0, dot(N, H)), 14.0) * 2.4 + 0.35;',
    '    inclusionCol = GOLD * pyriteMask * pyrGlint * 1.8 + vec3(0.45, 0.68, 1.0) * frac1 * 0.65;',
    '    translucency = 0.42;',
    '    specCol = mix(vec3(0.85, 0.92, 1.0), GOLD, pyriteMask);',
    '  } else if(u_kind == 3){',
    // QUARTZO HIALINO: gelo mineral translúcido + dispersão arco-íris + agulhas de rutilo dourado
    '    deepCol = vec3(0.04, 0.06, 0.09);',
    '    bodyCol = mix(vec3(0.42, 0.50, 0.60), vec3(0.88, 0.94, 1.0), V1.y * 0.8 + 0.2);',
    '    vec3 rainbow = 0.5 + 0.5 * cos(6.28318 * (frac1 * 2.2 + dot(cp, L.xy)*2.5 + vec3(0.0, 0.33, 0.67)));',
    '    float rutile = pow(max(0.0, 1.0 - abs(sin((cp.x*1.7 + cp.y*2.9)*18.0 + fbm(cp*4.0)*3.0))), 24.0) * smoothstep(0.3, 0.7, fbm(cp*6.0));',
    '    inclusionCol = internalPrism * 0.95 + rainbow * frac2 * 0.85 + GOLD * rutile * 1.4;',
    '    translucency = 0.95;',
    '    gloss = 0.96;',
    '  } else if(u_kind == 4){',
    // JASPE VERMELHO & HEMATITA: estratos de carmim, terracota e ocre + veios metálicos de hematita
    '    deepCol = vec3(0.12, 0.02, 0.03);',
    '    float band = sin((cp.y * 9.0 + cp.x * 4.0) + fbm(cp * 6.5) * 5.5) * 0.5 + 0.5;',
    '    bodyCol = mix(CARM, TERR, band);',
    '    bodyCol = mix(bodyCol, OCRE, smoothstep(0.68, 0.88, fbm(cp * 11.0)) * 0.55);',
    '    float hematite = exp(-V1.y * 32.0) + frac1 * 0.75;',
    '    float hemSpec = pow(max(0.0, dot(N, H)), 28.0) * 2.2;',
    '    bodyCol = mix(bodyCol, vec3(0.22, 0.23, 0.27), clamp(hematite, 0.0, 1.0) * 0.7);',
    '    inclusionCol = mix(vec3(1.0, 0.38, 0.24), vec3(0.92, 0.94, 1.0) * hemSpec, 0.5) * clamp(hematite, 0.0, 1.0);',
    '    translucency = 0.48;',
    '  } else {',
    // OBSIDIANA IRIDESCENTE: vidro vulcânico negro + interferência de filme fino em anéis concêntricos
    '    deepCol = vec3(0.01, 0.01, 0.015);',
    '    float film = fbm(cp * 5.5 + refr * 1.8) * 2.4 + V1.x * 1.8 + dot(N.xy, L.xy) * 0.9;',
    '    vec3 irid = 0.5 + 0.5 * cos(6.28318 * (film + vec3(0.0, 0.28, 0.58)));',
    '    irid = mix(irid, mix(VIOL, GOLD, sin(film*6.28)*0.5+0.5), 0.45);',
    '    float sheen = pow(max(0.0, dot(N, L)), 2.2) * beamAtt;',
    '    bodyCol = vec3(0.03, 0.03, 0.045) + irid * sheen * 0.85;',
    '    inclusionCol = irid * (frac1 * 0.85 + pow(1.0 - max(0.0, N.z), 2.5) * 0.75);',
    '    gloss = 0.98;',
    '  }',

    // Matriz rochosa bruta (basalto/xisto escuro com grãos minerais e mica)
    '  float matGrain = fbm(cp * 42.0);',
    '  vec3 matrixCol = mix(vec3(0.035, 0.032, 0.038), vec3(0.11, 0.095, 0.085), matGrain);',
    '  float mica = step(0.84, hash(floor(cp * 65.0))) * pow(max(0.0, dot(N, H)), 12.0);',
    '  matrixCol += GOLD * mica * 0.65;',

    // ---- 5. Iluminação Chiaroscuro de Estúdio + Subsurface Scattering + Especular ----
    '  float diff = max(0.0, dot(N, L));',
    '  vec3 L2 = normalize(vec3(-0.55, 0.65, 0.52));',
    '  float rimDiff = max(0.0, dot(N, L2)) * 0.18;',
    '  float fresnel = pow(1.0 - max(0.0, N.z), 3.0);',
    '  float sh = mix(14.0, 180.0, gloss * (1.0 - matrixZone * 0.88));',
    '  float spec1 = pow(max(0.0, dot(N, H)), sh) * (0.25 + gloss * 1.9) * (1.0 - matrixZone * 0.82);',
    '  float spec2 = pow(max(0.0, dot(N, normalize(L2 + V))), sh * 0.6) * 0.35 * (1.0 - matrixZone * 0.85);',

    // Luz que atravessa o interior translúcido do cristal (subsurface glow)
    '  float sss = pow(max(0.0, dot(-N.xy, (lp - p)) + 0.55), 2.0) * beamAtt * translucency;',
    '  float edgeRidge = exp(-V1.y * 22.0) * (1.0 - matrixZone);',

    '  vec3 litCrystal = deepCol * 0.35',
    '                  + bodyCol * (0.07 + diff * beamAtt * 1.45 + rimDiff + sss * 0.95)',
    '                  + inclusionCol * (0.18 + beamAtt * 1.55)',
    '                  + mix(bodyCol, specCol, 0.65) * edgeRidge * (0.18 + beamAtt * 0.95)',
    '                  + specCol * (spec1 * beamAtt + spec2 + fresnel * beamAtt * 0.42);',

    '  vec3 litMatrix = matrixCol * (0.10 + diff * beamAtt * 1.15 + rimDiff * 0.5);',
    '  vec3 specimenCol = mix(litCrystal, litMatrix, matrixZone);',

    // Condensação energética ao clicar/segurar para o Tarot (u_charge)
    '  if(u_charge > 0.001){',
    '    float pulse = 0.5 + 0.5 * sin(r * 28.0 - u_t * 7.0);',
    '    float veins = (frac1 + edgeRidge) * u_charge * (0.8 + 0.6 * pulse);',
    '    specimenCol += mix(specCol, GOLD, 0.45) * veins * 1.35;',
    '    specimenCol += bodyCol * exp(-r * r * 9.0) * u_charge * 1.1;',
    '  }',

    // ---- 6. Fundo Preto Abissal (#040406), Cáusticas Refratadas & Micro-Partículas ----
    '  vec3 abyss = vec3(0.0157, 0.0157, 0.0235);', // #040406
    // Cáusticas sutis projetadas no breu ao redor da drusa quando o feixe atravessa o cristal
    '  float causticAng = atan(p.y, p.x);',
    '  float causticWave = pow(0.5 + 0.5 * sin(causticAng * 14.0 + fbm(p*5.0 - lp*2.0)*6.0 + u_t*0.4), 5.0);',
    '  float causticMask = (1.0 - inSpecimen) * exp(-max(0.0, specimenDist) * 5.5) * beamAtt;',
    '  vec3 bgCol = abyss + bodyCol * causticWave * causticMask * 0.55 + deepCol * exp(-Ldist*Ldist*4.0) * 0.25;',

    '  vec3 col = mix(bgCol, specimenCol, inSpecimen);',
    // Borda de oclusão profunda onde a matriz emerge do preto abissal
    '  float rimShadow = smoothstep(0.0, 0.035, -specimenDist);',
    '  col *= mix(1.0, 0.45 + 0.55 * rimShadow, inSpecimen);',

    // Micro-partículas minerais flutuando ao redor e sob o feixe rasante
    '  float dust = dustLayer(p, 11.0, u_t, lp) + dustLayer(p + vec2(3.7, 1.2), 19.0, u_t * 0.85, lp) * 0.7;',
    '  float dustLight = 0.15 + beamAtt * 1.65 + exp(-max(0.0, specimenDist) * 4.0) * 0.45;',
    '  col += mix(specCol, GOLD, 0.35) * dust * dustLight * 0.75;',

    // Feixe energético condensado conectando o núcleo do cristal à carta do Tarot revelada
    '  if(u_cardOn > 0.01){',
    '    vec2 a = vec2(0.0, 0.02);',
    '    vec2 b = (u_cardPos - vec2(0.5, 0.48)) * asp;',
    '    vec2 pa = p - a, ba = b - a;',
    '    float hSeg = clamp(dot(pa, ba) / max(0.0001, dot(ba, ba)), 0.0, u_cardOn);',
    '    vec2 perp = normalize(vec2(-ba.y, ba.x));',
    '    float wave = sin(hSeg * 18.0 - u_t * 5.5) * 0.022 * sin(hSeg * 3.14159);',
    '    float dLine = length(pa - ba * hSeg - perp * wave);',
    '    float beamGlow = (exp(-dLine * 55.0) * 0.65 + exp(-dLine * 220.0) * 1.2) * u_cardOn;',
    '    col += mix(bodyCol + 0.25, specCol, 0.55) * beamGlow;',
    '  }',

    '  col = 1.0 - exp(-col * 1.38);',
    '  col = max(col, abyss * 0.85);',
    '  col += (hash(gl_FragCoord.xy + fract(u_t)) - 0.5) * 0.016;',
    '  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);',
    '}'
  ].join('\n');

  M.labs.crystal = class extends M.Base {
    constructor(canvas, opt) {
      super(canvas, opt);
      this.id = 'crystal';
      this.params = {
        kind: 0,
        light: 1.25,
        refract: 1.15,
        stria: 1.0
      };
      this.seed = 2.7;
      this.sx = 0.52;
      this.sy = 0.44;
      this.charge = 0;
      this.cardOn = 0;
      this.card = null;
      this.holdFired = false;

      this.gl = M.makeGL(canvas);
      this.ok = false;
      if (!this.gl) return;
      const gl = this.gl;
      gl.getExtension('OES_standard_derivatives');
      this.prog = M.program(gl, FS, HEAD);
      if (!this.prog) return;
      this.u = M.uni(gl, this.prog, [
        'u_res', 'u_m', 'u_t', 'u_seed', 'u_kind',
        'u_light', 'u_refract', 'u_stria', 'u_charge',
        'u_cardPos', 'u_cardOn'
      ]);
      this.ok = true;
      this.q = this.preview ? 0.68 : 0.72;
    }

    controls() {
      return [
        {
          type: 'seg',
          key: 'kind',
          label: 'Espécime Macro-Mineral',
          opts: MINERALS.map((m, i) => [i, m.n.split(' ')[0] === 'Drusa' ? 'Ametista' : m.n.split(' ')[0]])
        },
        { type: 'slider', key: 'light', label: 'Feixe de luz rasante', min: 0.4, max: 2.4, step: 0.05 },
        { type: 'slider', key: 'refract', label: 'Índice de refração interna', min: 0.2, max: 2.4, step: 0.05 },
        { type: 'slider', key: 'stria', label: 'Estrias & fraturas', min: 0.2, max: 2.0, step: 0.05 },
        { type: 'button', act: 'draw', label: 'Condensar energia · Oráculo' },
        { type: 'button', act: 'close', label: 'Recolher carta' }
      ];
    }

    set(k, v) {
      this.params[k] = v;
      if (k === 'kind') {
        this.seed = 1.5 + v * 3.7 + (this.seed % 1);
        this.snd('bell', MINERALS[v].f);
        if (this.card) this.select(v);
      }
    }

    act(a) {
      if (a === 'draw') this.select(this.params.kind);
      else if (a === 'close') this.closeCard();
    }

    reset() {
      this.closeCard();
      this.seed = 2.7 + this.params.kind * 3.1;
      this.charge = 0;
    }

    randomize() {
      const next = (this.params.kind + 1 + Math.floor(Math.random() * 5)) % MINERALS.length;
      this.params.kind = next;
      this.seed = Math.random() * 60 + 1;
      if (!this.preview) this.select(next);
      return true;
    }

    closeCard() {
      this.card = null;
      if (this.hooks.card) this.hooks.card(null);
    }

    select(kindIdx) {
      if (this.preview) return;
      const cr = MINERALS[kindIdx] || MINERALS[0];
      const ai = cr.aff[Math.floor(Math.random() * cr.aff.length)];
      this.card = { ci: kindIdx, ai };
      this.charge = 1.0;
      this.snd('bell', cr.f);
      if (this.hooks.card) {
        this.hooks.card({
          crystal: { n: cr.n + ' — ' + cr.sub, c: cr.c, hi: cr.hi },
          ci: kindIdx,
          arc: M.ARCANA[ai],
          ai
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
    }

    pointer(type, x, y) {
      this.mx = x;
      this.my = y;
      this.has = true;
      if (type === 'down') {
        this.down = true;
        this.holdFired = false;
        this.charge = Math.max(this.charge, 0.38);
        this.snd('pluck', x, y, 0.65);
      } else if (type === 'up') {
        if (this.down && !this.holdFired && !this.preview) {
          // Clique sobre a formação macro condensa a energia e revela o Arcano
          const dx = x - 0.5;
          const dy = y - 0.52;
          if (dx * dx + dy * dy < 0.24) {
            this.select(this.params.kind);
          }
        }
        this.down = false;
      } else if (type === 'leave') {
        this.down = false;
        this.has = false;
      }
    }

    frame(dt, t) {
      this.t = t;
      if (!this.ok) return;

      let tx = this.mx;
      let ty = this.my;
      if (!this.has) {
        tx = 0.5 + 0.28 * Math.sin(t * 0.42);
        ty = 0.46 + 0.22 * Math.cos(t * 0.31);
      }
      this.sx += (tx - this.sx) * 0.11;
      this.sy += (ty - this.sy) * 0.11;

      if (this.down) {
        this.charge = Math.min(1.15, this.charge + dt * 1.35);
        if (this.charge > 0.92 && !this.holdFired && !this.preview) {
          this.holdFired = true;
          this.select(this.params.kind);
        }
      } else {
        const restCharge = this.card ? 0.35 : 0.0;
        this.charge += (restCharge - this.charge) * Math.min(1, dt * 2.5);
      }

      const targetCard = this.card ? 1.0 : 0.0;
      this.cardOn += (targetCard - this.cardOn) * Math.min(1, dt * 3.2);

      const desk = this.w >= 900 && !this.preview;
      const cardX = desk ? 0.83 : 0.5;
      const cardY = desk ? 0.52 : 0.72;

      const gl = this.gl;
      const u = this.u;
      const p = this.params;
      gl.useProgram(this.prog);
      gl.uniform2f(u.u_res, this.canvas.width, this.canvas.height);
      gl.uniform2f(u.u_m, this.sx, 1.0 - this.sy);
      gl.uniform1f(u.u_t, t);
      gl.uniform1f(u.u_seed, this.seed);
      gl.uniform1i(u.u_kind, p.kind);
      gl.uniform1f(u.u_light, p.light);
      gl.uniform1f(u.u_refract, p.refract);
      gl.uniform1f(u.u_stria, p.stria);
      gl.uniform1f(u.u_charge, this.charge);
      gl.uniform2f(u.u_cardPos, cardX, cardY);
      gl.uniform1f(u.u_cardOn, this.cardOn);
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
