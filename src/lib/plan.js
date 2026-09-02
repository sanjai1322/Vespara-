// Shared floor-plan geometry. Used by the residences component (initial
// render + the static mobile plans) and by motion.js (the morph), so the two
// can never drift apart.
//
// Each residence has its OWN plate, drawn at a common scale (user units per
// metre) so the plate genuinely grows through the morph and the dimension
// lines stay truthful.

import site from '../config/site.config.js';

export const SCALE = site.planScale;
export const ORDER = site.planRoomOrder;

// plate size in user units, from the residence's real metre dimensions
export function plateFor(res) {
  return {
    w: +(parseFloat(res.dims.w) * SCALE).toFixed(2),
    h: +(parseFloat(res.dims.h) * SCALE).toFixed(2),
  };
}

// the largest plate sets the drawing frame every plan is centred in
export const MAX_PLATE = site.residences.reduce(
  (a, r) => {
    const p = plateFor(r);
    return { w: Math.max(a.w, p.w), h: Math.max(a.h, p.h) };
  },
  { w: 0, h: 0 }
);

// centring offset so a smaller plate sits in the middle of the frame
export function plateOffset(res) {
  const p = plateFor(res);
  return {
    tx: +((MAX_PLATE.w - p.w) / 2).toFixed(2),
    ty: +((MAX_PLATE.h - p.h) / 2).toFixed(2),
  };
}

// rooms in the stable paired id order, in FRAME coordinates (plate-local
// percentages resolved against this residence's plate, then centred)
export function roomsFor(res) {
  const p = plateFor(res);
  const { tx, ty } = plateOffset(res);
  return ORDER.map((id) => {
    const r = res.rooms.find((x) => x.id === id);
    return {
      id: r.id,
      label: r.label,
      door: r.door,
      glaze: r.glaze,
      balcony: !!r.balcony,
      x: +(tx + (r.x / 100) * p.w).toFixed(3),
      y: +(ty + (r.y / 100) * p.h).toFixed(3),
      w: +((r.w / 100) * p.w).toFixed(3),
      h: +((r.h / 100) * p.h).toFixed(3),
    };
  });
}

// the plate outline itself, in frame coordinates
export function plateRect(res) {
  const p = plateFor(res);
  const { tx, ty } = plateOffset(res);
  return { x: tx, y: ty, w: p.w, h: p.h };
}

// A 90° swing whose straight leg lies ON the wall it belongs to.
// Returns '' for degenerate rooms so nothing draws where no wall exists yet.
export function doorPath(rm) {
  const { x, y, w, h, door } = rm;
  if (!door || w < 4 || h < 4) return '';
  const L = +Math.min(Math.min(w, h) * 0.34, 16).toFixed(2);
  const off = +Math.min(Math.max(Math.min(w, h) * 0.16, 3), 9).toFixed(2);
  const n = (v) => +v.toFixed(2);

  if (door === 'top') {
    const hx = n(x + off);
    return `M ${hx} ${n(y)} L ${n(hx + L)} ${n(y)} M ${n(hx + L)} ${n(y)} A ${L} ${L} 0 0 1 ${hx} ${n(y + L)}`;
  }
  if (door === 'bottom') {
    const by = n(y + h);
    const hx = n(x + off);
    return `M ${hx} ${by} L ${n(hx + L)} ${by} M ${n(hx + L)} ${by} A ${L} ${L} 0 0 0 ${hx} ${n(by - L)}`;
  }
  if (door === 'left') {
    const hy = n(y + off);
    return `M ${n(x)} ${hy} L ${n(x)} ${n(hy + L)} M ${n(x)} ${n(hy + L)} A ${L} ${L} 0 0 0 ${n(x + L)} ${hy}`;
  }
  const rx = n(x + w);
  const hy = n(y + off);
  return `M ${rx} ${hy} L ${rx} ${n(hy + L)} M ${rx} ${n(hy + L)} A ${L} ${L} 0 0 1 ${n(rx - L)} ${hy}`;
}

// terrace reads as a lighter double line along its long axis, never a fill
export function balconyLines(rm) {
  if (!rm || rm.w < 2) return [];
  const { x, y, w, h } = rm;
  const n = (v) => +v.toFixed(2);
  if (w >= h) {
    return [
      { x1: n(x), y1: n(y + h * 0.34), x2: n(x + w), y2: n(y + h * 0.34) },
      { x1: n(x), y1: n(y + h * 0.68), x2: n(x + w), y2: n(y + h * 0.68) },
    ];
  }
  return [
    { x1: n(x + w * 0.34), y1: n(y), x2: n(x + w * 0.34), y2: n(y + h) },
    { x1: n(x + w * 0.68), y1: n(y), x2: n(x + w * 0.68), y2: n(y + h) },
  ];
}

// Glazing run: the standard doubled thin line inset from the wall. Drawn on
// the seaward face so the dwelling reads as opening to the water.
export function glazingLines(rm) {
  if (!rm || !rm.glaze || rm.w < 6) return [];
  const { x, y, w, h } = rm;
  const n = (v) => +v.toFixed(2);
  const inset = 2.2;
  const pad = w * 0.07;
  if (rm.glaze === 'bottom') {
    const by = y + h;
    return [
      { x1: n(x + pad), y1: n(by - inset), x2: n(x + w - pad), y2: n(by - inset) },
      { x1: n(x + pad), y1: n(by - inset * 2.2), x2: n(x + w - pad), y2: n(by - inset * 2.2) },
    ];
  }
  const ty = y;
  return [
    { x1: n(x + pad), y1: n(ty + inset), x2: n(x + w - pad), y2: n(ty + inset) },
    { x1: n(x + pad), y1: n(ty + inset * 2.2), x2: n(x + w - pad), y2: n(ty + inset * 2.2) },
  ];
}

// Advance width of the uppercase grotesque at 0.06em tracking, measured
// empirically. Under-estimating this is what let ENSUITE run past its wall.
const ADV = 0.78;
const WALL_PAD = 6;   // label never comes closer than this to a partition

// Fit the room label inside its OWN walls, with real padding.
export function labelSize(rm, base = 4.4) {
  if (!rm || rm.w <= 0) return 0;
  const chars = (rm.label || '').length;
  const room = rm.w - WALL_PAD;
  if (room <= 0) return 0;
  const needed = chars * base * ADV;
  if (needed <= room) return base;
  const fitted = room / (chars * ADV);
  // below ~2.8 the label is unreadable anyway — drop it rather than smear it
  return fitted < 2.8 ? 0 : +fitted.toFixed(2);
}

// Place the label in the part of the room the DOOR SWING does not occupy.
// A label sitting under an arc is the single thing that made these plans
// read as generated rather than drawn.
export function labelPos(rm) {
  const cx = rm.x + rm.w / 2;
  const cy = rm.y + rm.h / 2;
  if (!rm.door || rm.w < 4 || rm.h < 4) return { x: cx, y: cy };
  const L = Math.min(Math.min(rm.w, rm.h) * 0.34, 16);
  const shift = L * 0.42;
  // push away from the wall the swing hangs on, clamped inside the room
  const lim = rm.h / 2 - 2.5;
  const limX = rm.w / 2 - 2.5;
  if (rm.door === 'top') return { x: cx, y: cy + Math.min(shift, lim) };
  if (rm.door === 'bottom') return { x: cx, y: cy - Math.min(shift, lim) };
  if (rm.door === 'left') return { x: cx + Math.min(shift, limX), y: cy };
  return { x: cx - Math.min(shift, limX), y: cy };
}

export const DIM_OFF = 26;
