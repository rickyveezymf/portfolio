// Moving between pages without reloading, so the music never stops.
// Links within the site are fetched and swapped in place: the new page's
// stylesheets, <html> and <body> attributes and body content replace the old,
// and the sound control stays where it is. Anything that goes wrong falls back
// to an ordinary page load.
window.AVNav = (() => {
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const cache = new Map();
  let controller = null;
  let current = location.pathname;
  let navId = 0;

  history.scrollRestoration = 'manual';

  // A link's .href re-resolves against the address bar, which changes on
  // every move, so remember each stylesheet's address as first loaded.
  const sheetUrl = (link) => (link.dataset.url ||= link.href);
  document.querySelectorAll('link[rel="stylesheet"]').forEach(sheetUrl);

  // Body has a data-q on section pages only.
  function mount() {
    controller?.abort();
    controller = new AbortController();
    const page = document.body.dataset.q ? 'section' : 'home';
    window.AVPages?.[page]?.(controller.signal);
  }

  const isPage = (url) =>
    url.origin === location.origin && /(\/|\.html)$/.test(url.pathname);

  function fetchPage(href) {
    if (!cache.has(href)) {
      cache.set(href, fetch(href).then((res) => {
        if (!res.ok || !(res.headers.get('content-type') || '').includes('text/html')) throw new Error(res.status);
        return res.text();
      }));
      cache.get(href).catch(() => cache.delete(href));
    }
    return cache.get(href);
  }

  // Loads the new page's stylesheets switched off, so nothing on the old page
  // changes until the swap.
  function prepareStyles(doc, url) {
    const want = [...doc.querySelectorAll('link[rel="stylesheet"]')]
      .map((l) => new URL(l.getAttribute('href'), url).href);
    const have = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const links = [];
    const loads = [];
    for (const href of want) {
      let link = have.find((l) => sheetUrl(l) === href);
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.media = 'not all';
        link.href = href;
        link.dataset.url = href;
        loads.push(new Promise((done) => { link.onload = link.onerror = done; }));
        document.head.appendChild(link);
      }
      links.push(link);
    }
    return Promise.all(loads).then(() => ({ links, stale: have.filter((l) => !links.includes(l)) }));
  }

  function copyAttributes(from, to) {
    for (const a of [...to.attributes]) to.removeAttribute(a.name);
    for (const a of from.attributes) to.setAttribute(a.name, a.value);
  }

  function swap(doc, url, push, scroll, styles) {
    controller?.abort();
    if (push) history.pushState({}, '', url.href);
    current = url.pathname;

    // New sheets come in after the shared ones, which is the order every
    // page already uses (icons.css first, sound.css only styles .sound).
    for (const link of styles.links) link.removeAttribute('media');
    styles.stale.forEach((l) => l.remove());

    document.title = doc.title;
    copyAttributes(doc.documentElement, document.documentElement);

    const sound = document.querySelector('body > .sound');
    doc.body.querySelectorAll('script').forEach((s) => s.remove());
    copyAttributes(doc.body, document.body);
    document.body.replaceChildren(...doc.body.childNodes);
    if (sound) document.body.appendChild(sound);

    mount();

    const target = url.hash && document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (target) target.scrollIntoView();
    else scrollTo(0, scroll);

    // Tell screen readers where they are.
    const heading = document.querySelector('h1');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    }
  }

  async function go(href, push = true, scroll = 0) {
    const url = new URL(href, location.href);
    const mine = ++navId;
    try {
      const html = await fetchPage(url.origin + url.pathname);
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const styles = await prepareStyles(doc, url);
      if (mine !== navId) return;
      if (push) history.replaceState({ scroll: scrollY }, '');
      const run = () => swap(doc, url, push, scroll, styles);
      if (document.startViewTransition && !reduceMotion.matches) document.startViewTransition(run);
      else run();
    } catch {
      location.href = url.href;
    }
  }

  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest('a[href]');
    if (!a || (a.target && a.target !== '_self') || a.hasAttribute('download')) return;
    const url = new URL(a.href);
    if (!isPage(url)) return;
    // Same page: let the browser handle #anchors; otherwise stay put.
    if (url.pathname === current) {
      if (!url.hash) e.preventDefault();
      return;
    }
    e.preventDefault();
    go(url.href);
  });

  // Start fetching on hover, so the page is usually ready by the click.
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const url = new URL(a.href);
    if (isPage(url) && url.pathname !== current) fetchPage(url.origin + url.pathname).catch(() => {});
  });

  addEventListener('popstate', (e) => {
    if (location.pathname === current) return;  // only the #anchor changed
    go(location.href, false, e.state?.scroll || 0);
  });

  mount();
  return { go };
})();
