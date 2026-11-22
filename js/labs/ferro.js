/* 02 — PIGMENT & FERROFLUID LAB: fluidos incompressíveis (Stam) em grade + campo magnético + shading especular WebGL */
(function (M) {
  const TYPES = [
    { n: 'Óleo denso', rel: 0.85, gls: 0.75, emi: 0, amt: 1, jit: 0, imp: 0.4 },
    { n: 'Aquarela', rel: 0.1, gls: 0.12, emi: 0, amt: 0.55, jit: 0.5, imp: 0.9 },
    { n: 'Guache', rel: 0.4, gls: 0.02, emi: 0, amt: 1, jit: 0, imp: 0.5 },
    { n: 'Acrílica', rel: 0.6, gls: 0.5, emi: 0, amt: 1, jit: 0.1, imp: 0.6 },
    { n: 'Nanquim', rel: 0.3, gls: 0.35, emi: 0, amt: 0.9, jit: 1.5, imp: 1, ink: true },
    { n: 'Metal líquido', rel: 0.95, gls: 1, emi: 0, amt: 1, jit: 0, imp: 0.3, metal: true },
    { n: 'Fluorescente', rel: 0.2, gls: 0.25, emi: 1, amt: 0.8, jit: 0.4, imp: 0.7 }
  ];
  const FS = [
    'precision highp float;varying vec2 vUv;uniform sampler2D u_a,u_b;uniform vec2 u_res,u_tx,u_mp,u_lp;uniform float u_ms,u_t,u_press;',
    M.GLSL_COMMON,
    'float hgt(vec2 uv){vec4 A=texture2D(u_a,uv);vec4 B=texture2D(u_b,uv);float d=A.a*1.25;float fe=B.a*1.4;',
    ' float ferro=fe+.5*d*B.g;float h=d*(.22+B.r*.55)+fe*.55;',
    ' vec2 asp=vec2(u_res.x/u_res.y,1.);vec2 dm=(uv-u_mp)*asp;float r=length(dm)+1e-4;float ang=atan(dm.y,dm.x);',
    ' float fld=u_ms*exp(-r*r*14.);float n=noise(vec2(ang*3.,r*20.));',
    ' float spikes=pow(max(0.,sin(ang*(16.+floor(n*6.))+r*70.+n*3.)),5.);',
    ' float rings=pow(.5+.5*sin(r*90.-u_t*2.+n*4.),4.)*.35;float amt=smoothstep(.15,.8,ferro);',
    ' h+=amt*fld*(spikes*max(0.,.95-r*2.4)+rings*.5)*(.65+.55*noise(uv*40.));h+=amt*u_ms*exp(-r*r*40.)*.5;return h;}',
    'void main(){vec2 uv=vec2(vUv.x,1.-vUv.y);vec2 asp=vec2(u_res.x/u_res.y,1.);vec4 A=texture2D(u_a,uv);vec4 B=texture2D(u_b,uv);',
    ' float d=A.a*1.25;float fe=B.a*1.4;',
    ' vec3 bg=mix(vec3(.012,.012,.02),vec3(.05,.035,.065),uv.y*.6+noise(uv*3.)*.3);',
    ' float cov=smoothstep(0.,.35,d);vec3 base=mix(bg,A.rgb*(.55+.45*min(d,1.)),cov);',
    ' float fcov=smoothstep(.05,.5,fe);base=mix(base,vec3(.008,.008,.012),fcov);float gl=mix(B.g,.95,fcov);',
    ' vec2 e=u_tx*1.2;float hL=hgt(uv-vec2(e.x,0.));float hR=hgt(uv+vec2(e.x,0.));float hD=hgt(uv-vec2(0.,e.y));float hU=hgt(uv+vec2(0.,e.y));',
    ' float gx=(hR-hL)*.05/(2.*e.x*asp.x);float gy=(hU-hD)*.05/(2.*e.y);vec3 n=normalize(vec3(-gx,-gy,1.));',
    ' vec2 P=uv*asp;vec2 Lp=u_lp*asp;float dist=length(Lp-P);float att=1./(1.+dist*dist*5.)*(1.+u_press*.5);',
    ' vec3 L1=normalize(vec3(Lp-P,.35));vec3 L2=normalize(vec3(-.5,-.6,.65));vec3 V=vec3(0.,0.,1.);',
    ' float sh=mix(10.,220.,gl);float diff=max(dot(n,L1),0.)*att*1.1+max(dot(n,L2),0.)*.45;',
    ' float spec=(pow(max(dot(n,normalize(L1+V)),0.),sh)*att*1.2+pow(max(dot(n,normalize(L2+V)),0.),sh)*.6)*(.08+gl*1.5);',
    ' vec3 col=base*(.18+diff)+vec3(1.,.95,.88)*spec*max(cov,fcov)+vec3(.6,.5,.4)*att*.05;',
    ' vec3 env=.5+.5*cos(6.2832*(n.x*.9+n.y*.6+vec3(0.,.33,.67)+u_t*.02));float fres=pow(1.-max(n.z,0.),1.6);',
    ' col+=env*fres*(fcov*.9+cov*B.g*.35)*(.5+att);col+=A.rgb*B.b*d*1.3*cov;',
    ' col=1.-exp(-col*1.5);float vig=smoothstep(1.5,.3,length((uv-.5)*asp));col*=.5+.5*vig;col+=(hash(gl_FragCoord.xy+u_t)-.5)*.02;',
    ' gl_FragColor=vec4(clamp(col,0.,1.),1.);}'
  ].join('\n');

  const FIELDS = ['u', 'v', 'u0', 'v0', 'p', 'dv', 'd', 'cr', 'cg', 'cb', 'rel', 'gls', 'emi', 'fe', 'tmp', 'uf', 'vf', 'up', 'vp', 'du', 'dvv'];
  const ATTR = ['d', 'cr', 'cg', 'cb', 'rel', 'gls', 'emi'];

  M.labs.ferro = class extends M.Base {
    constructor(canvas, opt) {
      super(canvas, opt);
      this.id = 'ferro';
      this.params = { tool: 'pig', ptype: 0, color: 0, size: 38, visc: 1.2, magnet: true, mag: 1, spread: 1, evap: 0.02 };
      this.GW = 0; this.GH = 0; this.pv = { x: 0, y: 0 }; this.hover = false; this.lt = 0;
      this.sx = 0.5; this.sy = 0.5; this.press = 0; this.ms = 0;
      this.gl = M.makeGL(canvas); this.ok = false; if (!this.gl) return;
      const gl = this.gl; this.prog = M.program(gl, FS); if (!this.prog) return;
      this.u = M.uni(gl, this.prog, ['u_a', 'u_b', 'u_res', 'u_tx', 'u_mp', 'u_lp', 'u_ms', 'u_t', 'u_press']);
      this.ok = true;
    }
    controls() {
      return [
        { type: 'seg', key: 'tool', label: 'Ferramenta', opts: [['pig', 'Pigmento'], ['fer', 'Ferrofluido'], ['stir', 'Espátula']] },
        { type: 'seg', key: 'ptype', label: 'Material do pigmento', opts: TYPES.map((t, i) => [i, t.n]) },
        { type: 'swatch', key: 'color', label: 'Cor do pigmento' },
        { type: 'slider', key: 'size', label: 'Raio do gesto', min: 14, max: 110, step: 1 },
        { type: 'toggle', key: 'magnet', label: 'Campo magnético (ímã no cursor)' },
        { type: 'slider', key: 'mag', label: 'Intensidade do campo', min: 0.2, max: 2.2, step: 0.05 },
        { type: 'slider', key: 'visc', label: 'Viscosidade', min: 0.1, max: 4, step: 0.05 },
        { type: 'slider', key: 'spread', label: 'Difusão / expansão', min: 0, max: 2.5, step: 0.05 },
        { type: 'button', act: 'pour', label: 'Derramar composição' }
      ];
    }
    act(a) { if (a === 'pour') this.pour(); }
    reset() { this.clearAll(); return false; }
    randomize() { this.pour(); }
    resize(w, h, dpr) {
      this.w = w; this.h = h; this.dpr = dpr;
      const s = Math.min(dpr, 1.5) * (this.preview ? 0.8 : 1);
      this.canvas.width = Math.max(2, Math.floor(w * s)); this.canvas.height = Math.max(2, Math.floor(h * s));
      if (!this.ok) return;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
      const GW = this.preview ? 90 : (w < 700 ? 120 : 176), GH = Math.max(40, Math.round(GW * h / w));
      if (GW !== this.GW || GH !== this.GH) this.alloc(GW, GH);
    }
    alloc(GW, GH) {
      this.GW = GW; this.GH = GH; this.f = {};
      FIELDS.forEach((n) => { this.f[n] = new Float32Array(GW * GH); });
      this.A = new Uint8Array(GW * GH * 4); this.B = new Uint8Array(GW * GH * 4);
      const gl = this.gl; this.ta = M.texture(gl, 0, GW, GH, gl.RGBA, this.A); this.tb = M.texture(gl, 1, GW, GH, gl.RGBA, this.B);
      this.pour();
    }
    clearAll() { if (!this.f) return; FIELDS.forEach((n) => this.f[n].fill(0)); }
    kindFor(mode, ti, ci) {
      const T = TYPES[ti], c = M.rgb01(M.SW[ci][1]); let rgb = c;
      if (T.ink) rgb = [c[0] * 0.18, c[1] * 0.18, c[2] * 0.18 + 0.03];
      else if (T.metal) rgb = [c[0] * 0.8 + 0.18, c[1] * 0.8 + 0.18, c[2] * 0.8 + 0.18];
      return { mode, T, rgb, amt: T.amt, vk: 1 };
    }
    pour() {
      if (!this.f) return; this.clearAll(); const W = this.GW, H = this.GH;
      const spots = [[0.22, 0.32, 0, 0], [0.74, 0.28, 1, 1], [0.5, 0.7, 3, 2], [0.28, 0.72, 5, 7], [0.72, 0.68, 2, 3], [0.5, 0.3, 6, 4], [0.86, 0.5, 4, 5]];
      spots.forEach((s, i) => {
        const k = this.kindFor('pig', s[2], s[3]), a = i * 2.1;
        this.splat(s[0] * W, s[1] * H, H * 0.2, Math.cos(a) * 30, Math.sin(a) * 30, k);
        this.splat(s[0] * W, s[1] * H, H * 0.12, Math.cos(a) * 30, Math.sin(a) * 30, k);
      });
      const fk = { mode: 'fer', amt: 1, vk: 0, T: TYPES[0], rgb: [0, 0, 0] };
      for (let i = 0; i < 3; i++) this.splat(W * (0.4 + i * 0.1), H * (0.52 + (i % 2) * 0.06), H * 0.16, 0, 0, fk);
    }
    splat(cx, cy, r, vx, vy, kind) {
      const W = this.GW, H = this.GH, f = this.f, R = Math.ceil(r * 1.8);
      const x0 = Math.max(1, Math.floor(cx - R)), x1 = Math.min(W - 2, Math.ceil(cx + R)), y0 = Math.max(1, Math.floor(cy - R)), y1 = Math.min(H - 2, Math.ceil(cy + R));
      const T = kind.T;
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const dx = i - cx, dy = j - cy, q = (dx * dx + dy * dy) / (r * r); if (q > 3.2) continue;
        const w = Math.exp(-q * 1.1), k = i + j * W;
        f.u[k] += vx * w * kind.vk; f.v[k] += vy * w * kind.vk;
        if (kind.mode === 'pig') {
          if (T.jit) { f.u[k] += (Math.random() - 0.5) * T.jit * 40 * w; f.v[k] += (Math.random() - 0.5) * T.jit * 40 * w; }
          const a = kind.amt * w, dOld = f.d[k], t = a / (dOld + a + 1e-4);
          f.cr[k] += (kind.rgb[0] - f.cr[k]) * t; f.cg[k] += (kind.rgb[1] - f.cg[k]) * t; f.cb[k] += (kind.rgb[2] - f.cb[k]) * t;
          f.rel[k] += (T.rel - f.rel[k]) * t; f.gls[k] += (T.gls - f.gls[k]) * t; f.emi[k] += (T.emi - f.emi[k]) * t;
          f.d[k] = Math.min(1.25, dOld + a);
        } else if (kind.mode === 'fer') f.fe[k] = Math.min(1.4, f.fe[k] + kind.amt * w);
      }
    }
    pointer(type, x, y) {
      const nowT = performance.now(), dtp = Math.max(8, nowT - this.lt) / 1000;
      if (this.GW) {
        const dxc = (x - this.mx) * this.GW, dyc = (y - this.my) * this.GH;
        this.pv.x = M.clamp(dxc / dtp, -160, 160); this.pv.y = M.clamp(dyc / dtp, -160, 160);
      }
      this.lt = nowT; this.mx = x; this.my = y; this.has = true;
      if (type === 'down') { this.down = true; this.hover = true; }
      else if (type === 'up') { this.down = false; }
      else if (type === 'leave') { this.down = false; this.hover = false; this.has = false; }
      else if (type === 'move') this.hover = true;
    }
    emit() {
      const W = this.GW, H = this.GH, p = this.params, cx = this.mx * W, cy = this.my * H, r = p.size / this.w * W;
      const T = TYPES[p.ptype], sp = Math.hypot(this.pv.x, this.pv.y);
      if (p.tool === 'pig') { const k = this.kindFor('pig', p.ptype, p.color); k.amt = 0.2 * T.amt; k.vk = T.imp * 0.045; this.splat(cx, cy, r, this.pv.x, this.pv.y, k); }
      else if (p.tool === 'fer') { const k = { mode: 'fer', amt: 0.25, vk: 0.03, T: TYPES[0], rgb: [0, 0, 0] }; this.splat(cx, cy, r, this.pv.x, this.pv.y, k); }
      else { const k = { mode: 'none', amt: 0, vk: 0.09, T: TYPES[0], rgb: [0, 0, 0] }; this.splat(cx, cy, r * 1.2, this.pv.x, this.pv.y, k); }
      if (sp > 4) this.snd('move', this.mx, this.my, sp * 0.05);
      this.pv.x *= 0.82; this.pv.y *= 0.82;
    }
    adv(dst, src, uu, vv, dt) {
      const W = this.GW, H = this.GH, mx = W - 1.001, my = H - 1.001;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const k = i + j * W; let x = i - dt * uu[k], y = j - dt * vv[k];
        x = x < 0 ? 0 : x > mx ? mx : x; y = y < 0 ? 0 : y > my ? my : y;
        const i0 = x | 0, j0 = y | 0, s = x - i0, t = y - j0, k0 = i0 + j0 * W;
        dst[k] = (1 - t) * ((1 - s) * src[k0] + s * src[k0 + 1]) + t * ((1 - s) * src[k0 + W] + s * src[k0 + W + 1]);
      }
    }
    step(dt) {
      const W = this.GW, H = this.GH, N = W * H, f = this.f, p = this.params;
      const damp = Math.exp(-p.visc * dt * 1.5);
      for (let k = 0; k < N; k++) { f.u[k] *= damp; f.v[k] *= damp; }
      // ímã
      const mOn = p.magnet && (this.hover || this.down) && this.has;
      this.ms += ((mOn ? p.mag : 0) - this.ms) * 0.12;
      if (this.ms > 0.02) {
        const cx = this.mx * W, cy = this.my * H, sig2 = Math.pow(0.2 * H, 2), maxD2 = sig2 * 7;
        for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
          const k = i + j * W, dx = cx - i, dy = cy - j, d2 = dx * dx + dy * dy;
          if (d2 > maxD2) { f.du[k] = 0; f.dvv[k] = 0; continue; }
          const d = Math.sqrt(d2) + 1e-3, g = Math.exp(-d2 / sig2), sm = Math.min(1, Math.max(0, (d - 1.5) / 3.5)), s = this.ms * 55 * g * sm;
          f.du[k] = dx / d * s; f.dvv[k] = dy / d * s;
        }
        for (let k = 0; k < N; k++) { f.uf[k] = f.u[k] + f.du[k]; f.vf[k] = f.v[k] + f.dvv[k]; f.up[k] = f.u[k] + f.du[k] * 0.22; f.vp[k] = f.v[k] + f.dvv[k] * 0.22; }
      } else { f.uf.set(f.u); f.vf.set(f.v); f.up.set(f.u); f.vp.set(f.v); }
      if (this.down || (this.hover && p.tool === 'stir' && Math.hypot(this.pv.x, this.pv.y) > 8 && this.down)) this.emit();
      // projeção
      const u = f.u, v = f.v, pr = f.p, dv = f.dv;
      for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = i + j * W; dv[k] = -0.5 * (u[k + 1] - u[k - 1] + v[k + W] - v[k - W]); pr[k] = 0; }
      for (let it = 0; it < 14; it++) for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = i + j * W; pr[k] = (dv[k] + pr[k - 1] + pr[k + 1] + pr[k - W] + pr[k + W]) * 0.25; }
      for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = i + j * W; u[k] -= 0.5 * (pr[k + 1] - pr[k - 1]); v[k] -= 0.5 * (pr[k + W] - pr[k - W]); }
      for (let i = 0; i < W; i++) { v[i] = 0; v[i + (H - 1) * W] = 0; } for (let j = 0; j < H; j++) { u[j * W] = 0; u[W - 1 + j * W] = 0; }
      // advecção
      f.u0.set(u); f.v0.set(v); this.adv(u, f.u0, f.u0, f.v0, dt); this.adv(v, f.v0, f.u0, f.v0, dt);
      f.u.set(u); f.v.set(v);
      for (let a = 0; a < ATTR.length; a++) { const n = ATTR[a]; this.adv(f.tmp, f[n], f.up, f.vp, dt); f[n].set(f.tmp); }
      this.adv(f.tmp, f.fe, f.uf, f.vf, dt); f.fe.set(f.tmp);
      // difusão (materiais pouco densos se expandem) e evaporação
      const sp = p.spread * dt * 6;
      if (sp > 0.001) {
        for (let a = 0; a < ATTR.length; a++) {
          const src = f[ATTR[a]], tmp = f.tmp;
          for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) {
            const k = i + j * W, kk = Math.min(0.24, sp * (1 - f.rel[k]) * (1 - f.rel[k]) * 0.45);
            tmp[k] = src[k] + kk * (src[k - 1] + src[k + 1] + src[k - W] + src[k + W] - 4 * src[k]);
          }
          for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const k = i + j * W; src[k] = tmp[k]; }
        }
      }
      const ev = p.evap * dt; for (let k = 0; k < N; k++) { if (f.d[k] > 0) f.d[k] = Math.max(0, f.d[k] - ev * (f.d[k] < 0.25 ? 1.5 : 0.1)); }
    }
    upload() {
      const N = this.GW * this.GH, f = this.f, A = this.A, B = this.B;
      for (let k = 0; k < N; k++) {
        const o = k * 4; A[o] = f.cr[k] * 255; A[o + 1] = f.cg[k] * 255; A[o + 2] = f.cb[k] * 255; A[o + 3] = Math.min(255, f.d[k] / 1.25 * 255);
        B[o] = f.rel[k] * 255; B[o + 1] = f.gls[k] * 255; B[o + 2] = f.emi[k] * 255; B[o + 3] = Math.min(255, f.fe[k] / 1.4 * 255);
      }
      const gl = this.gl;
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.ta); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.GW, this.GH, gl.RGBA, gl.UNSIGNED_BYTE, A);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.tb); gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, this.GW, this.GH, gl.RGBA, gl.UNSIGNED_BYTE, B);
    }
    frame(dt, t) {
      this.t = t; if (!this.ok || !this.GW) return;
      this.step(Math.min(dt, 0.033) || 0.016); this.upload();
      this.sx += (this.mx - this.sx) * 0.25; this.sy += (this.my - this.sy) * 0.25; this.press += ((this.down ? 1 : 0) - this.press) * 0.15;
      const gl = this.gl, u = this.u; gl.useProgram(this.prog);
      gl.uniform1i(u.u_a, 0); gl.uniform1i(u.u_b, 1); gl.uniform2f(u.u_res, this.canvas.width, this.canvas.height);
      gl.uniform2f(u.u_tx, 1 / this.GW, 1 / this.GH); gl.uniform2f(u.u_mp, this.mx, this.my); gl.uniform2f(u.u_lp, this.sx, this.sy);
      gl.uniform1f(u.u_ms, this.ms); gl.uniform1f(u.u_t, t); gl.uniform1f(u.u_press, this.press);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
  };
})(window.M);
