/* =========================================================================
   VESPERA — motion layer
   GSAP 3 + ScrollTrigger + Lenis. Slow, scrubbed to scroll, structural.
   Nothing bounces. Only power / expo easing appears in this file — no
   back / elastic / bounce anywhere. More motion means motion in more
   PLACES, never faster or louder motion.
   ========================================================================= */

import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import site from '../config/site.config.js';
import { roomsFor, plateRect, doorPath, balconyLines, glazingLines, labelSize, labelPos, DIM_OFF } from '../lib/plan.js';

gsap.registerPlugin(ScrollTrigger);

const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* -------------------------------------------------------------------------
   Lenis smooth scroll — one loop, wired into gsap.ticker.
   ------------------------------------------------------------------------- */
let lenis = null;
if (!REDUCE) {
  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* -------------------------------------------------------------------------
   Helpers
   ------------------------------------------------------------------------- */
const q = (s, r = document) => r.querySelector(s);
const qa = (s, r = document) => [...r.querySelectorAll(s)];

// With `vector-effect: non-scaling-stroke` the dash pattern is evaluated in
// DEVICE space while getTotalLength() reports USER units. Under a stretched
// viewBox those differ, and a "drawn" line renders as repeating dashes. So
// measure the real device-space length through the element's own scale.
function deviceLength(el, sx, sy) {
  const len = el.getTotalLength();
  if (!len) return 0;
  const steps = 48;
  let total = 0;
  let prev = el.getPointAtLength(0);
  for (let i = 1; i <= steps; i++) {
    const pt = el.getPointAtLength((len * i) / steps);
    total += Math.hypot((pt.x - prev.x) * sx, (pt.y - prev.y) * sy);
    prev = pt;
  }
  return total;
}

function svgScale(svg) {
  if (!svg) return { sx: 1, sy: 1 };
  const vb = svg.viewBox.baseVal;
  const r = svg.getBoundingClientRect();
  if (!vb || !vb.width || !vb.height || !r.width) return { sx: 1, sy: 1 };
  return { sx: r.width / vb.width, sy: r.height / vb.height };
}

function primeDash(el, scale) {
  const s = scale || { sx: 1, sy: 1 };
  let len;
  try {
    len = Math.max(el.getTotalLength(), deviceLength(el, s.sx, s.sy));
  } catch (e) {
    return 0;
  }
  el.style.strokeDasharray = len;
  el.style.strokeDashoffset = len;
  return len;
}

function clearDash(els) {
  els.forEach((el) => {
    el.style.strokeDasharray = '';
    el.style.strokeDashoffset = '';
  });
}

// Manual line split (no paid SplitText). Wraps each measured line in an
// overflow-hidden block whose inner block animates y 100% -> 0.
function splitLines(el) {
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = '';
  const wordSpans = words.map((w) => {
    const s = document.createElement('span');
    s.textContent = w;
    s.style.display = 'inline-block';
    el.append(s, document.createTextNode(' '));
    return s;
  });

  const lines = [];
  let current = [];
  let top = null;
  wordSpans.forEach((s) => {
    const t = s.offsetTop;
    if (top === null || Math.abs(t - top) < 2) current.push(s);
    else {
      lines.push(current);
      current = [s];
    }
    top = t;
  });
  if (current.length) lines.push(current);

  el.textContent = '';
  const inners = [];
  lines.forEach((lineWords) => {
    const mask = document.createElement('span');
    mask.style.display = 'block';
    mask.style.overflow = 'hidden';
    const inner = document.createElement('span');
    inner.style.display = 'block';
    inner.textContent = lineWords.map((w) => w.textContent).join(' ');
    mask.appendChild(inner);
    el.appendChild(mask);
    inners.push(inner);
  });
  return inners;
}

/* -------------------------------------------------------------------------
   Boot: loader first, everything else once fonts are ready.
   ------------------------------------------------------------------------- */
function build() {
  // The pinned elevation adds scroll length to the page. It must be created
  // FIRST and carry a higher refreshPriority, or every trigger below it
  // measures against pre-pin positions and fires ~1 pin-length too early.
  elevationBuild();

  navIntro();
  globalProgress();
  navHideShow();
  navUnderlines();
  navColourSwap();
  sectionPush();

  imageSettle();
  bleedDrift();
  typeReveal();
  materialsSection();
  philosophy();

  locationBuild();
  residencesTable();
  sectionDrawingMotion();
  finishScheduleMotion();
  residencesTitleBlockMotion();
  amenities();
  enquire();
  enquireFinePrint();
  parallax();

  ScrollTrigger.refresh();
}

/* --- Loader: the monogram constructs itself while a counter reports real
   asset progress. Then the whole thing lifts. Once per session. --------- */
function loader() {
  const el = q('[data-loader]');
  const done = () => {
    try {
      sessionStorage.setItem('vespera:seen', '1');
    } catch (e) {
      /* private mode */
    }
    heroIntro();
  };

  // already seen this session (set on <html> before first paint) — skip
  // the whole sequence instantly, no flash, no replay.
  if (document.documentElement.getAttribute('data-loaded') === 'true') {
    if (el) el.style.display = 'none';
    done();
    return;
  }

  if (!el) {
    done();
    return;
  }
  if (REDUCE) {
    el.style.display = 'none';
    done();
    return;
  }

  const wordmark = q('[data-loader-wordmark]', el);
  const scale = svgScale(q('.monogram', el));
  const strokes = qa('.mono-stroke', el);
  const crossbar = q('.mono-crossbar', el);
  const count = q('[data-loader-count]', el);
  [...strokes, crossbar].forEach((sEl) => sEl && primeDash(sEl, scale));

  // real asset load progress
  const imgs = qa('img');
  let loaded = 0;
  const total = Math.max(imgs.length, 1);
  const progress = { v: 0 };
  const bump = () => {
    loaded += 1;
    gsap.to(progress, {
      v: Math.round((loaded / total) * 100),
      duration: 0.5,
      ease: 'power2.out',
      onUpdate: () => count && (count.textContent = String(Math.round(progress.v)).padStart(3, '0')),
    });
  };
  imgs.forEach((img) => {
    if (img.complete) bump();
    else {
      img.addEventListener('load', bump, { once: true });
      img.addEventListener('error', bump, { once: true });
    }
  });


  const tl = gsap.timeline();
  // the two strokes draw down to their meeting point, the crossbar last
  tl.to(strokes, { strokeDashoffset: 0, duration: 0.9, ease: 'power2.out', stagger: 0.12 }, 0);
  tl.to(crossbar, { strokeDashoffset: 0, duration: 0.6, ease: 'power2.out' }, 0.75);
  tl.to(count, { opacity: 1, duration: 0.4, ease: 'power2.out' }, 0.2);
  
  if (wordmark) {
    tl.to(wordmark, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }, 0.5);
  }

  // hold until assets report in, then lift
  tl.add(() => {}, '+=0.4');
  tl.call(
    () => {
      const finish = () => {
        gsap
          .timeline({
            onComplete: () => {
              el.style.display = 'none';
              done();
            },
          })
          .to([q('.monogram', el), count, wordmark], { opacity: 0, duration: 0.5, ease: 'power2.out' })
          .to(el, { opacity: 0, duration: 0.7, ease: 'power2.inOut' }, 0.2);
      };
      if (loaded >= total) finish();
      else {
        const check = setInterval(() => {
          if (loaded >= total) {
            clearInterval(check);
            finish();
          }
        }, 120);
        setTimeout(() => {
          clearInterval(check);
          finish();
        }, 4000); // never trap the user behind a stalled asset
      }
    },
    null,
    '+=0.1'
  );
}

