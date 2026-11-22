/* NYARTE — orquestrador: página narrativa, prévias vivas, estúdio em tela cheia, galeria, exportação */
(function (M) {
  const LABS = [
    {
      id: 'texture',
      n: '01',
      name: 'Texture Lab',
      sub: 'ARQUIVO URBANO & SUPERFÍCIES',
      tag: 'WEBGL · RELEVO',
      desc: 'Mármore, concreto bruto, asfalto molhado, metal com stickers e muros de lambe-lambe. Arraste para erodir camadas e projetar luz.',
      hint: 'Mova para projetar luz rasante • Arraste para erodir a superfície • Duplo clique para fraturar'
    },
    {
      id: 'ferro',
      n: '02',
      name: 'Pigment Lab',
      sub: 'VISCOSIDADE & MAGNETISMO',
      tag: 'FLUIDOS · FERROFLUIDO',
      desc: 'Óleo, aquarela, guache, acrílica, nanquim e ferrofluido magnético em alta densidade. Misture cores e crie espinhos magnéticos com o cursor.',
      hint: 'Arraste para depositar pigmento • Ative o Ferrofluido para magnetizar o traço'
    },
    {
      id: 'cosmic',
      n: '03',
      name: 'Cosmic Lab',
      sub: 'ESPAÇO PROFUNDO',
      tag: 'CANVAS · GRAVIDADE',
      desc: 'Nebulosas em camadas, estrelas em paralaxe e constelações que se conectam ao cursor. Segure para abrir um vórtice gravitacional; dê dois cliques para detonar uma supernova.',
      hint: 'Mova para conectar constelações • Segure o clique para vórtice • Duplo clique para supernova'
    },
    {
      id: 'generative',
      n: '04',
      name: 'Generative Art',
      sub: 'MOTOR ALGORÍTMICO',
      tag: 'ALGORITMOS',
      desc: 'Campos de fluxo, atratores estranhos e fractais, morfogênese celular e geometria sagrada, com simetria de 1× a 16×, turbulência e mutação aleatória.',
      hint: 'Mova para perturbar o campo • Ajuste os parâmetros no painel'
    },
    {
      id: 'molecular',
      n: '05',
      name: 'Molecular / Bio-Matter',
      sub: 'ESCALA MICROSCÓPICA',
      tag: 'CANVAS · FÍSICA',
      desc: 'Redes moleculares de ligações elásticas que vibram, se atraem e se rompem; membranas celulares com tensão superficial que se deformam e se dividem por mitose ao clique.',
      hint: 'Mova para agitar ligações • Clique para dividir células'
    },
    {
      id: 'crystal',
      n: '06',
      name: 'Crystal & Tarot',
      sub: 'ORÁCULO MINERAL',
      tag: 'CANVAS · ORÁCULO',
      desc: 'Ametista, lápis-lazúli, jaspe, quartzo, olho de tigre e obsidiana refratam a luz do cursor. Toque em um cristal, ele se conecta a um Arcano Maior e revela uma leitura simbólica.',
      hint: 'Passe o cursor para refratar a luz • Clique em um cristal para revelar o Arcano'
    }
  ];

  const $ = (id) => document.getElementById(id);
  const grid = $('grid'), studio = $('studio'), stage = $('stage'), dock = $('dock');
  let studioId = null, paused = false, toastT = 0;
  const gallery = [];
  const studioLabs = {}, studioCanvas = {}, previews = {};

  function toast(msg) {
    const t = $('toast');
    if (!t) return;
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; }, 2400);
  }

  // ---------- 4. Cartões dos 6 Laboratórios ----------
  grid.innerHTML = LABS.map((l) =>
    '<article class="uni reveal" data-lab="' + l.id + '">' +
      '<div class="uni-view">' +
        '<canvas aria-label="Prévia interativa: ' + l.name + '"></canvas>' +
        '<span class="uni-num">' + l.n + '</span>' +
        '<span class="uni-tag">' + l.tag + '</span>' +
      '</div>' +
      '<div class="uni-body">' +
        '<h3>' + l.name + '<small>' + l.sub + '</small></h3>' +
        '<p>' + l.desc + '</p>' +
        '<button class="enter" type="button" data-enter="' + l.id + '">ENTRAR NO LABORATÓRIO →</button>' +
      '</div>' +
    '</article>'
  ).join('');

  // ---------- Revelações ao rolar ----------
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      io.unobserve(e.target);
    }
  }), { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

  // ---------- Prévias vivas ----------
  function makeLab(id, canvas, opt) {
    try { return new M.labs[id](canvas, opt); } catch (e) { console.warn('Falha ao iniciar', id, e); return null; }
  }
  document.querySelectorAll('.uni').forEach((card) => {
    const id = card.dataset.lab, view = card.querySelector('.uni-view'), cv = card.querySelector('canvas');
    const P = previews[id] = { id, card, view, cv, lab: null, vis: false, hover: false, dd: false, ph: Math.random() * 6, t: 0 };
    P.lab = makeLab(id, cv, { preview: true });
    if (P.lab) {
      sizePreview(P);
      try { demo(P, 0.5); P.lab.frame(0.016, 0.5); } catch (_) {}
    }
    new IntersectionObserver((es) => {
      P.vis = es[0].isIntersecting;
      if (P.vis && P.lab) sizePreview(P);
    }, { rootMargin: '320px' }).observe(card);
    if (window.ResizeObserver) new ResizeObserver(() => sizePreview(P)).observe(view);
    const nrm = (e) => { const r = cv.getBoundingClientRect(); return [M.clamp((e.clientX - r.left) / r.width, 0, 1), M.clamp((e.clientY - r.top) / r.height, 0, 1)]; };
    cv.addEventListener('pointermove', (e) => { P.hover = true; if (P.lab) { const p = nrm(e); P.lab.pointer('move', p[0], p[1]); } });
    cv.addEventListener('pointerdown', (e) => { P.hover = true; if (P.lab && e.pointerType === 'mouse') { const p = nrm(e); P.lab.pointer('down', p[0], p[1]); } });
    cv.addEventListener('pointerup', (e) => { if (P.lab) { const p = nrm(e); P.lab.pointer('up', p[0], p[1]); } });
    cv.addEventListener('pointerleave', () => { P.hover = false; if (P.lab) P.lab.pointer('leave', 0.5, 0.5); P.dd = false; });
  });

  function sizePreview(P) {
    if (!P.lab) return;
    const r = P.view.getBoundingClientRect();
    if (r.width < 4) return;
    P.lab.resize(Math.floor(r.width), Math.floor(r.height), window.devicePixelRatio || 1);
  }
  function demo(P, t) {
    const x = 0.5 + 0.32 * Math.sin(t * 0.7 + P.ph), y = 0.5 + 0.28 * Math.sin(t * 0.53 + P.ph * 2), want = ((t + P.ph) % 7) < 4.2;
    if (want && !P.dd) { P.lab.pointer('down', x, y); P.dd = true; }
    else if (!want && P.dd) { P.lab.pointer('up', x, y); P.dd = false; }
    else P.lab.pointer('move', x, y);
  }

  // ---------- Estúdio ----------
  stage.innerHTML = '';
  LABS.forEach((l) => {
    const c = document.createElement('canvas');
    c.dataset.lab = l.id;
    c.setAttribute('aria-label', l.name);
    stage.appendChild(c);
    studioCanvas[l.id] = c;
    attachStudioEvents(c);
  });

  const tabs = $('studioTabs');
  const SHORT = { texture: 'Texture', ferro: 'Pigment', cosmic: 'Cosmic', generative: 'Generative', molecular: 'Molecular', crystal: 'Crystal' };
  tabs.innerHTML = LABS.map((l) => '<button type="button" data-tab="' + l.id + '"><b>' + l.n + '</b>' + SHORT[l.id] + '</button>').join('');

  function attachStudioEvents(c) {
    const nrm = (e) => { const r = c.getBoundingClientRect(); return [M.clamp((e.clientX - r.left) / r.width, 0, 1), M.clamp((e.clientY - r.top) / r.height, 0, 1)]; };
    let lastP = null;
    c.addEventListener('pointerdown', (e) => {
      const lab = studioLabs[studioId];
      if (!lab) return;
      try { c.setPointerCapture(e.pointerId); } catch (_) {}
      const p = nrm(e);
      lastP = p;
      lab.pointer('down', p[0], p[1]);
      M.audio.pluck(p[0], p[1], 0.6);
    });
    c.addEventListener('pointermove', (e) => {
      const lab = studioLabs[studioId];
      if (!lab) return;
      const p = nrm(e);
      lab.pointer('move', p[0], p[1]);
      if (lastP) {
        const sp = Math.hypot(p[0] - lastP[0], p[1] - lastP[1]) * 60;
        if (e.buttons || e.pointerType === 'mouse') M.audio.move(p[0], p[1], sp);
      }
      lastP = p;
    });
    c.addEventListener('pointerup', (e) => {
      const lab = studioLabs[studioId];
      if (lab) { const p = nrm(e); lab.pointer('up', p[0], p[1]); }
      if (e.pointerType !== 'mouse' && lab) lab.pointer('leave', 0.5, 0.5);
    });
    c.addEventListener('pointercancel', () => { const lab = studioLabs[studioId]; if (lab) lab.pointer('leave', 0.5, 0.5); });
    c.addEventListener('pointerleave', () => { const lab = studioLabs[studioId]; if (lab) lab.pointer('leave', 0.5, 0.5); lastP = null; });
    c.addEventListener('dblclick', (e) => { const lab = studioLabs[studioId]; if (lab) { const p = nrm(e); lab.pointer('dbl', p[0], p[1]); } });
    c.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  function sizeStudio() {
    const lab = studioLabs[studioId];
    if (!lab) return;
    const r = stage.getBoundingClientRect();
    lab.resize(Math.floor(r.width), Math.floor(r.height), window.devicePixelRatio || 1);
  }

  function openStudio(id, fromHash) {
    if (!M.labs[id]) return;
    const meta = LABS.find((l) => l.id === id);
    if (!studioId) {
      document.body.classList.add('in-studio');
      studio.hidden = false;
      if (M.bg) M.bg.running = false;
    }
    studioId = id;
    closeCard(true);
    Object.keys(studioCanvas).forEach((k) => studioCanvas[k].classList.toggle('on', k === id));
    if (!studioLabs[id]) {
      studioLabs[id] = makeLab(id, studioCanvas[id], { hooks: { card: showCard } });
      if (!studioLabs[id]) toast('Este laboratório não pôde iniciar neste dispositivo.');
    }
    sizeStudio();
    buildDock(meta);
    M.audio.setLab(id);
    tabs.querySelectorAll('button[data-tab]').forEach((b) => b.classList.toggle('on', b.dataset.tab === id));
    if (!fromHash && location.hash !== '#' + id) history.pushState({ lab: id }, '', '#' + id);
    if (innerWidth < 900) dock.classList.add('closed');
    else dock.classList.remove('closed');
    $('dockToggle').setAttribute('aria-expanded', dock.classList.contains('closed') ? 'false' : 'true');
    paused = false;
  }

  function closeStudio(fromHash) {
    if (!studioId) return;
    studio.hidden = true;
    document.body.classList.remove('in-studio', 'immersive');
    $('btnShowUi').hidden = true;
    studioId = null;
    closeCard(true);
    if (M.bg) M.bg.running = true;
    if (!fromHash && location.hash) history.pushState({}, '', location.pathname + location.search);
    $('universos').scrollIntoView({ block: 'start', behavior: 'auto' });
  }

  // ---------- Dock de controles ----------
  function buildDock(meta) {
    const lab = studioLabs[studioId];
    $('dockTitle').textContent = meta.name;
    $('dockTag').textContent = meta.tag;
    $('dockDesc').textContent = meta.desc;
    $('dockHint').textContent = meta.hint;
    const box = $('dockControls');
    box.innerHTML = '';
    if (!lab) return;
    const refresh = () => buildDock(meta);
    lab.controls().forEach((c) => {
      const w = document.createElement('div');
      w.className = 'ctl';
      if (c.type === 'slider') {
        const id = 'c_' + c.key, v = lab.params[c.key];
        w.innerHTML = '<label for="' + id + '"><span>' + c.label + '</span><span class="val">' + fmt(v, c.step) + '</span></label><input id="' + id + '" type="range" min="' + c.min + '" max="' + c.max + '" step="' + c.step + '" value="' + v + '">';
        const inp = w.querySelector('input'), val = w.querySelector('.val');
        inp.addEventListener('input', () => { const n = parseFloat(inp.value); val.textContent = fmt(n, c.step); if (lab.set(c.key, n)) refresh(); });
      } else if (c.type === 'seg') {
        w.innerHTML = '<div class="lbl"><span>' + c.label + '</span></div><div class="seg"></div>';
        const seg = w.querySelector('.seg');
        c.opts.forEach((o) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.textContent = o[1];
          if (lab.params[c.key] === o[0]) b.classList.add('on');
          b.addEventListener('click', () => {
            const r = lab.set(c.key, o[0]);
            if (r) { refresh(); return; }
            seg.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
            b.classList.add('on');
          });
          seg.appendChild(b);
        });
      } else if (c.type === 'swatch') {
        w.innerHTML = '<div class="lbl"><span>' + c.label + '</span><span class="val">' + M.SW[lab.params[c.key]][0] + '</span></div><div class="sw"></div>';
        const sw = w.querySelector('.sw'), val = w.querySelector('.val');
        M.SW.forEach((s, i) => {
          const b = document.createElement('button');
          b.type = 'button';
          b.style.background = s[1];
          b.style.color = s[1];
          b.title = s[0];
          b.setAttribute('aria-label', s[0]);
          if (lab.params[c.key] === i) b.classList.add('on');
          b.addEventListener('click', () => {
            lab.set(c.key, i);
            val.textContent = s[0];
            sw.querySelectorAll('button').forEach((x) => x.classList.remove('on'));
            b.classList.add('on');
          });
          sw.appendChild(b);
        });
      } else if (c.type === 'toggle') {
        w.innerHTML = '<button type="button" class="tog' + (lab.params[c.key] ? ' on' : '') + '"><span>' + c.label + '</span><i></i></button>';
        const b = w.querySelector('button');
        b.addEventListener('click', () => { const nv = !lab.params[c.key]; lab.set(c.key, nv); b.classList.toggle('on', nv); });
      } else if (c.type === 'button') {
        w.innerHTML = '<button type="button" class="mini">' + c.label + '</button>';
        w.querySelector('button').addEventListener('click', () => { if (lab.act(c.act)) refresh(); });
      }
      box.appendChild(w);
    });
  }

  function fmt(v, step) { return step >= 1 ? String(Math.round(v)) : Number(v).toFixed(2); }
  $('dockToggle').addEventListener('click', () => { const c = dock.classList.toggle('closed'); $('dockToggle').setAttribute('aria-expanded', c ? 'false' : 'true'); });

  // Botões comuns: ← VOLTAR | LIMPAR | ALEATÓRIO | SALVAR PNG ↓
  if ($('bBackDock')) $('bBackDock').addEventListener('click', () => closeStudio());
  $('bVar').addEventListener('click', () => {
    const lab = studioLabs[studioId];
    if (!lab) return;
    if (lab.randomize()) buildDock(LABS.find((l) => l.id === studioId));
    toast('Variação aleatória gerada');
  });
  $('bReset').addEventListener('click', () => {
    const lab = studioLabs[studioId];
    if (!lab) return;
    if (lab.reset()) buildDock(LABS.find((l) => l.id === studioId));
    toast('Laboratório limpo');
  });
  $('bCap').addEventListener('click', saveAndExportPng);

  function togglePause() {
    paused = !paused;
    toast(paused ? 'Simulação pausada' : 'Simulação retomada');
  }

  // ---------- Tarot ----------
  function glyph(cv, idx, color) {
    const c = cv.getContext('2d'), s = cv.width, r = s * 0.42, col = color || '#E4B54A';
    c.clearRect(0, 0, s, s); c.save(); c.translate(s / 2, s / 2);
    c.globalCompositeOperation = 'lighter';
    const g0 = c.createRadialGradient(0, 0, 2, 0, 0, r * 1.05);
    g0.addColorStop(0, M.rgba(col, 0.42));
    g0.addColorStop(0.55, M.rgba(col, 0.12));
    g0.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g0; c.beginPath(); c.arc(0, 0, r * 1.05, 0, 6.2832); c.fill();
    const petals = 5 + (idx % 6);
    for (let ring = 0; ring < 18; ring++) {
      const u = ring / 17, rad = r * (0.22 + u * 0.74);
      c.strokeStyle = M.rgba(ring % 3 === 0 ? '#F6F2EA' : col, (1 - u * 0.65) * 0.28);
      c.lineWidth = ring % 4 === 0 ? 1.2 : 0.65;
      c.beginPath();
      for (let a = 0; a <= 96; a++) {
        const th = (a / 96) * 6.2832;
        const dr = Math.sin(th * petals + idx * 0.9 + u * 4.2) * (4 + u * 8)
                 + Math.cos(th * (petals + 2) - idx * 1.3) * 3.2;
        const px = Math.cos(th) * (rad + dr), py = Math.sin(th) * (rad + dr);
        if (a === 0) c.moveTo(px, py); else c.lineTo(px, py);
      }
      c.closePath(); c.stroke();
    }
    for (let i = 0; i < 28; i++) {
      const a = M.hash1(idx, i * 1.7) * 6.2832, d = Math.pow(M.hash1(i * 2.3, idx), 0.7) * r * 0.78;
      const px = Math.cos(a) * d, py = Math.sin(a) * d, sz = 0.7 + M.hash1(i, idx * 3.1) * 1.6;
      c.fillStyle = M.rgba(i % 2 ? '#FFFFFF' : col, 0.65);
      c.beginPath(); c.arc(px, py, sz, 0, 6.2832); c.fill();
    }
    c.restore();
  }

  function showCard(info) {
    const el = $('tarot');
    if (!info) { $('cardEl').classList.remove('show'); el.hidden = true; return; }
    el.hidden = false;
    const card = $('cardEl');
    card.classList.remove('show');
    $('tNum').textContent = info.arc[0];
    $('tName').textContent = info.arc[1];
    $('tArch').textContent = info.arc[2];
    $('tText').textContent = info.arc[3];
    $('tVia').textContent = '◈ ' + info.crystal.n;
    glyph($('tGlyph'), info.ai, info.crystal.c === '#18181F' ? '#C9D0FF' : info.crystal.c === '#DCE6F2' ? '#FFFFFF' : info.crystal.hi);
    requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add('show')));
  }
  function closeCard(silent) {
    const lab = studioLabs.crystal;
    if (lab && lab.card && !silent) lab.closeCard();
    else if (lab && lab.card) lab.card = null;
    $('tarot').hidden = true;
    $('cardEl').classList.remove('show');
  }
  $('tarotClose').addEventListener('click', () => closeCard(false));

  // ---------- Captura, PNG, galeria ----------
  function currentURL() {
    if (studioId && studioLabs[studioId]) return { url: studioLabs[studioId].snapshot(), lab: LABS.find((l) => l.id === studioId).name };
    if (M.bg && M.bg.ok) return { url: M.bg.canvas.toDataURL('image/png'), lab: 'NYARTE' };
    return null;
  }
  function stamp() {
    const d = new Date(), p = (n) => String(n).padStart(2, '0');
    return d.getFullYear() + p(d.getMonth() + 1) + p(d.getDate()) + '-' + p(d.getHours()) + p(d.getMinutes()) + p(d.getSeconds());
  }
  function dl(url, name) {
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
  function capture() {
    try {
      const r = currentURL();
      if (!r) { toast('Nada para capturar agora.'); return null; }
      const item = { url: r.url, lab: r.lab, time: new Date().toLocaleTimeString('pt-BR'), id: stamp() + '-' + gallery.length };
      gallery.unshift(item);
      if (gallery.length > 20) gallery.pop();
      renderGallery();
      toast('Salvo na Galeria da Sessão');
      return item;
    } catch (e) {
      toast('Não foi possível capturar esta imagem.');
      return null;
    }
  }
  function saveAndExportPng() {
    const item = capture();
    if (item) {
      dl(item.url, 'nyarte-' + (studioId || 'obra') + '-' + stamp() + '.png');
      toast('PNG salvo e registrado na Galeria');
    }
  }
  function renderGallery() {
    const nEl = $('galN');
    if (nEl) nEl.textContent = gallery.length > 0 ? ' ' + gallery.length : '';
    $('galEmpty').hidden = gallery.length > 0;
    const g = $('galGrid');
    g.innerHTML = '';
    gallery.forEach((it) => {
      const d = document.createElement('article');
      d.className = 'gcard';
      d.innerHTML = '<img alt="Captura de ' + it.lab + '" src="' + it.url + '"><div class="gmeta"><span>' + it.lab + '<small>' + it.time + '</small></span><div><button class="mini hot" type="button">SALVAR PNG ↓</button><button class="mini" type="button">×</button></div></div>';
      const b = d.querySelectorAll('button');
      b[0].addEventListener('click', () => dl(it.url, 'nyarte-' + it.id + '.png'));
      b[1].addEventListener('click', () => { gallery.splice(gallery.indexOf(it), 1); renderGallery(); });
      g.appendChild(d);
    });
  }
  $('galCap').addEventListener('click', saveAndExportPng);
  $('galClear').addEventListener('click', () => { gallery.length = 0; renderGallery(); });

  // ---------- Modais ----------
  function modal(el, open) {
    el.hidden = !open;
    document.body.classList.toggle('modal-open', open || !$('infoModal').hidden || !$('galDrawer').hidden);
  }
  const openInfo = () => { modal($('galDrawer'), false); modal($('infoModal'), true); };
  const closeInfo = () => modal($('infoModal'), false);
  const openGal = () => { renderGallery(); modal($('infoModal'), false); modal($('galDrawer'), true); };
  const closeGal = () => modal($('galDrawer'), false);
  $('btnInfo').addEventListener('click', openInfo);
  if ($('btnInfo2')) $('btnInfo2').addEventListener('click', openInfo);
  $('infoClose').addEventListener('click', closeInfo);
  $('btnGal').addEventListener('click', openGal);
  $('galClose').addEventListener('click', closeGal);
  $('infoModal').addEventListener('click', (e) => { if (e.target.id === 'infoModal') closeInfo(); });
  $('galDrawer').addEventListener('click', (e) => { if (e.target.id === 'galDrawer') closeGal(); });

  // ---------- Som ----------
  async function toggleSound() {
    const on = await M.audio.toggle();
    $('btnSound').setAttribute('aria-pressed', on ? 'true' : 'false');
    $('btnSound').textContent = '[SOM: ' + (on ? 'ON' : 'OFF') + ']';
    toast(on ? 'Áudio generativo ativado' : 'Áudio silenciado');
  }
  $('btnSound').addEventListener('click', toggleSound);

  // ---------- Tela cheia ----------
  function fsActive() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  async function toggleFs() {
    if (!fsActive()) {
      const el = document.documentElement, req = el.requestFullscreen || el.webkitRequestFullscreen;
      if (req) { try { await req.call(el); } catch (_) {} }
      if (studioId) { document.body.classList.add('immersive'); $('btnShowUi').hidden = false; }
    } else {
      const ex = document.exitFullscreen || document.webkitExitFullscreen;
      try { await ex.call(document); } catch (_) {}
      document.body.classList.remove('immersive');
      $('btnShowUi').hidden = true;
    }
  }
  function syncFs() {
    const a = fsActive();
    $('btnFs').textContent = a ? '[SAIR TELA CHEIA]' : '[TELA CHEIA]';
    $('btnExitFs').hidden = !a || !!studioId;
    if (!a) { document.body.classList.remove('immersive'); $('btnShowUi').hidden = true; }
    setTimeout(sizeStudio, 120);
  }
  document.addEventListener('fullscreenchange', syncFs);
  document.addEventListener('webkitfullscreenchange', syncFs);
  $('btnFs').addEventListener('click', toggleFs);
  $('btnExitFs').addEventListener('click', toggleFs);
  $('btnShowUi').addEventListener('click', () => { document.body.classList.remove('immersive'); $('btnShowUi').hidden = true; });

  // ---------- Navegação ----------
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-enter]'); if (b) openStudio(b.dataset.enter); });
  tabs.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b) return;
    if (b.dataset.tab) openStudio(b.dataset.tab, false);
  });
  $('btnBack').addEventListener('click', () => closeStudio());
  $('logo').addEventListener('click', (e) => { if (studioId) { e.preventDefault(); closeStudio(); } });
  window.addEventListener('popstate', () => {
    const id = location.hash.slice(1);
    if (M.labs[id] && LABS.some((l) => l.id === id)) openStudio(id, true);
    else if (studioId) closeStudio(true);
  });
  document.addEventListener('keydown', (e) => {
    if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
    const k = e.key.toLowerCase();
    if (e.key === 'Escape') {
      if (!$('infoModal').hidden) closeInfo();
      else if (!$('galDrawer').hidden) closeGal();
      else if (document.body.classList.contains('immersive')) { document.body.classList.remove('immersive'); $('btnShowUi').hidden = true; }
      else if (studioId) closeStudio();
      return;
    }
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (/^[1-6]$/.test(k)) openStudio(LABS[+k - 1].id);
    else if (k === 'm') toggleSound();
    else if (k === 'f') toggleFs();
    else if (k === 'i') ($('infoModal').hidden ? openInfo() : closeInfo());
    else if (k === 'g') ($('galDrawer').hidden ? openGal() : closeGal());
    else if (studioId && k === ' ') { e.preventDefault(); togglePause(); }
    else if (studioId && (k === 's' || k === 'p')) saveAndExportPng();
  });

  let rt = 0;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      if (studioId) sizeStudio();
      Object.values(previews).forEach(sizePreview);
    }, 120);
  });

  // ---------- Laço principal ----------
  let last = performance.now(), t0 = last;
  function loop(now) {
    requestAnimationFrame(loop);
    const dt = Math.min(0.05, Math.max(0.001, (now - last) / 1000));
    last = now;
    const t = (now - t0) / 1000;
    if (studioId) {
      const lab = studioLabs[studioId];
      if (lab && !paused) {
        try { lab.frame(dt, t); } catch (e) { console.error(e); paused = true; toast('Erro neste laboratório — pausado.'); }
      }
      return;
    }
    for (const id in previews) {
      const P = previews[id];
      if (!P.vis || !P.lab) continue;
      try {
        if (!P.hover) demo(P, t);
        P.lab.frame(dt, t);
      } catch (e) { console.error(e); P.lab = null; }
    }
  }
  requestAnimationFrame(loop);

  const h = location.hash.slice(1);
  if (LABS.some((l) => l.id === h)) setTimeout(() => openStudio(h, true), 60);
})(window.M);
