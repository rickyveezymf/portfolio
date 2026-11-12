// Background music and the sound control in the bottom-right corner.
// Calm plays on arrival. Hovering the speaker (tapping it on touch) opens a
// small panel with the credit and a mute option. With more than one track
// in TRACKS it also offers a switch, which starts the other from the top.
// Browsers block sound until the visitor interacts, so if autoplay is
// refused, the first click, tap or key press anywhere starts it.
(() => {
  const base = document.currentScript.src;
  const TRACKS = {
    calm:  { src: new URL('audio/calm.mp3', base).href,  credit: 'The Damned + Aphex Twin, edited' },
    // Taken off the site after testing; the file stays in assets/audio.
    // Uncomment to bring back the [chaos] option.
    // chaos: { src: new URL('audio/chaos.mp3', base).href, credit: 'Eyeless / Slipknot' },
  };
  const otherThan = (name) => Object.keys(TRACKS).find((n) => n !== name);
  const VOLUME = 0.7;
  const FADE_IN = 1200;  // first arrival
  const RESUME = 250;    // carrying on after moving between pages
  const SWITCH = 700;    // crossfade between versions, and mute
  const KEY = 'av-sound';

  const read = () => {
    try { return JSON.parse(sessionStorage.getItem(KEY)) || {}; } catch { return {}; }
  };
  const saved = read();
  const resuming = saved.track in TRACKS;
  let track = resuming ? saved.track : 'calm';
  let muted = resuming && saved.muted === true;
  let unlocked = false;  // playback has started at least once on this page
  let held = false;      // paused while a film plays (see AVSound below)

  const players = {};
  for (const [name, t] of Object.entries(TRACKS)) {
    const audio = new Audio();
    audio.loop = true;
    audio.preload = name === track ? 'auto' : 'none';
    audio.volume = 0;
    audio.src = t.src;
    players[name] = audio;
  }
  if (resuming) seek(players[track], saved.time);

  function seek(audio, time) {
    if (!(time > 0)) return;
    if (audio.readyState >= 1) audio.currentTime = time;
    else audio.addEventListener('loadedmetadata', () => { audio.currentTime = time; }, { once: true });
  }

  // ---------- Control ----------
  const sound = document.createElement('div');
  sound.className = 'sound';
  sound.innerHTML = `
    <button type="button" class="sound-icon">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 9.5 H7 L12 5 V19 L7 14.5 H3 Z"/>
        <g class="calm"><path d="M15.5 9.5 Q17.5 12 15.5 14.5"/><path d="M18 7 Q21.5 12 18 17"/></g>
        <g class="chaos"><path d="M15 12 L17 7 L19.2 17 L21.2 9 L22.5 12"/></g>
        <g class="off"><path d="M16 9.5 L21 14.5 M21 9.5 L16 14.5"/></g>
      </svg>
    </button>
    <div class="sound-panel" role="group" aria-label="Music">
      <span class="sound-credit"></span>
      <span class="sound-options">
        <button type="button" class="sound-swap"></button>
        <button type="button" class="sound-mute"></button>
      </span>
    </div>`;
  document.body.appendChild(sound);
  const icon = sound.querySelector('.sound-icon');
  const credit = sound.querySelector('.sound-credit');
  const swapButton = sound.querySelector('.sound-swap');
  const muteButton = sound.querySelector('.sound-mute');

  // Fine pointers hover to open the panel and click the speaker to mute.
  // Touch has no hover, so tapping the speaker opens and closes the panel.
  const canHover = matchMedia('(hover: hover) and (pointer: fine)');

  function render() {
    const waiting = !muted && !unlocked && !held;
    const t = TRACKS[track];
    const other = otherThan(track);
    sound.dataset.icon = muted ? 'off' : track;
    sound.classList.toggle('is-waiting', waiting);
    credit.textContent = muted ? 'Muted' : t.credit;
    swapButton.hidden = !other;
    if (other) {
      swapButton.textContent = other;
      swapButton.setAttribute('aria-label', `Play ${other} version: ${TRACKS[other].credit}`);
    }
    muteButton.textContent = muted ? 'Unmute' : 'Mute';
    if (canHover.matches) {
      icon.removeAttribute('aria-expanded');
      icon.setAttribute('aria-label', waiting ? 'Play music' : muted ? 'Unmute music' : 'Mute music');
    } else {
      icon.setAttribute('aria-expanded', String(sound.classList.contains('is-open')));
      icon.setAttribute('aria-label', 'Music options');
    }
  }

  // ---------- Playback ----------
  const fades = new Map();

  function fade(audio, to, ms, done) {
    cancelAnimationFrame(fades.get(audio));
    const from = audio.volume;
    const start = performance.now();
    const step = (now) => {
      const k = Math.min((now - start) / ms, 1);
      audio.volume = from + (to - from) * k;
      if (k < 1) fades.set(audio, requestAnimationFrame(step));
      else done?.();
    };
    fades.set(audio, requestAnimationFrame(step));
  }

  function apply(fadeIn = SWITCH) {
    for (const [name, audio] of Object.entries(players)) {
      if (name !== track || muted || held) {
        if (!audio.paused) fade(audio, 0, SWITCH, () => audio.pause());
        continue;
      }
      audio.preload = 'auto';
      audio.play().then(() => {
        if (name !== track || muted || held) return;
        unlocked = true;
        render();
        fade(audio, VOLUME, fadeIn);
      }, () => {
        if (name === track && !muted && !held && !unlocked) waitForGesture();
      });
    }
    render();
    save();
  }

  // Autoplay was refused: the first interaction anywhere starts the music.
  // Presses inside the control are handled by its own buttons instead.
  let waiting = false;
  function waitForGesture() {
    if (waiting) return;
    waiting = true;
    const events = ['pointerup', 'keydown'];
    const go = (e) => {
      if (sound.contains(e.target)) return;
      events.forEach((t) => removeEventListener(t, go, true));
      waiting = false;
      if (!muted && !held && !unlocked) apply(FADE_IN);
    };
    events.forEach((t) => addEventListener(t, go, true));
  }

  // ---------- Actions ----------
  swapButton.addEventListener('click', () => {
    if (!otherThan(track)) return;
    track = otherThan(track);
    muted = false;
    players[track].currentTime = 0;
    apply();
  });

  muteButton.addEventListener('click', () => {
    muted = !muted;
    apply(SWITCH);
  });

  icon.addEventListener('click', () => {
    const blocked = !muted && !unlocked;
    if (canHover.matches) {
      if (blocked) apply(FADE_IN);
      else { muted = !muted; apply(SWITCH); }
      return;
    }
    sound.classList.toggle('is-open');
    if (blocked) apply(FADE_IN);
    render();
  });

  // Mouse: once the pointer leaves, nothing should hold the panel open, so
  // drop any focus a click left on the buttons.
  sound.addEventListener('pointerleave', (e) => {
    if (e.pointerType !== 'mouse') return;
    if (sound.contains(document.activeElement)) document.activeElement.blur();
    if (sound.classList.contains('is-open')) {
      sound.classList.remove('is-open');
      render();
    }
  });

  // Touch: tapping anywhere else closes the panel.
  addEventListener('pointerdown', (e) => {
    if (sound.classList.contains('is-open') && !sound.contains(e.target)) {
      sound.classList.remove('is-open');
      render();
    }
  });

  // ---------- Carrying on across pages ----------
  function save() {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ track, muted, time: players[track].currentTime }));
    } catch {}
  }

  addEventListener('pagehide', save);

  // Coming back with the browser's back button can restore this page as it
  // was left, so pick up whatever the visitor chose on the other pages.
  addEventListener('pageshow', (e) => {
    if (!e.persisted) return;
    const s = read();
    if (s.track in TRACKS) {
      track = s.track;
      muted = s.muted === true;
    }
    for (const audio of Object.values(players)) {
      audio.pause();
      audio.volume = 0;
    }
    seek(players[track], s.time);
    apply(RESUME);
  });

  // The film viewer pauses the music while a film plays, then lets it go.
  // Muting in the meantime still holds once the film stops.
  window.AVSound = {
    hold() { held = true; apply(); },
    release() { if (!held) return; held = false; apply(RESUME); },
  };

  render();
  if (!muted) apply(resuming ? RESUME : FADE_IN);
})();
