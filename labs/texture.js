/* 01 — TEXTURE LAB & ARQUIVO URBANO (WebGL): lanterna chiaroscuro, relevo, erosão de camadas */
(function (M) {
  const HEAD = '#extension GL_OES_standard_derivatives : enable\n';
  const FS = [
    'precision highp float;varying vec2 vUv;',
    'uniform vec2 u_res,u_m;uniform float u_t,u_seed,u_relief,u_scale,u_fall,u_press;uniform int u_mat;uniform sampler2D u_mask;',
    M.GLSL_COMMON,
    'float g_em=0.;float g_gl=0.;',
    // MÁRMORE
    'vec4 marble(vec2 p,int L){float s=u_seed+float(L)*17.;vec2 q=p*1.3+s;float f=fbm(q);float g=fbm(q*2.+f*2.);',
    ' float v=abs(sin((q.x*.9+q.y*.5)*3.+g*8.));float vein=pow(1.-v,10.);',
    ' float vein2=pow(1.-abs(sin((q.y*1.1-q.x*.4)*4.+f*10.)),16.)*.7;',
    ' vec3 base=(L==0)?mix(vec3(.02,.02,.03),vec3(.15,.14,.17),f):mix(vec3(.03,.04,.14),vec3(.07,.10,.42),f);',
    ' vec3 vc=(L==0)?mix(CARM,GOLD,smoothstep(.3,.7,g)):mix(WHIT,VIOL,g);',
    ' vec3 c=base+vc*(vein+vein2);g_gl=.85;g_em=(vein+vein2)*.3;return vec4(c,f*.35-vein*.12);}',
    // CONCRETO
    'vec4 concrete(vec2 p,int L){float s=u_seed+float(L)*9.;vec2 q=p*2.+s;float f=fbm(q*1.5);',
    ' float pits=smoothstep(.60,.68,fbm(q*5.+3.));float cr=fbm(q*1.1+f*.6);',
    ' float crack=1.-smoothstep(0.,.03,abs(cr-.5));crack*=smoothstep(.15,.55,fbm(q*.7+9.));',
    ' vec3 base;if(L==0){base=mix(vec3(.13,.12,.12),vec3(.32,.30,.28),f);}',
    ' else{vec2 b=vec2(q.x*1.2+floor(q.y*2.4)*.5,q.y*2.4);vec2 fr=fract(b);float mortar=min(step(fr.x,.04)+step(fr.y,.07),1.);',
    '  float id=hash(floor(b)+s);base=mix(mix(TERR,SIEN,id),vec3(.2,.18,.16),mortar)*(.45+f*.6);}',
    ' base*=1.-pits*.6;g_gl=.15;g_em=crack*((L==0)?1.1:.6);',
    ' vec3 c=mix(base,mix(OCRE,CARM,fbm(q*3.)),crack*.9);return vec4(c,f*.7-pits*.5-crack*.5);}',
    // ASFALTO MOLHADO
    'vec4 asphalt(vec2 p,int L){float s=u_seed+float(L)*5.;vec2 q=p*3.+s;float grain=hash(floor(q*45.));float g2=noise(q*90.);',
    ' float f=fbm(q*.8);float pud=smoothstep(.48,.62,fbm(q*.45+4.));',
    ' vec3 base=vec3(.045,.045,.05)+vec3(.07)*grain*g2*(1.-pud*.8);',
    ' if(L==1){float band=1.-smoothstep(.10,.13,abs(fract(q.y*.18)-.5));float worn=smoothstep(.35,.7,fbm(q*2.+1.));',
    '  base=mix(base,mix(OCRE,WHIT,step(.5,fract(q.x*.12)))*.7,band*worn);}',
    ' vec3 iri=.5+.5*cos(6.2832*(f*3.+u_t*.02+fbm(q*2.)+vec3(0.,.33,.67)));',
    ' base=mix(base,iri*.4,pud*.75);g_gl=mix(.3,1.,pud);g_em=pud*.12;return vec4(base,grain*.07*(1.-pud)-pud*.2+f*.1);}',
    // METAL COM STICKERS
    'vec4 stickers(vec2 p,int L){float s=u_seed+float(L)*31.;vec2 q=p*1.6+s;float streak=noise(vec2(q.x*2.,q.y*90.));float rust=fbm(q*3.+7.);',
    ' vec3 c=mix(vec3(.16,.17,.19),vec3(.34,.35,.38),streak);c=mix(c,mix(SIEN,TERR,rust)*.8,smoothstep(.5,.75,rust));',
    ' float h=streak*.05;float gl=.9;',
    ' for(int i=0;i<3;i++){vec2 qq=q*(1.+float(i)*.55)+float(i)*13.7;vec2 cell=floor(qq);vec2 f=fract(qq)-.5;',
    '  float r=hash(cell+s);float r2=hash(cell*1.7+s+3.);',
    '  if(r>.35){vec2 sz=vec2(.18+.22*r2,.14+.25*hash(cell+8.));vec2 off=(vec2(hash(cell+1.),hash(cell+2.))-.5)*.25;',
    '   vec2 d=abs(f-off)-sz;float rr=length(max(d,0.))+min(max(d.x,d.y),0.);float en=(fbm(qq*9.+cell)-.5)*.04;',
    '   float m=1.-smoothstep(-.005,.01,rr+en);float wear=smoothstep(.35,.7,fbm(qq*7.+cell*3.));m*=1.-wear*.6;',
    '   vec3 sc=pal(hash(cell+4.));float gfx=step(.5,fract((f.x+f.y)*(4.+r2*6.)));sc=mix(sc,WHIT*.9,gfx*step(.6,r2)*.85);',
    '   sc*=.8+.2*fbm(qq*20.);c=mix(c,sc,m);h+=m*.08*(float(i)+1.);gl=mix(gl,.55,m);}}',
    ' g_gl=gl;g_em=0.;return vec4(c,h);}',
    // LAMBE-LAMBE & GRAFFITI
    'vec4 wheat(vec2 p,int L){float s=u_seed+float(L)*23.;vec2 q=p*1.4+s;vec3 c=vec3(.10,.095,.09)+fbm(q*6.)*.1;float h=fbm(q*8.)*.1;',
    ' for(int i=0;i<3;i++){vec2 qq=q*(.8+float(i)*.5)+float(i)*7.3;vec2 cell=floor(qq);vec2 f=fract(qq);float r=hash(cell+s*1.3);',
    '  if(r>.25){vec2 jt=(vec2(hash(cell+1.3),hash(cell+4.1))-.5)*.2;vec2 d=abs(f-.5-jt)-vec2(.42,.46)*(.8+.2*hash(cell+9.));',
    '   float tear=(fbm(qq*7.+cell*5.)-.5)*.12;float m=1.-smoothstep(0.,.012,max(d.x,d.y)+tear);',
    '   if(m>.001){vec3 pc=pal(hash(cell+2.2));vec3 pp=mix(WHIT*.85,pc,step(.4,hash(cell+5.)));',
    '    float bars=step(.5,fract((f.y+jt.y)*(7.+hash(cell)*9.)))*step(.2,f.x)*step(f.x,.8);',
    '    float big=smoothstep(.01,.0,abs(length(f-.5-jt)-.22))*step(.5,hash(cell+7.));',
    '    float dots=smoothstep(.3,.2,length(fract(f*30.)-.5))*step(.7,hash(cell+8.))*.5;',
    '    vec3 ink=mix(vec3(.04,.03,.05),pc.bgr,.15);pp=mix(pp,ink,max(bars*.55,max(big,dots)));pp*=.7+.3*fbm(qq*20.);',
    '    c=mix(c,pp,m);h=mix(h,.12*float(i+1)+fbm(qq*5.+cell)*.15+.03*bars,m);}}}',
    ' vec2 tq=q*.7;vec2 cl=floor(tq);vec2 f=fract(tq);float cr=hash(cl+s);',
    ' float cv=.5+.25*sin(f.x*6.2832*(1.+floor(cr*3.))+cr*6.);float dist=abs(f.y-cv);',
    ' float stroke=smoothstep(.05,.015,dist)*step(.4,cr);float over=smoothstep(.13,.0,dist)*step(.4,cr)*.25;',
    ' float dx=abs(fract(f.x*14.)-.5);float dl=hash(vec2(floor(f.x*14.),cl.x*3.+s))*.35;',
    ' float drip=step(.4,cr)*step(dx,.04)*step(cv-dl,f.y)*step(f.y,cv)*step(.5,hash(vec2(floor(f.x*14.),cl.y*7.)));',
    ' vec3 tc=pal(hash(cl+11.));c=mix(c,tc,max(max(stroke,drip)*.92,over));h+=max(stroke,drip)*.05;',
    ' g_gl=.25+max(stroke,drip)*.5;g_em=max(stroke,drip)*.05;return vec4(c,h);}',
    'vec4 surf(int m,int L,vec2 p){if(m==0)return marble(p,L);if(m==1)return concrete(p,L);if(m==2)return asphalt(p,L);if(m==3)return stickers(p,L);return wheat(p,L);}',
    'void main(){',
    ' vec2 asp=vec2(u_res.x/u_res.y,1.);vec2 uv=vUv;vec2 p=(uv-.5)*asp*u_scale;vec2 lp=(u_m-.5)*asp*u_scale;',
    ' float m=texture2D(u_mask,uv).r;float nz=fbm(p*3.+u_seed)-.5;',
    ' float rv=smoothstep(.40,.60,m+nz*.6*step(.001,m));',
    ' vec4 s;float em;float gl;',
    ' if(rv<.002){s=surf(u_mat,0,p);em=g_em;gl=g_gl;s.a+=.30;}',
    ' else if(rv>.998){s=surf(u_mat,1,p);em=g_em;gl=g_gl;}',
    ' else{vec4 a=surf(u_mat,0,p);float e0=g_em;float g0=g_gl;vec4 b=surf(u_mat,1,p);float e1=g_em;float g1=g_gl;',
    '  s=mix(vec4(a.rgb,a.a+.30),b,rv);em=mix(e0,e1,rv);gl=mix(g0,g1,rv);',
    '  float rim=rv*(1.-rv)*4.;s.rgb*=1.-rim*.5;em+=rim*.9;s.rgb=mix(s.rgb,mix(CARM,GOLD,nz+.5),rim*.35);}',
    ' float h=s.a*u_relief;vec3 n=vec3(0.,0.,1.);',
    ' #ifdef GL_OES_standard_derivatives',
    ' vec2 g=vec2(dFdx(h),dFdy(h))*u_res.y/u_scale;n=normalize(vec3(-g*.22,1.));',
    ' #endif',
    ' vec3 Lv=vec3(lp-p,.5);float d=length(Lv);Lv/=d;float att=1./(1.+d*d*u_fall);att*=1.+u_press*.7;',
    ' vec3 lc=vec3(1.,.93,.82);float diff=max(dot(n,Lv),0.);',
    ' vec3 Hh=normalize(Lv+vec3(0.,0.,1.));float spec=pow(max(dot(n,Hh),0.),8.+gl*140.)*(.12+gl*1.5);',
    ' vec3 L2=normalize(vec3(.6,.7,.5));float fill=max(dot(n,L2),0.)*.05;',
    ' vec3 col=s.rgb*(.03+diff*att*2.1*lc+fill*vec3(.35,.45,1.))+lc*spec*att+s.rgb*em*(.5+att)*1.4;',
    ' col=1.-exp(-col*1.7);float vig=smoothstep(1.5,.25,length((uv-.5)*asp));col*=.45+.55*vig;',
    ' col+=(hash(gl_FragCoord.xy+u_t)-.5)*.025;gl_FragColor=vec4(clamp(col,0.,1.),1.);}'
  ].join('\n');

  const MW = 256, MH = 144;
  M.labs.texture = class extends M.Base {
    constructor(canvas, opt) {
      super(canvas, opt);
      this.id = 'texture';
      this.params = { mat: 0, tool: 'sculpt', brush: 90, relief: 1.4, light: 1, scale: 1.8 };
      this.seed = 4.2; this.idle = 99; this.sx = 0.5; this.sy = 0.5; this.press = 0; this.dirty = true;
      this.mask = new Float32Array(MW * MH); this.mask8 = new Uint8Array(MW * MH);
      this.gl = M.makeGL(canvas); this.ok = false;
      if (!this.gl) return;
      const gl = this.gl; gl.getExtension('OES_standard_derivatives');
      this.prog = M.program(gl, FS, HEAD);
      if (!this.prog) return;
      this.u = M.uni(gl, this.prog, ['u_res', 'u_m', 'u_t', 'u_seed', 'u_relief', 'u_scale', 'u_fall', 'u_press', 'u_mat', 'u_mask']);
      this.tex = M.texture(gl, 0, MW, MH, gl.LUMINANCE, this.mask8);
      this.ok = true; this.q = this.preview ? 0.7 : 0.62;
    }
    controls() {
      return [
        { type: 'seg', key: 'mat', label: 'Superfície', opts: [[0, 'Mármore Abissal'], [1, 'Concreto & Fachada'], [2, 'Asfalto Molhado'], [3, 'Metal & Stickers'], [4, 'Lambe-Lambe']] },
        { type: 'seg', key: 'tool', label: 'Gesto', opts: [['sculpt', 'Esculpir'], ['peel', 'Descascar'], ['heal', 'Restaurar']] },
        { type: 'slider', key: 'brush', label: 'Raio do gesto', min: 30, max: 220, step: 2 },
        { type: 'slider', key: 'relief', label: 'Relevo', min: 0.4, max: 3.2, step: 0.05 },
        { type: 'slider', key: 'light', label: 'Alcance da lanterna', min: 0.35, max: 2.2, step: 0.05 },
        { type: 'slider', key: 'scale', label: 'Escala da matéria', min: 0.9, max: 3.4, step: 0.05 },
        { type: 'button', act: 'restore', label: 'Restaurar camada' }
      ];
    }
    act(a) { if (a === 'restore') this.reset(); }
    reset() { this.mask.fill(0); this.dirty = true; }
    randomize() { this.seed = Math.random() * 90 + 1; this.params.mat = Math.floor(Math.random() * 5); this.reset(); return true; }
    resize(w, h, dpr) {
      this.w = w; this.h = h; this.dpr = dpr;
      const s = Math.min(dpr, 2) * this.q;
      this.canvas.width = Math.max(2, Math.floor(w * s)); this.canvas.height = Math.max(2, Math.floor(h * s));
      if (this.gl) this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    pointer(type, x, y) {
      this.mx = x; this.my = y; this.idle = 0; this.has = true;
      if (type === 'down') { this.down = true; this.lx = x; this.ly = y; this.paint(x, y); }
      else if (type === 'move') {
        if (this.down) {
          const dx = x - this.lx, dy = y - this.ly, n = Math.max(1, Math.ceil(Math.hypot(dx * this.w, dy * this.h) / (this.params.brush * 0.3)));
          for (let i = 1; i <= n; i++) this.paint(this.lx + dx * i / n, this.ly + dy * i / n);
        }
        this.lx = x; this.ly = y;
      } else if (type === 'dbl') {
        this.down = false;
        const oldTool = this.params.tool, oldBrush = this.params.brush;
        this.params.tool = 'peel';
        this.params.brush = Math.min(240, oldBrush * 1.45);
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * 6.2832 + Math.random() * 0.4, r = (0.02 + Math.random() * 0.05);
          this.paint(M.clamp(x + Math.cos(a) * r, 0, 1), M.clamp(y + Math.sin(a) * r, 0, 1));
        }
        this.params.tool = oldTool;
        this.params.brush = oldBrush;
        this.snd('boom');
      } else if (type === 'up' || type === 'leave') { this.down = false; if (type === 'leave') this.has = false; }
    }
    paint(x, y) {
      const tool = this.params.tool, k = tool === 'peel' ? 1.7 : 1;
      const rx = this.params.brush * k / this.w * MW, ry = this.params.brush * k / this.h * MH;
      const cx = x * MW, cy = (1 - y) * MH, x0 = Math.max(0, Math.floor(cx - rx)), x1 = Math.min(MW - 1, Math.ceil(cx + rx));
      const y0 = Math.max(0, Math.floor(cy - ry)), y1 = Math.min(MH - 1, Math.ceil(cy + ry));
      for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
        const dx = (i - cx) / rx, dy = (j - cy) / ry, q = dx * dx + dy * dy; if (q > 1) continue;
        const f = Math.pow(1 - q, 1.6), idx = j * MW + i; let v = this.mask[idx];
        if (tool === 'sculpt') v += f * 0.2;
        else if (tool === 'peel') v += f * (0.18 + 0.5 * M.hash1(i * 0.7, j * 1.3)) * (M.vnoise(i * 0.35, j * 0.35) > 0.38 ? 1 : 0.15);
        else v -= f * 0.35;
        this.mask[idx] = v < 0 ? 0 : v > 1 ? 1 : v;
      }
      this.dirty = true;
    }
    frame(dt, t) {
      this.t = t; if (!this.ok) return;
      this.idle += dt; const gl = this.gl;
      let tx = this.mx, ty = this.my;
      if (this.idle > 3.5 || !this.has) { tx = 0.5 + 0.34 * Math.sin(t * 0.45); ty = 0.5 + 0.3 * Math.sin(t * 0.33 + 1.3); }
      this.sx += (tx - this.sx) * 0.12; this.sy += (ty - this.sy) * 0.12;
      this.press += ((this.down ? 1 : 0) - this.press) * 0.15;
      gl.useProgram(this.prog);
      if (this.dirty) {
        for (let i = 0; i < this.mask.length; i++) this.mask8[i] = this.mask[i] * 255;
        gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.tex);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, MW, MH, gl.LUMINANCE, gl.UNSIGNED_BYTE, this.mask8); this.dirty = false;
      }
      const u = this.u, p = this.params;
      gl.uniform2f(u.u_res, this.canvas.width, this.canvas.height); gl.uniform2f(u.u_m, this.sx, 1 - this.sy);
      gl.uniform1f(u.u_t, t); gl.uniform1f(u.u_seed, this.seed); gl.uniform1f(u.u_relief, p.relief); gl.uniform1f(u.u_scale, p.scale);
      gl.uniform1f(u.u_fall, 3.2 / (p.light * p.light)); gl.uniform1f(u.u_press, this.press); gl.uniform1i(u.u_mat, p.mat); gl.uniform1i(u.u_mask, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }
    snapshot() {
      if (!this.ok) return this.canvas.toDataURL('image/png');
      const w0 = this.canvas.width, h0 = this.canvas.height, s = Math.min(this.dpr, 2) * 1.0;
      this.canvas.width = Math.floor(this.w * s * 1.3); this.canvas.height = Math.floor(this.h * s * 1.3);
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height); this.frame(0, this.t);
      const url = this.canvas.toDataURL('image/png');
      this.canvas.width = w0; this.canvas.height = h0; this.gl.viewport(0, 0, w0, h0); this.frame(0, this.t);
      return url;
    }
  };
})(window.M);
