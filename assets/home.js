(() => {
  const stage = document.getElementById('stage');
  const ring = document.getElementById('ring');
  const svgNS = 'http://www.w3.org/2000/svg';

  const RADIUS = 60;        // ring radius, in viewBox units
  const DASHES = 60;        // 15 per quarter
  const DASH_LEN = 3.4;
  const SPIN = 8;           // degrees per second while idle (one turn per 45s)
  const HOVER_RADIUS = 92;  // pointer within this distance counts as "on the circle"
  const LIFT_SPREAD = 180;  // ms for the lift to travel across a quarter

  // Screen angles in SVG space: 0deg = 3 o'clock, increasing clockwise.
  // Each quarter ends at its label, as in the sketch.
  const QUARTERS = {
    about:  0,    // 3 -> 6 o'clock, label at bottom
    design: 90,   // 6 -> 9, label at left
    film:   180,  // 9 -> 12, label at top
    misc:   270,  // 12 -> 3, label at right
  };

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  // ---------- Build the ring ----------
  const dashes = [];
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
    g.appendChild(line);
    ring.appendChild(g);
    dashes.push({ angle, el: line, up: false });
  }

  // ---------- Misc icon: a ball of static (static.js) ----------
  const staticLines = [...stage.querySelectorAll('.static')];
  let stopStatic = () => {};

  function runStatic(on) {
    stopStatic();
    stopStatic = on ? window.AVStatic.run(staticLines) : () => {};
  }

  window.AVStatic.draw(staticLines);

  // ---------- State ----------
  const labels = [...stage.querySelectorAll('.q')];
  const leaders = [...stage.querySelectorAll('.leaders line')];
  const icons = [...stage.querySelectorAll('.icon')];

  let active = null;
  let rotation = 0;
  let speed = reduceMotion.matches ? 0 : SPIN;

  const norm = (deg) => ((deg % 360) + 360) % 360;

  function setActive(q) {
    if (q === active) return;
    active = q;
    stage.classList.toggle('is-active', !!q);
    for (const set of [labels, leaders, icons]) {
      for (const el of set) el.classList.toggle('on', el.dataset.q === q);
    }
    runStatic(q === 'misc');
    updateDashes();
  }

  function updateDashes() {
    const start = active ? QUARTERS[active] : 0;
    for (const d of dashes) {
      const offset = norm(d.angle + rotation - start);
      const up = !!active && offset < 90;
      if (up === d.up) continue;
      d.up = up;
      // Lift travels clockwise toward the label; drop is immediate.
      d.el.style.transitionDelay = up ? `${Math.round((offset / 90) * LIFT_SPREAD)}ms` : '0ms';
      d.el.classList.toggle('up', up);
    }
  }

  // ---------- Spin ----------
  let last = performance.now();
  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    const target = active || reduceMotion.matches ? 0 : SPIN;
    speed += (target - speed) * Math.min(1, dt * 8);
    if (Math.abs(speed) > 0.001) {
      rotation = norm(rotation + speed * dt);
      ring.setAttribute('transform', `rotate(${rotation.toFixed(3)})`);
      if (active) updateDashes();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------- Pointer ----------
  // Returns the quarter under the pointer, null if off the circle,
  // or undefined for the dead zone right at the center.
  function quarterAt(clientX, clientY) {
    const r = stage.getBoundingClientRect();
    const scale = 200 / r.width;
    const x = (clientX - (r.left + r.width / 2)) * scale;
    const y = (clientY - (r.top + r.height / 2)) * scale;
    const dist = Math.hypot(x, y);
    if (dist > HOVER_RADIUS) return null;
    if (dist < 6) return undefined;
    const a = norm((Math.atan2(y, x) * 180) / Math.PI);
    return Object.keys(QUARTERS).find((q) => a >= QUARTERS[q] && a < QUARTERS[q] + 90);
  }

  let pointerType = 'mouse';

  stage.addEventListener('pointermove', (e) => {
    pointerType = e.pointerType;
    if (e.pointerType !== 'mouse') return;
    const label = e.target.closest('.q');
    if (label) return setActive(label.dataset.q);
    const q = quarterAt(e.clientX, e.clientY);
    if (q !== undefined) setActive(q);
  });

  stage.addEventListener('pointerleave', (e) => {
    if (e.pointerType === 'mouse' && !stage.contains(document.activeElement)) setActive(null);
  });

  stage.addEventListener('pointerdown', (e) => { pointerType = e.pointerType; });

  // Mouse: click an active quarter to enter it.
  // Touch: first tap reveals a quarter, second tap on it enters.
  stage.addEventListener('click', (e) => {
    if (e.target.closest('a')) return;
    const q = quarterAt(e.clientX, e.clientY);
    if (!q) {
      if (pointerType !== 'mouse') setActive(null);
      return;
    }
    if (pointerType === 'mouse' || q === active) {
      window.location.href = stage.querySelector(`.q[data-q="${q}"]`).href;
    } else {
      setActive(q);
    }
  });

  document.addEventListener('click', (e) => {
    if (pointerType !== 'mouse' && !stage.contains(e.target)) setActive(null);
  });

  // ---------- Keyboard ----------
  for (const label of labels) {
    label.addEventListener('focus', () => setActive(label.dataset.q));
    label.addEventListener('blur', () => {
      requestAnimationFrame(() => {
        if (!stage.contains(document.activeElement) && !stage.matches(':hover')) setActive(null);
      });
    });
  }
})();