/* --- Hero: the curtain lift. Owns the hero frame's scale entirely. ------ */
function heroIntro() {
  const img = q('.hero__img');
  if (!img || REDUCE) return;
  gsap.fromTo(img, { scale: 1.12 }, { scale: 1.0, duration: 2.4, ease: 'power3.out' });
}

/* --- Nav intro: fade in on load, then never animate opacity again ------- */
function navIntro() {
  const items = qa('.nav-brand, .nav-link');
  if (REDUCE) {
    gsap.set(items, { opacity: 1 });
    return;
  }
  gsap.from(items, { opacity: 0, duration: 0.8, ease: 'power2.out', stagger: 0.06, delay: 0.15 });
}

/* --- Global Progress: Vertical line reporting scroll progression ------ */
function globalProgress() {
  const bar = q('[data-global-progress]');
  const text = q('[data-global-progress-text]');
  if (!bar) return;
  if (REDUCE) {
    gsap.set(bar, { scaleY: 1 });
    return;
  }
  
  const sections = qa('.section');
  
  gsap.fromTo(
    bar,
    { scaleY: 0 },
    { scaleY: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.4 } }
  );
  
  sections.forEach((sec, idx) => {
    ScrollTrigger.create({
      trigger: sec,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) => {
        if (self.isActive && text) {
          text.textContent = String(idx + 1).padStart(2, '0');
        }
      }
    });
  });
}

/* --- Nav hides on scroll down, returns on scroll up --------------------- */
function navHideShow() {
  const nav = q('[data-nav]');
  if (!nav || REDUCE) return;
  // Compare against the last scroll position rather than trusting
  // self.direction, which does not reliably flip on programmatic jumps.
  let hidden = false;
  let last = window.scrollY;
  ScrollTrigger.create({
    start: 0,
    end: 'max',
    onUpdate: (self) => {
      const y = self.scroll();
      const delta = y - last;
      if (Math.abs(delta) < 2) return; // ignore jitter
      last = y;
      const past = y > window.innerHeight * 0.5;
      const shouldHide = delta > 0 && past;
      if (shouldHide === hidden) return;
      hidden = shouldHide;
      gsap.to(nav, {
        yPercent: hidden ? -100 : 0,
        duration: 0.4,
        ease: 'power2.out',
        overwrite: true,
      });
    },
  });
}

/* --- Active nav underline: width animates in/out per section ------------ */
function navUnderlines() {
  qa('[data-nav-link]').forEach((link) => {
    const id = link.getAttribute('data-nav-link');
    const section = document.getElementById(id);
    const ul = q('[data-nav-ul]', link);
    if (!section || !ul) return;

    if (REDUCE) {
      ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onToggle: (self) => gsap.set(ul, { scaleX: self.isActive ? 1 : 0 }),
      });
      return;
    }

    ScrollTrigger.create({
      trigger: section,
      start: 'top center',
      end: 'bottom center',
      onToggle: (self) =>
        gsap.to(ul, {
          scaleX: self.isActive ? 1 : 0,
          duration: 0.5,
          ease: 'power2.out',
          overwrite: true,
        }),
    });
  });
}

/* --- Nav colour inverts over each full-bleed section -------------------
   Geometry-based: robust to pinned sections and scroll jumps in a way
   sequential onToggle callbacks are not. --------------------------------- */
function navColourSwap() {
  const root = document.documentElement;
  const bleeds = qa('[data-bleed]');
  const NAV_BAND = 56;

  const update = () => {
    const light = bleeds.some((s) => {
      const r = s.getBoundingClientRect();
      return r.top <= NAV_BAND && r.bottom > NAV_BAND;
    });
    root.style.setProperty('--nav-color', light ? 'var(--bone)' : 'var(--charcoal)');
  };

  // scroll-driven, not a perpetual per-frame RAF loop: this only reads
  // layout when the page actually moves, at rest or in motion alike.
  update();
  ScrollTrigger.create({ start: 0, end: 'max', onUpdate: update, onRefresh: update });
}

