/* MATÉRIA // LAB — fundo vivo contínuo (WebGL): nebulosa de pigmento escuro com luz chiaroscuro reativa ao cursor */
(function (M) {
  const FS = [
    'precision highp float;varying vec2 vUv;uniform vec2 u_res;uniform float u_t,u_scroll,u_light;uniform vec2 u_m;',
    M.GLSL_COMMON,
    'vec3 accent(float x){x=fract(x)*4.;vec3 a=x<1.?CARM:(x<2.?VIOL:(x<3.?COBA:OCRE));vec3 b=x<1.?VIOL:(x<2.?COBA:(x<3.?OCRE:CARM));return mix(a,b,smoothstep(0.,1.,fract(x)));}',
    'void main(){',
    ' vec2 asp=vec2(u_res.x/u_res.y,1.);vec2 uv=vUv;vec2 p=(uv-.5)*asp*1.7;float t=u_t*.04;',
    ' vec2 q=vec2(fbm(p+vec2(0.,t+u_scroll*1.5)),fbm(p+vec2(5.2,1.3)-t));',
    ' vec2 r=vec2(fbm(p+2.8*q+vec2(1.7,9.2)+t*1.4),fbm(p+2.8*q+vec2(8.3,2.8)-t));',
    ' float f=fbm(p+2.6*r);vec2 mp=(u_m-.5)*asp*1.7;float d=length(p-mp);float lamp=exp(-d*d*1.6)*u_light;',
    ' float ridge=pow(1.-abs(2.*f-1.),5.);',
    ' vec3 ac=accent(u_scroll*1.3+f*.5);vec3 ac2=accent(u_scroll*1.3+.5+r.x*.4);',
    ' vec3 col=vec3(.012,.012,.02)+vec3(.02,.02,.03)*f;',
    ' float body=smoothstep(.35,.85,f*(.6+q.x*.8));',
    ' col+=ac*body*.38*(.28+lamp*1.8);col+=ac2*ridge*.6*(.22+lamp*2.4);',
    ' col+=vec3(1.,.93,.82)*pow(ridge,3.)*lamp*.55;',
    ' float vig=smoothstep(1.4,.3,length((uv-.5)*asp));col*=.35+.65*vig;',
    ' col+=(hash(gl_FragCoord.xy+u_t)-.5)*.02;gl_FragColor=vec4(col,1.);}'
  ].join('\n');

  const canvas = document.getElementById('bg');
  const bg = { running: true, scroll: 0, mx: 0.5, my: 0.4, tx: 0.5, ty: 0.4, light: 0.4, ok: false };
  M.bg = bg; bg.canvas = canvas;
  const gl = M.makeGL(canvas);
  if (!gl) { document.body.classList.add('no-webgl'); return; }
  const prog = M.program(gl, FS);
  if (!prog) { document.body.classList.add('no-webgl'); return; }
  const u = M.uni(gl, prog, ['u_res', 'u_t', 'u_scroll', 'u_light', 'u_m']);
  bg.ok = true;
  let w = 1, h = 1, hover = false, t0 = performance.now();
  function size() {
    const q = innerWidth < 760 ? 0.38 : 0.5, dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = Math.max(2, Math.floor(innerWidth * q * dpr)); h = Math.max(2, Math.floor(innerHeight * q * dpr));
    canvas.width = w; canvas.height = h; gl.viewport(0, 0, w, h);
  }
  size(); addEventListener('resize', size);
  addEventListener('pointermove', (e) => { bg.tx = e.clientX / innerWidth; bg.ty = 1 - e.clientY / innerHeight; hover = true; });
  addEventListener('scroll', () => {
    const m = document.documentElement.scrollHeight - innerHeight; bg.scroll = m > 0 ? scrollY / m : 0;
  }, { passive: true });
  function loop(now) {
    requestAnimationFrame(loop);
    if (!bg.running) return;
    const t = (now - t0) / 1000;
    if (!hover) { bg.tx = 0.5 + 0.3 * Math.sin(t * 0.21); bg.ty = 0.5 + 0.25 * Math.cos(t * 0.17); }
    bg.mx += (bg.tx - bg.mx) * 0.06; bg.my += (bg.ty - bg.my) * 0.06;
    gl.useProgram(prog);
    gl.uniform2f(u.u_res, w, h); gl.uniform1f(u.u_t, t); gl.uniform1f(u.u_scroll, bg.scroll);
    gl.uniform1f(u.u_light, bg.light); gl.uniform2f(u.u_m, bg.mx, bg.my);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
  requestAnimationFrame(loop);
})(window.M);
