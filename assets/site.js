(() => {
  const svgNS = 'http://www.w3.org/2000/svg';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const section = document.body.dataset.q;
  const pad = (n) => String(n).padStart(2, '0');

  // Same quarters as the homepage: start angle, clockwise from 3 o'clock.
  const QUARTERS = { about: 0, design: 90, film: 180, misc: 270 };

  // ---------- Corner ring ----------
  const ring = document.querySelector('.mini-ring');
  if (ring) {
    const DASHES = 24;
    const RADIUS = 60;
    const DASH_LEN = 9;
    for (let i = 0; i < DASHES; i++) {
      const angle = (i + 0.5) * (360 / DASHES);
      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('transform', `rotate(${angle})`);
      const line = document.createElementNS(svgNS, 'line');
      line.setAttribute('class', 'dash');
      line.setAttribute('x1', RADIUS);
      line.setAttribute('x2', RADIUS);
      line.setAttribute('y1', -DASH_LEN / 2);
      line.setAttribute('y2', DASH_LEN / 2);
      if ((angle - QUARTERS[section] + 360) % 360 < 90) line.classList.add('up');
      g.appendChild(line);
      ring.appendChild(g);
    }
  }

  const statics = [...document.querySelectorAll('.static')];
  if (statics.length) window.AVStatic.run(statics);

  ({ film, design, about, misc })[section]?.();

  // ==================== Film ====================
  // Each <li> in .strip describes one film with data attributes; this builds
  // its thumbnail and plays it in the viewfinder.
  function film() {
    const viewfinder = document.querySelector('.viewfinder');
    const media = viewfinder.querySelector('.media');
    const state = viewfinder.querySelector('.state');
    const tc = viewfinder.querySelector('.tc');
    const title = viewfinder.querySelector('.title');
    const counter = viewfinder.querySelector('.counter');
    const [prev, next] = viewfinder.querySelectorAll('.count button');
    const items = [...document.querySelectorAll('.strip li')];

    document.querySelector('.datum-count').textContent = pad(items.length);

    // Timecode at 24 fps from page load. It is a reading, not decoration,
    // so it runs under reduced motion too.
    const start = performance.now();
    let lastFrame = -1;
    (function tick(now) {
      const f = Math.floor(((now - start) / 1000) * 24);
      if (f !== lastFrame) {
        lastFrame = f;
        tc.textContent = [Math.floor(f / 86400), Math.floor(f / 1440) % 60, Math.floor(f / 24) % 60, f % 24]
          .map(pad).join(':');
      }
      requestAnimationFrame(tick);
    })(start);

    prev.disabled = next.disabled = items.length < 2;
    if (!items.length) return;

    for (const [i, li] of items.entries()) {
      const d = li.dataset;
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      if (d.poster) {
        const img = document.createElement('img');
        img.src = d.poster;
        img.alt = '';
        img.loading = 'lazy';
        button.appendChild(img);
      }
      const label = document.createElement('span');
      label.className = 'data';
      label.textContent = [d.title, d.year].filter(Boolean).join(' / ');
      button.appendChild(label);
      button.addEventListener('click', () => show(i));
      li.appendChild(button);
    }

    let current = -1;

    function show(i) {
      i = (i + items.length) % items.length;
      if (i === current) return;
      current = i;
      const d = items[i].dataset;
      viewfinder.classList.remove('is-playing');
      state.textContent = 'Stby';
      media.replaceChildren(makeMedia(d));
      title.textContent = [d.title, d.year, d.role].filter(Boolean).join(' / ');
      counter.textContent = `${pad(i + 1)} / ${pad(items.length)}`;
      items.forEach((li, k) => li.querySelector('button').setAttribute('aria-pressed', String(k === i)));
    }

    function makeMedia(d) {
      if (d.embed) {
        const frame = document.createElement('iframe');
        frame.src = d.embed;
        frame.title = d.title || 'Film';
        frame.allow = 'autoplay; fullscreen; picture-in-picture';
        frame.allowFullscreen = true;
        return frame;
      }
      if (d.video) {
        const video = document.createElement('video');
        video.src = d.video;
        if (d.poster) video.poster = d.poster;
        video.controls = true;
        video.playsInline = true;
        video.addEventListener('play', () => { viewfinder.classList.add('is-playing'); state.textContent = 'Play'; });
        video.addEventListener('pause', () => { viewfinder.classList.remove('is-playing'); state.textContent = 'Stby'; });
        return video;
      }
      const img = document.createElement('img');
      img.src = d.poster;
      img.alt = d.title || '';
      return img;
    }

    prev.addEventListener('click', () => show(current - 1));
    next.addEventListener('click', () => show(current + 1));
    // Keyboard stepping swaps instantly, with no animation.
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('input, textarea, video, iframe')) return;
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });

    show(0);
  }

  // ==================== Design ====================
  // Each link in .index is a project; hovering or focusing it shows its image
  // in the preview, and every project also gets a cell on the contact sheet.
  function design() {
    const links = [...document.querySelectorAll('.index a')];
    const caption = document.querySelector('.preview figcaption');
    const sheet = document.querySelector('.sheet');

    document.querySelector('.datum-count').textContent = pad(links.length);
    if (!links.length) return;

    const img = document.createElement('img');
    img.alt = '';
    document.querySelector('.preview .frame').prepend(img);

    for (const a of links) {
      const li = document.createElement('li');
      li.className = 'reg';
      const cell = document.createElement('a');
      cell.href = a.href;
      const thumb = document.createElement('img');
      thumb.src = a.dataset.img;
      thumb.alt = '';
      thumb.loading = 'lazy';
      const label = document.createElement('span');
      label.className = 'data';
      label.textContent = a.textContent;
      cell.append(thumb, label);
      li.appendChild(cell);
      sheet.appendChild(li);
    }

    let active = null;
    let token = 0;

    function preview(a) {
      if (a === active) return;
      active?.classList.remove('is-active');
      active = a;
      a.classList.add('is-active');
      caption.textContent = [a.textContent, a.dataset.year, a.dataset.medium].filter(Boolean).join(' / ');
      const mine = ++token;
      img.classList.add('is-swapping');
      const next = new Image();
      next.src = a.dataset.img;
      next.decode().catch(() => {}).then(() => {
        if (mine !== token) return;
        img.src = next.src;
        img.alt = a.textContent;
        img.classList.remove('is-swapping');
      });
    }

    for (const a of links) {
      a.addEventListener('pointerenter', () => preview(a));
      a.addEventListener('focus', () => preview(a));
    }

    preview(links[0]);
  }

  // ==================== About ====================
  // The slider steps between versions of the bio, shortest first.
  function about() {
    const versions = [...document.querySelectorAll('.bio p')];
    const range = document.querySelector('.length input');
    const counter = document.querySelector('.datum-count');
    const last = versions.length - 1;
    range.max = last;

    function set(v) {
      versions.forEach((p, k) => p.classList.toggle('is-on', k === v));
      range.style.setProperty('--fill', `${last ? (v / last) * 100 : 0}%`);
      range.setAttribute('aria-valuetext', `Version ${v + 1} of ${versions.length}`);
      counter.textContent = `${pad(v + 1)} / ${pad(versions.length)}`;
    }

    range.addEventListener('input', () => set(Number(range.value)));
    set(Number(range.value));
  }

  // ==================== Misc ====================
  // A field of glyphs that flickers like static, densest in a ball at the
  // center. The pointer tunes it: glyphs crowd in around the cursor.
  function misc() {
    document.querySelector('.datum-count').textContent = pad(document.querySelectorAll('.objects li').length);

    const canvas = document.querySelector('.field canvas');
    const ctx = canvas.getContext('2d');
    const GLYPHS = '.,:;-~+=*/\\|<>x^';
    const TICK = 80;
    const TUNE_RADIUS = 120;

    let w = 0, h = 0, cell = 14, cols = 0, rows = 0;
    let base = new Float32Array(0);
    let ink = '#000';
    let timer = null;
    let onScreen = true;
    const pointer = { x: -1e4, y: -1e4, tx: -1e4, ty: -1e4 };

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cell = w < 600 ? 11 : 14;
      cols = Math.ceil(w / cell);
      rows = Math.ceil(h / cell);
      const radius = Math.min(w, h) * 0.36;
      base = new Float32Array(cols * rows);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const d = Math.hypot(x * cell + cell / 2 - w / 2, y * cell + cell / 2 - h / 2) / radius;
          base[y * cols + x] = d < 1 ? 0.7 - 0.3 * d : 0.05 * Math.exp(-(d - 1) * 2.2);
        }
      }
      ctx.font = `${cell - 1}px "Courier New", Courier, monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ink = getComputedStyle(document.documentElement).color;
      draw();
    }

    function draw() {
      // Ease toward the pointer, so the tuning trails it a little.
      pointer.x += (pointer.tx - pointer.x) * 0.4;
      pointer.y += (pointer.ty - pointer.y) * 0.4;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = ink;
      for (let y = 0; y < rows; y++) {
        const py = y * cell + cell / 2;
        for (let x = 0; x < cols; x++) {
          const px = x * cell + cell / 2;
          let p = base[y * cols + x];
          const pd = Math.hypot(px - pointer.x, py - pointer.y);
          if (pd < TUNE_RADIUS) p += 0.55 * (1 - pd / TUNE_RADIUS);
          if (Math.random() < p) ctx.fillText(GLYPHS[(Math.random() * GLYPHS.length) | 0], px, py);
        }
      }
    }

    function start() {
      if (timer || reduceMotion.matches) return;
      timer = setInterval(draw, TICK);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    new ResizeObserver(resize).observe(canvas);

    new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !document.hidden) start(); else stop();
    }).observe(canvas);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (onScreen) start();
    });

    const field = canvas.parentElement;
    field.addEventListener('pointermove', (e) => {
      const rect = canvas.getBoundingClientRect();
      pointer.tx = e.clientX - rect.left;
      pointer.ty = e.clientY - rect.top;
      if (pointer.x < -1000) {
        pointer.x = pointer.tx;
        pointer.y = pointer.ty;
      }
    });
    const release = () => {
      pointer.x = pointer.tx = -1e4;
      pointer.y = pointer.ty = -1e4;
    };
    field.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') release(); });

    // Touch has no hover, so a tap tunes the spot for a moment.
    let releaseTimer = null;
    field.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse') return;
      const rect = canvas.getBoundingClientRect();
      pointer.x = pointer.tx = e.clientX - rect.left;
      pointer.y = pointer.ty = e.clientY - rect.top;
      if (reduceMotion.matches) draw();
      clearTimeout(releaseTimer);
      releaseTimer = setTimeout(() => { release(); if (reduceMotion.matches) draw(); }, 1400);
    });
  }
})();