/* --- Section push: outgoing section travels at 0.92x, 8% max offset ----- */
function sectionPush() {
  if (REDUCE) return;
  const mm = gsap.matchMedia();
  mm.add('(min-width: 769px)', () => {
    qa('main .section').forEach((sec) => {
      // the pinned elevation manages its own scroll space
      if (sec.classList.contains('sitesection') || sec.classList.contains('residences')) return;
      const inner = sec.firstElementChild;
      if (!inner) return;
      // 0.90x scroll speed = the leaving section LAGS (translates down 10%
      // relative to scroll) and the incoming section rides over it.
      gsap.fromTo(
        sec,
        { yPercent: 0 },
        {
          yPercent: 10,
          ease: 'none',
          scrollTrigger: {
            trigger: sec,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
      // the incoming section is masked from its own top edge
      if (inner) {
        gsap.fromTo(
          sec,
          { clipPath: 'inset(0% 0% 100% 0%)' },
          {
            clipPath: 'inset(0% 0% 0% 0%)',
            ease: 'none',
            scrollTrigger: {
              trigger: sec,
              start: 'top bottom',
              end: 'top top',
              scrub: true,
            }
          }
        );
      }
    });
  });
}

/* --- Image entry: non-bleed frames settle 1.06 -> 1.0, scrubbed --------- */
function imageSettle() {
  qa('.frame').forEach((frame) => {
    if (frame.closest('[data-bleed]')) return; // bleed frames drift instead
    if (REDUCE) {
      gsap.set(frame, { scale: 1 });
      return;
    }
    gsap.fromTo(
      frame,
      { scale: 1.06 },
      {
        scale: 1,
        ease: 'power2.out',
        scrollTrigger: {
          trigger: frame.closest('.section'),
          start: 'top bottom',
          end: 'top top',
          scrub: true,
        },
      }
    );
  });
}

/* --- Full-bleed frames: slow continuous drift 1.0 -> 1.04, scrubbed ----- */
function bleedDrift() {
  qa('[data-bleed] .frame').forEach((frame) => {
    if (REDUCE) {
      gsap.set(frame, { scale: 1 });
      return;
    }
    // the hero's own intro settles it to 1.0 first; the drift picks up there
    gsap.fromTo(
      frame,
      { scale: 1.0 },
      {
        scale: 1.03,
        ease: 'none',
        scrollTrigger: {
          trigger: frame.closest('.section'),
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

/* --- Type reveal: masked line-by-line ---------------------------------- */
function typeReveal() {
  qa('[data-reveal]').forEach((el) => {
    const inners = splitLines(el);
    if (REDUCE) {
      gsap.set(inners, { yPercent: 0 });
      return;
    }

    // Content that is ALREADY on screen the moment this runs (hero copy,
    // typically) must not wait on a scroll-position trigger at all: the
    // 88%-down-the-viewport line is a fixed pixel threshold, and hero text
    // sitting lower in its frame (below that line but still fully visible)
    // would sit invisible until the user scrolled a few pixels first — with
    // nothing on screen hinting anything was ever there to reveal. Anything
    // already inside the viewport plays immediately; only content that
    // starts below the fold waits for its scroll trigger.
    const r = el.getBoundingClientRect();
    const already = r.top < window.innerHeight && r.bottom > 0;
    gsap.from(inners, {
      yPercent: 100,
      duration: 0.9,
      ease: 'power3.out',
      stagger: 0.08,
      ...(already
        ? {}
        : { scrollTrigger: { trigger: el, start: 'top 88%' } }),
    });
  });
}

/* --- Section 03: Tactile Materials. The layers drift against each other 
   at different speeds to create spatial depth. -------------------------- */
function materialsSection() {
  const section = q('.materials');
  if (!section) return;

  const plateMask = q('[data-mat-plate-mask]', section);
  const plateImg = q('[data-mat-plate-img]', section);
  const detail = q('[data-mat-detail]', section);
  const detailMask = q('[data-mat-detail-mask]', section);
  const detailImg = q('[data-mat-detail-img]', section);
  const caps = qa('.mat-cap', section);
  const keyRows = qa('[data-mat-key-row]', section);
  const titleRule = q('[data-mat-titlerule]', section);
  const title = q('.materials__title', section);

  if (REDUCE) {
    gsap.set([plateMask, detailMask].filter(Boolean), { clipPath: 'inset(0% 0% 0% 0%)' });
    if (titleRule) gsap.set(titleRule, { scaleX: 1 });
    if (title) gsap.set(title, { opacity: 1 });
    return;
  }

  const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 78%' } });

  // the plate is uncovered from its lower edge while the photograph settles
  // out of a slight overscale — one continuous move, no fade
  if (plateMask) {
    tl.fromTo(
      plateMask,
      { clipPath: 'inset(0% 0% 100% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, ease: 'power3.out' },
      0
    );
  }
  if (plateImg) tl.fromTo(plateImg, { scale: 1.12 }, { scale: 1, duration: 1.7, ease: 'power3.out' }, 0);

  // the detail callout lands after the plate it belongs to
  if (detailMask) {
    tl.fromTo(
      detailMask,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.0, ease: 'power3.out' },
      0.55
    );
  }
  if (detail) tl.from(detail, { y: '2cqh', duration: 1.0, ease: 'power3.out' }, 0.55);

  if (caps.length) tl.from(caps, { opacity: 0, duration: 0.6, ease: 'power2.out', stagger: 0.18 }, 0.95);
  if (keyRows.length) {
    tl.fromTo(
      keyRows,
      { clipPath: 'inset(0% 100% 0% 0%)' },
      { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'power3.out', stagger: 0.1 },
      1.15
    );
  }
  if (title) tl.from(title, { opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.2);
  if (titleRule) tl.fromTo(titleRule, { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'power3.out' }, 0.35);

  // Two plates drifting at different rates against a still ground: the
  // detail travels faster than the plate it is cut from, so the pair reads
  // with depth as the section passes.
  gsap.matchMedia().add('(min-width: 769px)', () => {
    const drift = (el, from, to) => {
      if (!el) return;
      gsap.fromTo(
        el,
        { yPercent: from },
        {
          yPercent: to,
          ease: 'none',
          scrollTrigger: { trigger: section, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    };
    drift(plateImg, -6, 6);
    drift(detail, 8, -8);
    drift(q('[data-mat-copy]', section), 10, -10);
  });
}

/* --- Philosophy (03): lines stagger 0.15, each rule draws just after ---- */
function philosophy() {
  const items = qa('[data-phil-item]');
  if (!items.length) return;

  items.forEach((item, i) => {
    const line = q('[data-phil-line]', item);
    const rule = q('[data-phil-rule]', item);
    const inners = line ? splitLines(line) : [];

    if (REDUCE) {
      gsap.set(inners, { yPercent: 0 });
      gsap.set(rule, { scaleX: 1 });
      return;
    }

    const tl = gsap.timeline({
      scrollTrigger: { trigger: '.materials', start: 'top 85%' },
      delay: i * 0.15,
    });
    tl.from(inners, { yPercent: 100, duration: 0.9, ease: 'power3.out', stagger: 0.08 }, 0);
    // the rule lands just after its text finishes
    if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 0.6, ease: 'power3.out' }, 0.5);
  });
}

/* =========================================================================
   SECTION 02 — the SITE SECTION builds itself, pinned and scrubbed.
     0-20%   terrain draws (pen accelerating), then the cut hatch fills
     20-30%  the sea draws in from the right, waterlines follow
             ...0.15s hold. Silence before the settlement begins.
     30-70%  villas settle top-down; crest villas settle slower than the
             ones near the sea — removes mechanical uniformity
     70-80%  coastal pines
     80-85%  level markers draw out to meet the terrain
     85-90%  RESIDENCE 05 fills bronze, its leader and label reveal
     90-100% the drawing is annotated and signed
   ========================================================================= */
function elevationBuild() {
  const section = q('.sitesection');
  const svg = q('.sitesvg');
  if (!section || !svg) return;

  const terrain = q('.ss-terrain', svg);
  const hatch = qa('.ss-hatch line', svg);
  const retaining = qa('.ss-retaining line', svg);
  const waterline = q('.ss-waterline', svg);
  const water = qa('.ss-water', svg);
  const villaGroups = qa('.ss-villa', svg).sort(
    (a, b) => +a.getAttribute('data-villa') - +b.getAttribute('data-villa')
  );
  const pines = qa('.ss-pine', svg);
  const levels = qa('.ss-level', svg);
  const heroFill = q('.ss-heroFill', svg);
  const heroLeader = q('[data-hero-leader]', svg);
  const heroDot = q('[data-hero-dot]', svg);
  const capClip = q('[data-cap-clip]', svg);
  const annoItems = qa('.ss-annoItem', svg);

  const heroVilla = q('.ss-villa--hero', svg);

  if (REDUCE) {
    gsap.set([...hatch, ...pines, ...levels, ...annoItems, heroLeader, heroDot], { opacity: 1 });
    gsap.set(heroFill, { scaleX: 1 });
    if (capClip) capClip.setAttribute("width", 300);
    villaInteractions(villaGroups, levels, svg);
    return;
  }

  const scale = svgScale(svg);
  const dashables = [terrain, waterline, ...water, ...retaining].filter(Boolean);
  villaGroups.forEach((g) => dashables.push(...qa('.ss-roof, .ss-body, .ss-mullions line, .ss-terrace', g)));
  pines.forEach((g) => dashables.push(...qa('path', g)));
  levels.forEach((g) => dashables.push(...qa('line', g)));
  dashables.push(heroLeader);
  dashables.forEach((el) => primeDash(el, scale));

  gsap.set(hatch, { opacity: 0 });
  gsap.set(heroFill, { scaleX: 0, transformOrigin: 'left center' });
  gsap.set(heroDot, { opacity: 0 });
  gsap.set(qa('.ss-level text', svg), { opacity: 0 });
  gsap.set(annoItems, { opacity: 0 });
  if (capClip) capClip.setAttribute('width', 0);

  const mm = gsap.matchMedia();
  const make = (pinPct) => () => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '+=' + pinPct + '%',
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1,
      },
    });

    // 0-8% — the pen accelerates into the terrain, then settles to linear
    tl.to(terrain, { strokeDashoffset: 0, duration: 0.06, ease: 'power1.in' }, 0);
    tl.to(retaining, { strokeDashoffset: 0, duration: 0.02, ease: 'power3.out', stagger: 0.002 }, 0.05);
    tl.to(hatch, { opacity: 1, duration: 0.03, ease: 'power2.inOut', stagger: 0.001 }, 0.06);

    // 8-12% — the sea
    tl.to(waterline, { strokeDashoffset: 0, duration: 0.02, ease: 'power3.out' }, 0.08);
    tl.to(water, { strokeDashoffset: 0, duration: 0.03, ease: 'power3.out', stagger: 0.004 }, 0.09);

    // hold
    tl.to({}, { duration: 0.01 }, 0.11);

    // 12-30% — villas settle.
    const slot = 0.18 / villaGroups.length;
    villaGroups.forEach((g, i) => {
      const at = 0.12 + i * slot;
      const f = 0.9 - (i / (villaGroups.length - 1)) * 0.2; // 0.9 -> 0.7
      const roof = q('.ss-roof', g);
      const body = q('.ss-body', g);
      const mull = qa('.ss-mullions line', g);
      const terr = qa('.ss-terrace', g);
      tl.to(roof, { strokeDashoffset: 0, duration: slot * 0.8 * f, ease: 'power3.out' }, at);
      tl.to(body, { strokeDashoffset: 0, duration: slot * 0.9 * f, ease: 'power3.out' }, at + slot * 0.28);
      tl.to(mull, { strokeDashoffset: 0, duration: slot * 0.7 * f, ease: 'power3.out', stagger: slot * 0.05 }, at + slot * 0.52);
      tl.to(terr, { strokeDashoffset: 0, duration: slot * 0.8 * f, ease: 'power3.out' }, at + slot * 0.7);
    });

    // 30-36% — pines
    tl.to(
      pines.flatMap((g) => qa('path', g)),
      { strokeDashoffset: 0, duration: 0.06, ease: 'power3.out', stagger: 0.008 },
      0.30
    );

    // 36-40% — level markers run out to meet the terrain
    levels.forEach((g, i) => {
      const at = 0.36 + i * (0.04 / levels.length);
      tl.to(qa('line', g), { strokeDashoffset: 0, duration: 0.02, ease: 'power3.out' }, at);
      tl.to(q('text', g), { opacity: 1, duration: 0.016, ease: 'power2.inOut' }, at + 0.01);
    });

    // 40-45% — the headland villa lands
    tl.to(heroFill, { scaleX: 1, duration: 0.04, ease: 'power2.inOut' }, 0.40);
    tl.to(heroLeader, { strokeDashoffset: 0, duration: 0.025, ease: 'power3.out' }, 0.41);
    tl.to(heroDot, { opacity: 1, duration: 0.012, ease: 'power2.inOut' }, 0.43);
    tl.to(capClip, { attr: { width: 300 }, duration: 0.032, ease: 'power3.out' }, 0.42);

    // 45-55% — the drawing is annotated and signed
    tl.to(annoItems, { opacity: 1, duration: 0.05, ease: 'power2.inOut', stagger: 0.008 }, 0.45);

    return () => {};
  };

  mm.add('(min-width: 769px)', make(130));
  mm.add('(max-width: 768px)', make(90));

  villaInteractions(villaGroups, levels, svg);
}

/* --- The section becomes the site's navigation ---------------------------
   Hover isolates and annotates a villa; click scrubs section 06 to the
   matching residence type. Hover is desktop-only; touch navigates directly.
   ----------------------------------------------------------------------- */
function villaInteractions(villaGroups, levels, svg) {
  const data = site.section.villaData || [];
  const types = site.residences;
  const anno = q('[data-villa-anno]', svg);
  const aLead = q('[data-va-lead]', svg);
  const aDot = q('[data-va-dot]', svg);
  const aName = q('[data-va-name]', svg);
  const aLevel = q('[data-va-level]', svg);
  const aMeta = q('[data-va-meta]', svg);
  if (!villaGroups.length) return;

  // scrub section 06 to the residence this villa is an instance of
  const goToResidence = (typeIndex) => {
    const target = document.getElementById('residences');
    if (!target) return;
    const st = ScrollTrigger.getById('residences');
    let y;
    if (st) {
      const span = st.end - st.start;
      y = st.start + (typeIndex / Math.max(1, types.length - 1)) * span * 0.98;
    } else {
      y = target.getBoundingClientRect().top + window.scrollY;
    }
    if (lenis) lenis.scrollTo(y, { duration: 1.4 });
    else window.scrollTo({ top: y, behavior: 'smooth' });
  };

  villaGroups.forEach((g, i) => {
    const d = data[i];
    if (!d) return;
    const type = types[d.type - 1];
    g.style.cursor = 'pointer';
    g.setAttribute('role', 'link');
    g.setAttribute('tabindex', '0');

    const activate = () => goToResidence(d.type - 1);
    g.addEventListener('click', activate);
    g.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        activate();
      }
    });
  });

  if (REDUCE) return;

  const mm = gsap.matchMedia();
  mm.add('(min-width: 1024px)', () => {
    const heroGroup = villaGroups.find((g) => g.classList.contains('ss-villa--hero'));

    // the standing RESIDENCE 05 caption occupies the same region as the hover
    // annotation, so the two are cross-faded rather than allowed to collide
    const caption = q('[data-ss-caption]', svg);

    const clear = () => {
      gsap.to(villaGroups, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
      villaGroups.forEach((g) => g.classList.remove('is-focus'));
      levels.forEach((l) => l.classList.remove('is-bronze'));
      gsap.to(anno, { opacity: 0, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
      if (caption) gsap.to(caption, { opacity: 1, duration: 0.3, ease: 'power2.out', overwrite: 'auto' });
    };

    villaGroups.forEach((g, i) => {
      const d = data[i];
      if (!d) return;
      const type = types[d.type - 1];

      const enter = () => {
        // this villa sharpens, the rest recede — the drawing focuses
        villaGroups.forEach((o) => o.classList.remove('is-focus'));
        g.classList.add('is-focus');
        gsap.to(
          villaGroups.filter((o) => o !== g),
          { opacity: 0.45, duration: 0.3, ease: 'power2.out', overwrite: 'auto' }
        );
        gsap.to(g, { opacity: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });

        // nearest level marker goes bronze
        const body = q('.ss-body', g);
        const by = parseFloat(body.getAttribute('y'));
        let best = 0;
        let bestD = Infinity;
        levels.forEach((l, li) => {
          const ly = parseFloat(q('.ss-leader', l).getAttribute('y1'));
          const dist = Math.abs(ly - by);
          if (dist < bestD) {
            bestD = dist;
            best = li;
          }
        });
        levels.forEach((l, li) => l.classList.toggle('is-bronze', li === best));

        // annotation, cross-fading in place
        const bx = parseFloat(body.getAttribute('x'));
        const bw = parseFloat(body.getAttribute('width'));
        const ax = bx + bw + 26;
        const ay = by - 26;
        aLead.setAttribute('x1', bx + bw);
        aLead.setAttribute('y1', by + 4);
        aLead.setAttribute('x2', ax - 4);
        aLead.setAttribute('y2', ay + 6);
        aDot.setAttribute('cx', bx + bw);
        aDot.setAttribute('cy', by + 4);
        [aName, aLevel, aMeta].forEach((t) => t.setAttribute('x', ax));
        aName.setAttribute('y', ay);
        aLevel.setAttribute('y', ay + 12);
        aMeta.setAttribute('y', ay + 23);
        aName.textContent = d.name;
        aLevel.textContent = d.level;
        aMeta.textContent = type.area + ' ' + site.units.area + '  ·  ' + d.aspect;

        // the hero villa already carries its own standing caption with the
        // same information (name, level, aspect) at a nearby position — the
        // hover annotation would duplicate and overlap it, so it is skipped
        // there rather than crossfading two labels that say the same thing
        if (g === heroGroup) {
          gsap.to(anno, { opacity: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
        } else {
          gsap.to(anno, { opacity: 1, duration: 0.25, ease: 'power2.out', overwrite: 'auto' });
        }
        if (caption && g !== heroGroup) {
          gsap.to(caption, { opacity: 0, duration: 0.2, ease: 'power2.out', overwrite: 'auto' });
        }
      };

      g.addEventListener('mouseenter', enter);
      g.addEventListener('focus', enter);
    });

    const stage = q('.sitesection__stage');
    if (stage) stage.addEventListener('mouseleave', clear);

    return () => {
      clear();
    };
  });
}

/* =========================================================================
   SECTION 05 — the map draws itself, scrubbed.
   Coast · roads by tier · furniture · pins in geographic order.
   ========================================================================= */
function locationBuild() {
  const loc = q('.location');
  if (!loc) return;

  const svg = q('.map', loc);
  const coast = qa('.map-coast', loc);
  const water = qa('.map-water', loc);
  const arterial = qa('.map-arterial', loc);
  const secondary = qa('.map-secondary', loc);
  const minor = qa('.map-minor', loc);
  const creek = qa('.map-creek', loc);
  const greens = qa('.map-green', loc);
  const furniture = qa('[data-furniture]', loc);
  const pulse = q('[data-pulse]', loc);

  // geographic order, north to south, with the bronze VESPERA pin last
  const pins = qa('[data-pin]', loc).sort((a, b) => {
    const ap = a.getAttribute('data-primary') ? 1 : 0;
    const bp = b.getAttribute('data-primary') ? 1 : 0;
    if (ap !== bp) return ap - bp;
    return parseFloat(a.style.top) - parseFloat(b.style.top);
  });

  if (REDUCE) {
    gsap.set([...pins, ...furniture, ...water, ...greens], { opacity: 1 });
    return;
  }

  const scale = svgScale(svg);
  [...coast, ...water, ...arterial, ...secondary, ...minor, ...creek].forEach((p) => primeDash(p, scale));
  if (greens.length) gsap.set(greens, { opacity: 0 });
  
  gsap.set(furniture, { opacity: 0 });
  gsap.set(pins, { opacity: 0, scale: 0.7, transformOrigin: 'left center' });

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: loc,
      // completes as the section settles into view, not as it leaves
      start: 'top 88%',
      end: 'top 12%',
      scrub: true,
    },
  });

  tl.to(coast, { strokeDashoffset: 0, duration: 0.16, ease: 'none' }, 0);
  tl.to(water, { strokeDashoffset: 0, duration: 0.14, ease: 'none', stagger: 0.02 }, 0.14);
  
  tl.to(arterial, { strokeDashoffset: 0, duration: 0.16, ease: 'none', stagger: 0.03 }, 0.18);
  tl.to(secondary, { strokeDashoffset: 0, duration: 0.14, ease: 'none', stagger: 0.025 }, 0.36);
  tl.to(minor, { strokeDashoffset: 0, duration: 0.12, ease: 'none', stagger: 0.02 }, 0.52);
  tl.to(creek, { strokeDashoffset: 0, duration: 0.12, ease: 'none' }, 0.5);
  if (greens.length) tl.to(greens, { opacity: 1, duration: 0.1, ease: 'none', stagger: 0.03 }, 0.46);
  tl.to(furniture, { opacity: 1, duration: 0.06, ease: 'none', stagger: 0.03 }, 0.66);
  // survey markers settle into place — a scale-settle, never a slide-up
  tl.to(pins, { opacity: 1, scale: 1, duration: 0.05, ease: 'none', stagger: 0.03 }, 0.74);

  // one slow pulse ring out of the VESPERA pin, once — never looping
  if (pulse) {
    ScrollTrigger.create({
      trigger: loc,
      start: 'center 60%',
      once: true,
      onEnter: () =>
        gsap.fromTo(
          pulse,
          { scale: 1, opacity: 0.55 },
          { scale: 4.5, opacity: 0, duration: 2.4, ease: 'power2.out' }
        ),
    });
  }
}

/* =========================================================================
   SECTION 06 — pinned horizontal panels. THE MORPH: the plan never fades.
   Every wall travels, the PLATE ITSELF grows (215 -> 277 -> 411 m2), the
   dimension lines re-measure, and labels cross-fade in place. Pairing is
   authored by room id in config, never guessed.
   ========================================================================= */
function residencesTable() {
  const section = q('.residences');
  if (!section) return;

  const track = q('[data-res-track]', section);
  const panels = qa('[data-res-panel]', section);
  const svg = q('[data-morph-plan]', section);
  if (!track || !panels.length) return;

  const states = site.residences.map((r) => roomsFor(r));
  const plates = site.residences.map((r) => plateRect(r));

  const rects = {};
  const doors = {};
  const labels = {};
  const meta = {};
  states[0].forEach((rm) => {
    rects[rm.id] = q('[data-room="' + rm.id + '"]', svg);
    doors[rm.id] = q('[data-door="' + rm.id + '"]', svg);
    labels[rm.id] = q('[data-label="' + rm.id + '"]', svg);
    meta[rm.id] = rm;
  });
  const plateEl = q('[data-plate]', svg);
  const balEls = qa('[data-balcony]', svg);
  const glazeEls = qa('[data-glaze]', svg);
  const dimW = q('[data-dim="w"]', svg);
  const dimH = q('[data-dim="h"]', svg);
  const dimLineW = q('[data-dim-line="w"]', svg);
  const dimLineH = q('[data-dim-line="h"]', svg);
  const tickW1 = q('[data-dim-tick="w1"]', svg);
  const tickW2 = q('[data-dim-tick="w2"]', svg);
  const tickH1 = q('[data-dim-tick="h1"]', svg);
  const tickH2 = q('[data-dim-tick="h2"]', svg);

  // live geometry the tweens mutate; the renderer reads from it
  const live = {};
  states[0].forEach((rm) => (live[rm.id] = { x: rm.x, y: rm.y, w: rm.w, h: rm.h }));
  const livePlate = Object.assign({}, plates[0]);
  const liveDims = {
    w: parseFloat(site.residences[0].dims.w),
    h: parseFloat(site.residences[0].dims.h),
  };

  const setAttrs = (el, o) => {
    if (!el) return;
    Object.keys(o).forEach((k) => el.setAttribute(k, o[k]));
  };

  function render() {
    Object.keys(live).forEach((id) => {
      const g = live[id];
      const rect = rects[id];
      if (rect) {
        setAttrs(rect, {
          x: g.x.toFixed(2),
          y: g.y.toFixed(2),
          width: Math.max(0, g.w).toFixed(2),
          height: Math.max(0, g.h).toFixed(2),
          pathLength: '1'
        });
        rect.style.strokeDasharray = '1 1';
        rect.style.opacity = g.w < 1.5 ? 0 : 1;
      }
      const dEl = doors[id];
      if (dEl) {
        const d = doorPath({ x: g.x, y: g.y, w: g.w, h: g.h, door: meta[id].door });
        dEl.setAttribute('d', d || 'M 0 0');
        dEl.setAttribute('pathLength', '1');
        dEl.style.strokeDasharray = '1 1';
        dEl.style.opacity = d ? 1 : 0;
      }
      const lEl = labels[id];
      if (lEl) {
        const rmLive = { x: g.x, y: g.y, w: g.w, h: g.h, label: lEl.textContent, door: meta[id].door };
        const lp = labelPos(rmLive);
        const fs = labelSize(rmLive);
        lEl.setAttribute('x', lp.x.toFixed(2));
        lEl.setAttribute('y', lp.y.toFixed(2));
        lEl.setAttribute('font-size', fs.toFixed(2));
        // a label that cannot fit its room is hidden, never smeared over a wall
        lEl.style.opacity = g.w < 1.5 || !fs ? 0 : '';
      }
    });

    const t = live.terrace;
    if (t) {
      const bl = balconyLines(t);
      balEls.forEach((el, i) => bl[i] && setAttrs(el, bl[i]));
    }
    const lv = live.living;
    if (lv) {
      const gl = glazingLines({ x: lv.x, y: lv.y, w: lv.w, h: lv.h, glaze: 'bottom' });
      glazeEls.forEach((el, i) => gl[i] && setAttrs(el, gl[i]));
    }

    setAttrs(plateEl, {
      x: livePlate.x.toFixed(2),
      y: livePlate.y.toFixed(2),
      width: livePlate.w.toFixed(2),
      height: livePlate.h.toFixed(2),
    });

    const bx = livePlate.x;
    const by = livePlate.y;
    const bw = livePlate.w;
    const bh = livePlate.h;
    const wy = by + bh + DIM_OFF;
    setAttrs(dimLineW, { x1: bx.toFixed(2), y1: wy.toFixed(2), x2: (bx + bw).toFixed(2), y2: wy.toFixed(2) });
    setAttrs(tickW1, { x1: bx.toFixed(2), y1: (wy - 5).toFixed(2), x2: bx.toFixed(2), y2: (wy + 5).toFixed(2) });
    setAttrs(tickW2, { x1: (bx + bw).toFixed(2), y1: (wy - 5).toFixed(2), x2: (bx + bw).toFixed(2), y2: (wy + 5).toFixed(2) });
    const hx = bx - DIM_OFF;
    setAttrs(dimLineH, { x1: hx.toFixed(2), y1: by.toFixed(2), x2: hx.toFixed(2), y2: (by + bh).toFixed(2) });
    setAttrs(tickH1, { x1: (hx - 5).toFixed(2), y1: by.toFixed(2), x2: (hx + 5).toFixed(2), y2: by.toFixed(2) });
    setAttrs(tickH2, { x1: (hx - 5).toFixed(2), y1: (by + bh).toFixed(2), x2: (hx + 5).toFixed(2), y2: (by + bh).toFixed(2) });

    if (dimW) {
      dimW.textContent = liveDims.w.toFixed(1);
      setAttrs(dimW, { x: (bx + bw / 2).toFixed(2), y: (wy - 6).toFixed(2) });
    }
    if (dimH) {
      dimH.textContent = liveDims.h.toFixed(1);
      const cy = (by + bh / 2).toFixed(2);
      setAttrs(dimH, {
        x: (hx - 7).toFixed(2),
        y: cy,
        transform: 'rotate(-90 ' + (hx - 7).toFixed(2) + ' ' + cy + ')',
      });
    }
  }

  render();

  const mm = gsap.matchMedia();

  // --- mobile: vertical stack, static plans drawn on entry, no morph ---
  mm.add('(max-width: 768px)', () => {
    qa('[data-plan-static]', section).forEach((plan) => {
      const parts = qa('rect, path, line', plan);
      const txt = qa('text', plan);
      if (REDUCE) {
        gsap.set([...parts, ...txt], { opacity: 1 });
        return;
      }
      const sc = svgScale(plan);
      parts.forEach((el) => primeDash(el, sc));
      gsap.set(txt, { opacity: 0 });
      const tl = gsap.timeline({ scrollTrigger: { trigger: plan, start: 'top 85%' } });
      tl.to(parts, { strokeDashoffset: 0, duration: 0.8, ease: 'power2.out', stagger: 0.01 }, 0);
      tl.to(txt, { opacity: 1, duration: 0.4, ease: 'power2.out', stagger: 0.015 }, 0.6);
      tl.add(() => clearDash(parts));
    });
    qa('[data-res-panel]', section).forEach((p) => {
      if (REDUCE) return;
      gsap.fromTo(
        qa('.config-item', p),
        { clipPath: 'inset(0% 100% 0% 0%)' },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.08,
          scrollTrigger: { trigger: p, start: 'top 85%' },
        }
      );
    });
  });

  // --- desktop: pin 300%, scrub the spec track, morph the plan ---
  mm.add('(min-width: 769px)', () => {
    if (REDUCE) {
      gsap.set(track, { x: 0 });
      return;
    }
    const distance = () => track.scrollWidth - track.parentElement.clientWidth;

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'residences',
        trigger: section,
        start: 'top top',
        end: '+=300%',
        scrub: true,
        pin: true,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        refreshPriority: 1,
      },
    });

    tl.to(track, { x: () => -distance(), ease: 'none', duration: states.length - 1 }, 0);

    // Rooms are morphed, not erased and redrawn. Every residence carries the
    // same room ids in the same order, so each partition has a real
    // counterpart in the next plan and can simply travel to it.
    //
    // Critically they all travel on the SAME clock. These rooms tile a
    // rectangle, so BED 02's left edge IS BED 01's right edge: staggering them
    // makes shared walls visibly detach and re-join mid-morph, which is what
    // read as "not smoothly moving". One duration, one ease, no stagger — the
    // plan deforms as a single welded body.
    const ROOM_DUR = 1;
    const ROOM_EASE = 'power2.inOut';

    for (let i = 1; i < states.length; i++) {
      const target = states[i];
      const at = i - 1;

      // 1. the partitions travel to their new geometry
      target.forEach((rm) => {
        tl.to(
          live[rm.id],
          {
            x: rm.x,
            y: rm.y,
            w: rm.w,
            h: rm.h,
            duration: ROOM_DUR,
            ease: ROOM_EASE,
            onUpdate: render,
          },
          at
        );
      });

      // 2. the plate and the dimension strings move across the whole segment,
      //    so the outline leads and the partitions settle into it
      tl.to(
        livePlate,
        {
          x: plates[i].x,
          y: plates[i].y,
          w: plates[i].w,
          h: plates[i].h,
          ease: 'power2.inOut',
          duration: 1,
          onUpdate: render,
        },
        at
      );

      tl.to(
        liveDims,
        {
          w: parseFloat(site.residences[i].dims.w),
          h: parseFloat(site.residences[i].dims.h),
          ease: 'power2.inOut',
          duration: 1,
          onUpdate: render,
        },
        at
      );

      // 3. a label only changes where the NAME changes, and it swaps at the
      //    midpoint of its own room's travel so the text is never legible
      //    while it is sliding to a different room's position
      target.forEach((rm) => {
        const el = labels[rm.id];
        if (!el || el.textContent === rm.label) return;
        const mid = at + ROOM_DUR * 0.32;
        tl.to(el, { opacity: 0, duration: ROOM_DUR * 0.25, ease: 'power2.in' }, mid);
        tl.add(() => (el.textContent = rm.label), mid + ROOM_DUR * 0.25);
        tl.to(el, { opacity: 1, duration: ROOM_DUR * 0.3, ease: 'power2.out' }, mid + ROOM_DUR * 0.25);
      });

      const o = { v: parseFloat(site.residences[i - 1].area) };
      tl.to(
        o,
        {
          v: parseFloat(site.residences[i].area),
          ease: 'power2.inOut',
          duration: 1,
          onUpdate: () => {
            qa('[data-count]', section).forEach((n) => (n.textContent = Math.round(o.v)));
          },
        },
        at
      );

      // the section drawing's height dimension and the title block follow the
      // same clock. Both directions are handled: scrubbing backwards has to
      // restore the PREVIOUS residence's values, which a one-way callback
      // silently failed to do.
      const xsHeight = q('[data-xs-height]');
      const tbDrawing = q('[data-tb-drawing]');
      const applyMeta = (n) => {
        if (xsHeight) xsHeight.textContent = site.residences[n].ceiling + ' M';
        if (tbDrawing) tbDrawing.textContent = site.residences[n].name + ' — PLAN & SECTION';
      };
      if (xsHeight || tbDrawing) {
        tl.call(applyMeta, [i], at + 0.5);
        // reverse pass
        tl.call(applyMeta, [i - 1], at + 0.49);
      }
    }

    return () => {
      gsap.set(track, { x: 0 });
    };
  });
}

/* --- Amenities (07): stagger reveal + the site's only hover effect ------ */
function amenities() {
  const cells = qa('[data-amenity]');
  if (!cells.length) return;

  const rule = q('[data-amenities-rule]');

  if (REDUCE) {
    gsap.set(cells, { opacity: 1 });
    if (rule) gsap.set(rule, { scaleX: 1 });
    return;
  }

  // the head rule draws as the section opens
  if (rule) {
    gsap.fromTo(
      rule,
      { scaleX: 0 },
      {
        scaleX: 1,
        duration: 1.1,
        ease: 'power3.out',
        scrollTrigger: { trigger: '.amenities', start: 'top 80%' },
      }
    );
  }

  // Each plate is revealed on ITS OWN position, not on the section's. The
  // section is now taller than the viewport, so a single section-level
  // trigger fired all four at once and the lower two had already played by
  // the time they were scrolled to.
  cells.forEach((cell) => {
    const wrap = q('.amenity__imgwrap', cell);
    const img = q('.amenity__img', cell);
    const label = q('.amenity__label', cell);
    const detail = q('[data-amenity-detail]', cell);
    const index = q('.amenity__index', cell);

    const tl = gsap.timeline({
      scrollTrigger: { trigger: cell, start: 'top 82%' },
    });

    // mask reveal from the bottom edge while the image settles out of a
    // slight overscale — the frame is uncovered, never faded
    if (wrap) {
      tl.fromTo(
        wrap,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.1, ease: 'power3.out' },
        0
      );
    }
    if (img) tl.fromTo(img, { scale: 1.08 }, { scale: 1, duration: 1.4, ease: 'power3.out' }, 0);
    if (index) tl.from(index, { opacity: 0, duration: 0.5, ease: 'power2.out' }, 0.55);
    if (label) tl.from(label, { opacity: 0, duration: 0.6, ease: 'power2.out' }, 0.6);
    if (detail) {
      tl.fromTo(
        detail,
        { clipPath: 'inset(0% 0% 100% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.6, ease: 'power2.out' },
        0.72
      );
    }
  });

  // a slow counter-drift per plate keeps the staggered grid alive while it
  // passes, so the section reads as one continuous move rather than four
  // separate entrances
  gsap.matchMedia().add('(min-width: 769px)', () => {
    cells.forEach((cell, i) => {
      const img = q('.amenity__img', cell);
      if (!img) return;
      gsap.fromTo(
        img,
        { yPercent: i % 2 ? 3 : -3 },
        {
          yPercent: i % 2 ? -3 : 3,
          ease: 'none',
          scrollTrigger: { trigger: cell, start: 'top bottom', end: 'bottom top', scrub: true },
        }
      );
    });
  });

  // the only hover effect permitted on the site
  cells.forEach((cell) => {
    const img = q('.amenity__img', cell);
    const label = q('.amenity__label', cell);
    if (!img || !label) return;
    const enter = () => {
      gsap.to(img, { scale: 1.04, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(label, { letterSpacing: '0.24em', duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
    };
    const leave = () => {
      gsap.to(img, { scale: 1, duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
      gsap.to(label, { letterSpacing: '0.18em', duration: 0.6, ease: 'power2.out', overwrite: 'auto' });
    };
    cell.addEventListener('mouseenter', enter);
    cell.addEventListener('mouseleave', leave);
  });

  // amenity title block reveal, on the block itself
  const atb = q('[data-amenities-titleblock]');
  if (atb) {
    gsap.from(qa('.atb__row', atb), {
      opacity: 0,
      duration: 0.4,
      ease: 'power2.out',
      stagger: 0.06,
      scrollTrigger: { trigger: atb, start: 'top 92%' },
    });
  }
}


/* --- Enquire (09): underlines draw from left, button fades up last ------ */
function enquire() {
  const section = q('.enquire');
  if (!section) return;
  const rules = qa('[data-field-rule]', section);
  const cta = q('.enquire__cta', section);
  const headRule = q('[data-enq-rule]', section);
  const title = q('[data-enq-title]', section);
  const sub = q('.enq-sub', section);
  const contact = q('.contact', section);

  if (REDUCE) {
    if (rules.length) gsap.set(rules, { scaleX: 1 });
    if (headRule) gsap.set(headRule, { scaleX: 1 });
    if (cta) gsap.set(cta, { opacity: 1 });
    return;
  }

  if (rules.length) gsap.set(rules, { scaleX: 0 });

  const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top 80%' } });
  if (headRule) tl.fromTo(headRule, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.out' }, 0);
  if (title) tl.from(title, { opacity: 0, y: '1.6cqh', duration: 0.9, ease: 'power3.out' }, 0.15);
  if (sub) tl.from(sub, { opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.4);
  // each field underline draws in turn, so the form assembles rather than appears
  if (rules.length) tl.to(rules, { scaleX: 1, duration: 0.9, ease: 'power3.out', stagger: 0.12 }, 0.35);
  if (contact) tl.from(contact, { opacity: 0, duration: 0.8, ease: 'power2.out' }, 0.55);
  // the button fades up last, with no movement
  if (cta) tl.from(cta, { opacity: 0, duration: 0.7, ease: 'power2.out' }, 0.95);
}

function enquireFinePrint() {
  const foot = q('.foot');
  if (!foot) return;

  const rule = q('[data-foot-rule]', foot);
  const rows = qa('.foot__row', foot);

  if (REDUCE) {
    if (rule) gsap.set(rule, { scaleX: 1 });
    if (rows.length) gsap.set(rows, { opacity: 1 });
    return;
  }

  const tl = gsap.timeline({ scrollTrigger: { trigger: foot, start: 'top 92%' } });
  if (rule) tl.fromTo(rule, { scaleX: 0 }, { scaleX: 1, duration: 1.1, ease: 'power3.out' }, 0);
  if (rows.length) tl.from(rows, { opacity: 0, duration: 0.7, ease: 'power2.out', stagger: 0.15 }, 0.3);
}

/* --- Section drawing (06): draws in after the plan enters --------------- */
function sectionDrawingMotion() {
  const xs = q('[data-res-xsection]');
  if (!xs) return;

  const svg = q('.xsection-svg', xs);
  const roof = q('[data-xs-roof]', svg);
  const wallL = q('[data-xs-wall-l]', svg);
  const wallR = q('[data-xs-wall-r]', svg);
  const floor = q('[data-xs-floor]', svg);
  const terrTop = q('[data-xs-terr-top]', svg);
  const terrRail = q('[data-xs-terr-rail]', svg);
  const drawables = [roof, wallL, wallR, floor, terrTop, terrRail].filter(Boolean);

  if (REDUCE) {
    gsap.set(drawables, { opacity: 1 });
    return;
  }

  const scale = svgScale(svg);
  drawables.forEach((el) => primeDash(el, scale));

  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.residences', start: 'top 85%' },
    delay: 0.2,
  });

  // roof slab first, then walls, then terrace, then the height dimension
  tl.to(roof, { strokeDashoffset: 0, duration: 0.15, ease: 'power2.out' }, 0);
  tl.to([wallL, wallR], { strokeDashoffset: 0, duration: 0.15, ease: 'power2.out' }, 0.12);
  tl.to(floor, { strokeDashoffset: 0, duration: 0.12, ease: 'power2.out' }, 0.22);
  tl.to([terrTop, terrRail], { strokeDashoffset: 0, duration: 0.1, ease: 'power2.out' }, 0.3);

  // dimension and label fade in last
  const dimText = q('[data-xs-height]', svg);
  const label = q('.xs-label', svg);
  if (dimText) {
    gsap.set(dimText, { opacity: 0 });
    tl.to(dimText, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.38);
  }
  if (label) {
    gsap.set(label, { opacity: 0 });
    tl.to(label, { opacity: 1, duration: 0.3, ease: 'power2.out' }, 0.42);
  }
}

/* --- Finish schedule + title block rows (06): hairline draws, text reveals */
function finishScheduleMotion() {
  const schedules = qa('[data-finish-schedule]');
  if (!schedules.length) return;

  // The schedule markup was rewritten into pills; this function still targeted
  // the old `[data-finish-rule]` / `.finish__k` structure, so it animated
  // nothing and emitted two empty-target warnings per schedule. It now drives
  // the pills that actually exist.
  schedules.forEach((sched) => {
    const rows = qa('[data-finish-row]', sched);
    if (!rows.length) return;

    if (REDUCE) {
      gsap.set(rows, { opacity: 1, clipPath: 'inset(0% 0% 0% 0%)' });
      return;
    }

    gsap.fromTo(
      rows,
      { clipPath: 'inset(0% 100% 0% 0%)', opacity: 0 },
      {
        clipPath: 'inset(0% 0% 0% 0%)',
        opacity: 1,
        duration: 0.55,
        ease: 'power3.out',
        stagger: 0.08,
        scrollTrigger: { trigger: sched, start: 'top 88%' },
      }
    );
  });
}

/* --- Residence title block (06): rows reveal on entry ------------------- */
function residencesTitleBlockMotion() {
  const tb = q('[data-res-titleblock]');
  if (!tb) return;

  const rows = qa('.tb__row', tb);
  if (REDUCE) {
    gsap.set(rows, { opacity: 1 });
    return;
  }

  gsap.from(rows, {
    opacity: 0,
    duration: 0.4,
    ease: 'power2.out',
    stagger: 0.06,
    scrollTrigger: { trigger: '.residences', start: 'top 85%' },
  });
}

/* --- Parallax: hero / interior / aerial at three depths, <=8% travel ---- */
function parallax() {
  if (REDUCE) return;

  const layers = [
    { sel: '.hero__img', amp: 4 },
    { sel: '.interior__img', amp: 2.5 },
    { sel: '.aerial__img', amp: 1.5 },
  ];

  const mm = gsap.matchMedia();
  const run = (factor) => () => {
    layers.forEach(({ sel, amp }) => {
      const el = q(sel);
      if (!el) return;
      gsap.fromTo(
        el,
        { yPercent: -amp * factor },
        {
          yPercent: amp * factor,
          ease: 'none',
          scrollTrigger: {
            trigger: el.closest('.section'),
            start: 'top bottom',
            end: 'bottom top',
            scrub: true,
          },
        }
      );
    });
  };

  mm.add('(min-width: 769px)', run(1));
  mm.add('(max-width: 768px)', run(0.5)); // half travel below 768
}

/* ------------------------------------------------------------------------- */
function boot() {
  build();
  loader();
}

if (document.fonts && document.fonts.ready) {
  document.fonts.ready.then(boot);
} else {
  window.addEventListener('load', boot);
}
