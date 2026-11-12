// Section pages. Registered as a page for nav.js, which mounts it on arrival
// and aborts `signal` when the visitor moves to another page.
(window.AVPages ||= {}).section = (signal) => {
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
  if (statics.length) signal.addEventListener('abort', window.AVStatic.run(statics));

  ({ film, design, about, misc })[section]?.();

  // ==================== Film ====================
  // Each <li> in .strip is one film; its <img> tags are the stills. The
  // viewfinder shows one film's stills, the arrows step through them, and the
  // strip below switches film. A film with a source gets a play button, and
  // the background music pauses while it plays.
  function film() {
    const viewfinder = document.querySelector('.viewfinder');
    const media = viewfinder.querySelector('.media');
    const play = viewfinder.querySelector('.play');
    const title = viewfinder.querySelector('.title');
    const counter = viewfinder.querySelector('.counter');
    const [prev, next] = viewfinder.querySelectorAll('.count button');

    const films = [...document.querySelectorAll('.strip li')].map((li) => {
      const stills = [...li.querySelectorAll('img')].map((img) => ({ src: img.src, alt: img.alt }));
      li.replaceChildren();
      return { li, ...li.dataset, stills };
    });

    document.querySelector('.datum-count').textContent = pad(films.length);
    prev.disabled = next.disabled = true;
    if (!films.length) return;

    for (const [i, f] of films.entries()) {
      const button = document.createElement('button');
      button.type = 'button';
      button.setAttribute('aria-pressed', 'false');
      if (f.stills[0]) {
        const img = document.createElement('img');
        img.src = f.stills[0].src;
        img.alt = '';
        img.loading = 'lazy';
        button.appendChild(img);
      }
      const label = document.createElement('span');
      label.className = 'data';
      label.textContent = [f.title, f.year].filter(Boolean).join(' / ');
      button.appendChild(label);
      button.addEventListener('click', () => showFilm(i));
      f.li.appendChild(button);
    }

    let current = null;  // the film on screen
    let still = 0;
    let shot = null;     // the still <img> on screen
    let player = null;   // the <video> or <iframe> while a film plays
    let token = 0;

    function showFilm(i) {
      if (films[i] === current) return;
      stopFilm();
      current = films[i];
      title.textContent = [current.title, current.year, current.role].filter(Boolean).join(' / ');
      films.forEach((f) => f.li.querySelector('button').setAttribute('aria-pressed', String(f === current)));
      const playable = !!(current.embed || current.video);
      play.hidden = !playable;
      viewfinder.classList.toggle('is-playable', playable);
      play.setAttribute('aria-label', `Play ${current.title || 'film'}${current.length ? `, ${current.length}` : ''}`);
      play.querySelector('.play-length').textContent = current.length || '';
      prev.disabled = next.disabled = current.stills.length < 2;
      showStill(0, false);
    }

    // Clicks cross-fade through a light blur; keyboard steps swap instantly.
    function showStill(k, animate) {
      const { stills } = current;
      if (!stills.length) {
        shot?.remove();
        shot = null;
        counter.textContent = '00 / 00';
        return;
      }
      still = (k + stills.length) % stills.length;
      counter.textContent = `${pad(still + 1)} / ${pad(stills.length)}`;
      const mine = ++token;
      const img = new Image();
      img.className = 'shot';
      img.src = stills[still].src;
      img.alt = stills[still].alt;
      img.decode().catch(() => {}).then(() => {
        if (mine !== token || signal.aborted) return;
        const old = shot;
        shot = img;
        if (!animate || reduceMotion.matches) {
          old?.remove();
          media.prepend(img);
          return;
        }
        img.classList.add('is-entering');
        media.prepend(img);
        if (old) media.prepend(old);  // keep the new still on top
        requestAnimationFrame(() => requestAnimationFrame(() => img.classList.remove('is-entering')));
        setTimeout(() => old?.remove(), 260);
      });
    }

    // ---------- Player ----------
    // Video files play in our own player: the progress line under the
    // picture and the transport in place of the stills counter. Embeds
    // (YouTube, Vimeo) bring their own controls; only "close" is ours.
    const scrub = viewfinder.querySelector('.scrub input');
    const tPlay = viewfinder.querySelector('.t-play');
    const tNow = viewfinder.querySelector('.t-now');
    const tTotal = viewfinder.querySelector('.t-total');
    const tMute = viewfinder.querySelector('.t-mute');
    const tFull = viewfinder.querySelector('.t-full');
    const tClose = viewfinder.querySelector('.t-close');
    const clock = (sec) => {
      const t = Math.max(0, Math.floor(sec || 0));
      return `${pad(Math.floor(t / 60))}:${pad(t % 60)}`;
    };
    let scrubbing = false;

    function playFilm() {
      if (!current || player || !(current.embed || current.video)) return;
      window.AVSound?.hold();
      viewfinder.classList.add('is-playing');

      if (current.embed) {
        player = document.createElement('iframe');
        const url = new URL(current.embed, location.href);
        url.searchParams.set('autoplay', '1');
        player.src = url.href;
        player.title = current.title || 'Film';
        player.allow = 'autoplay; fullscreen; picture-in-picture';
        player.allowFullscreen = true;
        viewfinder.classList.add('is-embed');
        media.appendChild(player);
        play.hidden = true;
        return;
      }

      // The still stays up, with the center ring turning, until the first
      // frame is ready; then the film fades in over it.
      const video = player = document.createElement('video');
      video.src = current.video;
      video.playsInline = true;
      video.preload = 'auto';
      video.addEventListener('playing', () => {
        viewfinder.classList.remove('is-loading');
        viewfinder.classList.add('has-started');
        play.hidden = true;
      });
      video.addEventListener('play', renderTransport);
      video.addEventListener('pause', renderTransport);
      video.addEventListener('volumechange', renderTransport);
      video.addEventListener('loadedmetadata', renderTransport);
      video.addEventListener('timeupdate', renderTransport);
      video.addEventListener('ended', stopFilm);
      video.addEventListener('click', () => (video.paused ? video.play() : video.pause()));
      media.appendChild(video);
      viewfinder.classList.add('is-loading');
      video.play().catch(() => {
        viewfinder.classList.remove('is-loading');
        renderTransport();
      });
      renderTransport();
    }

    function renderTransport() {
      if (!(player instanceof HTMLVideoElement)) return;
      const { currentTime, duration, paused, muted } = player;
      const total = Number.isFinite(duration) ? duration : 0;
      viewfinder.classList.toggle('is-paused', paused);
      tPlay.setAttribute('aria-label', paused ? 'Play' : 'Pause');
      tMute.setAttribute('aria-label', muted ? 'Unmute film' : 'Mute film');
      viewfinder.classList.toggle('is-muted', muted);
      tNow.textContent = clock(currentTime);
      tTotal.textContent = ` / ${clock(total)}`;
      if (!scrubbing) {
        scrub.max = Math.floor(total);
        scrub.value = Math.floor(currentTime);
      }
      scrub.style.setProperty('--fill', `${total ? (currentTime / total) * 100 : 0}%`);
      scrub.setAttribute('aria-valuetext', `${clock(currentTime)} of ${clock(total)}`);
    }

    function stopFilm() {
      if (!player) return;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      player.remove();
      player = null;
      scrubbing = false;
      viewfinder.classList.remove('is-playing', 'is-embed', 'is-loading', 'has-started', 'is-paused', 'is-muted');
      play.hidden = !(current.embed || current.video);
      window.AVSound?.release();
    }

    const togglePlay = () => {
      if (player instanceof HTMLVideoElement) player.paused ? player.play() : player.pause();
    };
    const seekBy = (sec) => {
      if (player instanceof HTMLVideoElement) player.currentTime = Math.max(0, Math.min(player.duration || 0, player.currentTime + sec));
    };

    tPlay.addEventListener('click', togglePlay);
    tMute.addEventListener('click', () => { if (player instanceof HTMLVideoElement) player.muted = !player.muted; });
    tClose.addEventListener('click', stopFilm);

    // Full screen takes the whole viewfinder, so our controls come along.
    // iPhone only lets the video itself go full screen, with its own controls.
    tFull.addEventListener('click', () => {
      if (document.fullscreenElement) return void document.exitFullscreen();
      if (viewfinder.requestFullscreen) viewfinder.requestFullscreen().catch(() => {});
      else player?.webkitEnterFullscreen?.();
    });
    document.addEventListener('fullscreenchange', () => {
      tFull.setAttribute('aria-label', document.fullscreenElement ? 'Exit full screen' : 'Full screen');
    }, { signal });

    scrub.addEventListener('pointerdown', () => { scrubbing = true; });
    scrub.addEventListener('input', () => {
      if (!(player instanceof HTMLVideoElement)) return;
      player.currentTime = Number(scrub.value);
      renderTransport();
    });
    for (const type of ['change', 'pointerup', 'pointercancel']) scrub.addEventListener(type, () => { scrubbing = false; });

    play.addEventListener('click', playFilm);
    // The still itself is a play button too; once playing, clicks belong
    // to the video.
    media.addEventListener('click', () => { if (!player) playFilm(); });

    const step = (by, animate) => {
      if (!current || current.stills.length < 2) return;
      stopFilm();
      showStill(still + by, animate);
    };

    prev.addEventListener('click', () => step(-1, true));
    next.addEventListener('click', () => step(1, true));
    // Keys: arrows step stills, or seek 5s while a film plays; space pauses.
    // On the progress line itself, the arrows are the slider's own.
    document.addEventListener('keydown', (e) => {
      if (e.target.closest('textarea, iframe')) return;
      if (e.target.closest('input') && e.target !== scrub) return;
      const playing = player instanceof HTMLVideoElement;
      const onScrub = e.target === scrub;
      if (e.key === 'ArrowLeft' && !onScrub) playing ? seekBy(-5) : step(-1, false);
      else if (e.key === 'ArrowRight' && !onScrub) playing ? seekBy(5) : step(1, false);
      else if (e.key === ' ' && playing && !e.target.closest('button, a')) { e.preventDefault(); togglePlay(); }
      else if (e.key === 'Escape' && !document.fullscreenElement) stopFilm();
    }, { signal });

    // Leaving the page mid-film brings the music back.
    signal.addEventListener('abort', stopFilm);

    showFilm(0);
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

    const sizer = new ResizeObserver(resize);
    sizer.observe(canvas);

    const watcher = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting;
      if (onScreen && !document.hidden) start(); else stop();
    });
    watcher.observe(canvas);

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stop(); else if (onScreen) start();
    }, { signal });

    signal.addEventListener('abort', () => {
      stop();
      sizer.disconnect();
      watcher.disconnect();
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
};
