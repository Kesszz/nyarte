/* MATÉRIA // LAB — núcleo compartilhado: paleta, utilitários, WebGL, classe base dos laboratórios */
window.M = window.M || {};
M.labs = M.labs || {};
(function (M) {
  M.SW = [['Carmim', '#C1122F'], ['Cobalto', '#1D3FE0'], ['Roxo', '#6A2BB8'], ['Branco', '#F6F2EA'],
          ['Ocre', '#D08A1E'], ['Terracota', '#B4502B'], ['Siena', '#7A3419'], ['Ouro', '#E4B54A']];
  M.rgb = (h) => { const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  M.rgb01 = (h) => M.rgb(h).map((v) => v / 255);
  M.rgba = (h, a) => { const c = M.rgb(h); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; };
  M.clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  M.lerp = (a, b, t) => a + (b - a) * t;
  M.rnd = (a, b) => a + Math.random() * (b - a);
  M.hash1 = (x, y) => { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); };
  M.vnoise = (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = M.hash1(xi, yi), b = M.hash1(xi + 1, yi), c = M.hash1(xi, yi + 1), d = M.hash1(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  // cor interpolada da paleta (t 0..1 cíclico)
  M.palAt = (t) => {
    t = ((t % 1) + 1) % 1; const n = M.SW.length, x = t * n, i = Math.floor(x), f = x - i;
    const a = M.rgb(M.SW[i % n][1]), b = M.rgb(M.SW[(i + 1) % n][1]);
    return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
  };

  M.QUAD_VS = 'attribute vec2 a;varying vec2 vUv;void main(){vUv=a*.5+.5;gl_Position=vec4(a,0.,1.);}';
  M.GLSL_COMMON = [
    'const vec3 CARM=vec3(.76,.07,.18);const vec3 COBA=vec3(.11,.25,.88);const vec3 VIOL=vec3(.42,.17,.72);',
    'const vec3 WHIT=vec3(.96,.95,.92);const vec3 OCRE=vec3(.82,.54,.12);const vec3 TERR=vec3(.71,.31,.17);',
    'const vec3 SIEN=vec3(.48,.20,.10);const vec3 GOLD=vec3(.89,.71,.29);',
    'float hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*.1031);p3+=dot(p3,p3.yzx+33.33);return fract((p3.x+p3.y)*p3.z);}',
    'float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.-2.*f);',
    'return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.;float a=.5;mat2 r=mat2(.8,-.6,.6,.8);',
    'for(int i=0;i<5;i++){v+=a*noise(p);p=r*p*2.03+vec2(1.7,9.2);a*=.5;}return v;}',
    'vec3 pal(float h){h=fract(h)*8.;if(h<1.)return CARM;if(h<2.)return COBA;if(h<3.)return VIOL;if(h<4.)return WHIT;',
    'if(h<5.)return OCRE;if(h<6.)return TERR;if(h<7.)return SIEN;return GOLD;}'
  ].join('\n');

  M.makeGL = (canvas) => {
    const o = { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' };
    return canvas.getContext('webgl', o) || canvas.getContext('experimental-webgl', o);
  };
  M.program = (gl, fs, header) => {
    const mk = (t, s) => {
      const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(sh)); return null; }
      return sh;
    };
    const vs = mk(gl.VERTEX_SHADER, M.QUAD_VS), f = mk(gl.FRAGMENT_SHADER, (header || '') + fs);
    if (!vs || !f) return null;
    const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, f); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(p)); return null; }
    gl.useProgram(p);
    const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(p, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    return p;
  };
  M.uni = (gl, p, names) => { const u = {}; names.forEach((n) => { u[n] = gl.getUniformLocation(p, n); }); return u; };
  M.texture = (gl, unit, w, h, fmt, data) => {
    const t = gl.createTexture(); gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, fmt, w, h, 0, fmt, gl.UNSIGNED_BYTE, data);
    return t;
  };

  // Classe base dos laboratórios
  M.Base = class {
    constructor(canvas, opt) {
      this.canvas = canvas; this.opt = opt || {}; this.hooks = this.opt.hooks || {};
      this.preview = !!this.opt.preview; this.w = 1; this.h = 1; this.dpr = 1; this.t = 0;
      this.mx = 0.5; this.my = 0.5; this.down = false; this.has = false;
    }
    snd(fn) { if (!this.preview && M.audio && M.audio[fn]) M.audio[fn].apply(M.audio, Array.prototype.slice.call(arguments, 1)); }
    set(k, v) { this.params[k] = v; }
    act() {}
    reset() {}
    randomize() {}
    pointer() {}
    controls() { return []; }
    snapshot() { return this.canvas.toDataURL('image/png'); }
  };
})(window.M);
