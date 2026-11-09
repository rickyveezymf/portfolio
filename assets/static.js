// Ball of static: each tick, every line becomes a fresh random scribble through
// points inside a disk, so together they read as a ball that never sits still.
// Shared by the homepage misc icon and the section pages.
window.AVStatic = (() => {
  const RADIUS = 10.5;
  const POINTS = 12;
  const TICK = 70; // ms, a stepped TV-static rate rather than smooth motion
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function scribble() {
    const p = [];
    for (let i = 0; i < POINTS; i++) {
      const r = RADIUS * Math.sqrt(Math.random());
      const a = Math.random() * Math.PI * 2;
      p.push([r * Math.cos(a), r * Math.sin(a)]);
    }
    // Catmull-Rom through the points, as cubic Beziers.
    const f = (v) => v.toFixed(2);
    let d = `M${f(p[0][0])} ${f(p[0][1])}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
    }
    return d;
  }

  function draw(lines) {
    for (const line of lines) line.setAttribute('d', scribble());
  }

  // Draws once, then keeps redrawing unless motion is reduced.
  // Returns a function that stops it.
  function run(lines) {
    draw(lines);
    if (reduceMotion.matches) return () => {};
    const timer = setInterval(() => draw(lines), TICK);
    return () => clearInterval(timer);
  }

  return { draw, run };
})();
