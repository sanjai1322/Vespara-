// VESPERA — single source of truth.
// Every string, price, label and coordinate in the site lives here.
// No hardcoded copy anywhere in any component.

export default {
  brand: 'VESPERA',
  tagline: 'ARCHITECTURE IN BALANCE WITH TIME.',

  nav: ['RESIDENCES', 'AMENITIES', 'LOCATION', 'ABOUT', 'ENQUIRE'],

  // nav item -> section id it tracks (drives the animated bronze underline)
  navTargets: {
    RESIDENCES: 'residences',
    AMENITIES: 'amenities',
    LOCATION: 'location',
    ABOUT: 'about',
    ENQUIRE: 'enquire',
  },

  philosophy: [
    'We believe enduring spaces are born from clarity.',
    'From material to proportion, every detail is considered.',
    'Our residences are crafted for generations, not trends.',
  ],

  // SECTION 02 is a SITE SECTION cut through the coastal hillside — the same
  // project the aerial photograph shows, seen in drawing. Nine terraced
  // villas step down toward the sea; the fifth, mid-slope, is the headland.
  section: {
    title: 'SITE SECTION',
    villas: 9,
    highlightVilla: 5,
    label: 'RESIDENCE 05',
    sublabel: 'THE HEADLAND COLLECTION',
    levels: ['+48.00', '+40.00', '+32.00', '+24.00', '+16.00', '+8.00', '+0.00'],

    // Nine villas, each mapped to one of the three residence TYPES (1-3).
    // Villa 5 is the headland (type 3). Drives the hover annotation and the
    // click-through to section 06.
    villaData: [
      { name: 'RESIDENCE 01', level: '+46.00', type: 1, aspect: 'SEA EAST' },
      { name: 'RESIDENCE 02', level: '+41.00', type: 2, aspect: 'SEA EAST' },
      { name: 'RESIDENCE 03', level: '+36.00', type: 1, aspect: 'SEA EAST' },
      { name: 'RESIDENCE 04', level: '+30.00', type: 2, aspect: 'SEA EAST' },
      { name: 'RESIDENCE 05', level: '+25.00', type: 3, aspect: 'SEA EAST, DUAL' },
      { name: 'RESIDENCE 06', level: '+19.00', type: 1, aspect: 'SEA EAST' },
      { name: 'RESIDENCE 07', level: '+14.00', type: 2, aspect: 'SEA EAST' },
      { name: 'RESIDENCE 08', level: '+8.00',  type: 3, aspect: 'SEA EAST, DUAL' },
      { name: 'RESIDENCE 09', level: '+3.00',  type: 3, aspect: 'SEA EAST, DUAL' },
    ],

    // Drawing annotation. Chennai is on the EAST coast, so the Bay of Bengal
    // lies east (right of this section) and the sun RISES over the water.
    annotations: {
      naturalGrade: 'NATURAL GRADE',
      retaining: 'RETAINING TERRACE',
      meanSea: 'MEAN SEA LEVEL +0.00',
      sea: 'BAY OF BENGAL',
      sunPath: 'SUNRISE 06:12',
      summary: '9 RESIDENCES · 5 TYPES · 48 M ELEVATION CHANGE',
      sectionMark: 'A',
    },
    titleBlock: [
      ['PROJECT', 'VESPERA'],
      ['DRAWING', 'SITE SECTION A–A'],
      ['SCALE', '1:500'],
      ['REVISION', 'C'],
    ],
    scaleBar: ['0', '10', '20', '30 M'],
  },

  // Spec-list row labels for the residence panels.
  residenceSpecLabels: {
    area: 'AREA',
    aspect: 'ASPECT',
    ceiling: 'CEILING',
    terrace: 'TERRACE',
    price: 'PRICE',
  },

  // Each residence has its OWN plate. Drawn at a common scale (6 user units
  // per metre) so the plate visibly grows through the morph and the
  // dimension lines stay truthful:
  //   RESIDENCE 01  16.4 x 13.1 = 214.8 -> 215 m2   terrace 42 m2
  //   RESIDENCE 02  18.6 x 14.9 = 277.1 -> 277 m2   terrace 58 m2
  //   RESIDENCE 03  22.7 x 18.1 = 410.9 -> 411 m2   terrace 96 m2
  planScale: 6,
  planRoomOrder: [
    'entry', 'hall',
    'bed01', 'bed02', 'bed03', 'bed04', 'bed05',
    'bath', 'ensuite', 'bath03',
    'kitchen', 'living', 'terrace',
  ],

  // Rooms are percentages of each residence's OWN plate. Terrace is seaward
  // (bottom, full width); the entry is landward (top). `glaze` marks a wall
  // that carries a glazing run. Degenerate rooms (w:0) sit on the wall the
  // new partition grows from.
  residences: [
    {
      name: 'RESIDENCE 01',
      collection: 'THE COVE COLLECTION',
      beds: '3 BEDROOM',
      area: '218',
      aspect: 'SOUTH-EAST',
      ceiling: '3.2',
      terrace: '42',
      price: '2.4',
      dims: { w: '16.5', h: '13.2' },
      rooms: [
        { id: 'entry',   label: 'ENTRY',   x: 0,  y: 0,    w: 18,  h: 14,   door: 'top' },
        { id: 'hall',    label: 'HALL',    x: 18, y: 0,    w: 82,  h: 14 },
        { id: 'bed01',   label: 'BED 01',  x: 0,  y: 14,   w: 24,  h: 34,   door: 'top' },
        { id: 'bed02',   label: 'BED 02',  x: 24, y: 14,   w: 24,  h: 34,   door: 'top' },
        { id: 'bed03',   label: 'BED 03',  x: 48, y: 14,   w: 24,  h: 34,   door: 'top' },
        { id: 'bed04',   label: 'BED 04',  x: 72, y: 14,   w: 0,   h: 34,   door: 'top' },
        { id: 'bed05',   label: 'BED 05',  x: 72, y: 14,   w: 0,   h: 34,   door: 'top' },
        { id: 'bath',    label: 'BATH',    x: 72, y: 14,   w: 28,  h: 17,   door: 'top' },
        { id: 'ensuite', label: 'ENSUITE', x: 72, y: 31,   w: 28,  h: 17,   door: 'top' },
        { id: 'bath03',  label: 'BATH 03', x: 100, y: 31,  w: 0,   h: 17,   door: 'top' },
        { id: 'kitchen', label: 'KITCHEN', x: 0,  y: 48,   w: 32,  h: 32.5 },
        { id: 'living',  label: 'LIVING',  x: 32, y: 48,   w: 68,  h: 32.5, glaze: 'bottom' },
        { id: 'terrace', label: 'TERRACE', x: 0,  y: 80.5, w: 100, h: 19.5, balcony: true },
      ],
      specs: ['SOUTH-EAST ASPECT', '3.2M CEILINGS', 'SEA TERRACE', '2 CAR SPACES'],
    },
    {
      name: 'RESIDENCE 02',
      collection: 'THE COVE COLLECTION',
      beds: '4 BEDROOM',
      area: '277',
      aspect: 'EAST, DUAL',
      ceiling: '3.2',
      terrace: '58',
      price: '3.1',
      dims: { w: '18.6', h: '14.9' },
      rooms: [
        { id: 'entry',   label: 'ENTRY',   x: 0,  y: 0,    w: 16,  h: 13 ,  door: 'top' },
        { id: 'hall',    label: 'HALL',    x: 16, y: 0,    w: 84,  h: 13 },
        { id: 'bed01',   label: 'BED 01',  x: 0,  y: 13,   w: 21,  h: 32,   door: 'top' },
        { id: 'bed02',   label: 'BED 02',  x: 21, y: 13,   w: 21,  h: 32,   door: 'top' },
        { id: 'bed03',   label: 'BED 03',  x: 42, y: 13,   w: 21,  h: 32,   door: 'top' },
        { id: 'bed04',   label: 'BED 04',  x: 63, y: 13,   w: 21,  h: 32,   door: 'top' },
        { id: 'bed05',   label: 'BED 05',  x: 84, y: 13,   w: 0,   h: 32,   door: 'top' },
        { id: 'bath',    label: 'BATH',    x: 84, y: 13,   w: 16,  h: 16,   door: 'top' },
        { id: 'ensuite', label: 'ENS',     x: 84, y: 29,   w: 16,  h: 16,   door: 'top' },
        { id: 'bath03',  label: 'WC',      x: 100, y: 29,  w: 0,   h: 16,   door: 'top' },
        { id: 'kitchen', label: 'KITCHEN', x: 0,  y: 45,   w: 30,  h: 34.1 },
        { id: 'living',  label: 'LIVING',  x: 30, y: 45,   w: 70,  h: 34.1, glaze: 'bottom' },
        { id: 'terrace', label: 'TERRACE', x: 0,  y: 79.1, w: 100, h: 20.9, balcony: true },
      ],
      specs: ['CORNER ASPECT', '3.2M CEILINGS', 'WRAP TERRACE', '3 CAR SPACES'],
    },
    {
      name: 'RESIDENCE 03',
      collection: 'THE HEADLAND COLLECTION',
      beds: '5 BEDROOM',
      area: '411',
      aspect: 'EAST, SEA TO HEADLAND',
      ceiling: '3.6',
      terrace: '96',
      price: '5.8',
      dims: { w: '22.7', h: '18.1' },
      rooms: [
        { id: 'entry',   label: 'ENTRY',   x: 0,  y: 0,    w: 14,  h: 12 ,  door: 'top' },
        { id: 'hall',    label: 'HALL',    x: 14, y: 0,    w: 86,  h: 12 },
        { id: 'bed01',   label: 'BED 01',  x: 0,  y: 12,   w: 17,  h: 30,   door: 'top' },
        { id: 'bed02',   label: 'BED 02',  x: 17, y: 12,   w: 17,  h: 30,   door: 'top' },
        { id: 'bed03',   label: 'BED 03',  x: 34, y: 12,   w: 17,  h: 30,   door: 'top' },
        { id: 'bed04',   label: 'BED 04',  x: 51, y: 12,   w: 17,  h: 30,   door: 'top' },
        { id: 'bed05',   label: 'BED 05',  x: 68, y: 12,   w: 17,  h: 30,   door: 'top' },
        { id: 'bath',    label: 'BATH',    x: 85, y: 12,   w: 15,  h: 10,   door: 'left' },
        { id: 'ensuite', label: 'ENS',     x: 85, y: 22,   w: 15,  h: 10,   door: 'left' },
        { id: 'bath03',  label: 'WC',      x: 85, y: 32,   w: 15,  h: 10,   door: 'left' },
        { id: 'kitchen', label: 'KITCHEN', x: 0,  y: 42,   w: 28,  h: 34.6 },
        { id: 'living',  label: 'LIVING',  x: 28, y: 42,   w: 72,  h: 34.6, glaze: 'bottom' },
        { id: 'terrace', label: 'TERRACE', x: 0,  y: 76.6, w: 100, h: 23.4, balcony: true },
      ],
      specs: ['DUAL ASPECT', '3.6M CEILINGS', 'PRIVATE POOL TERRACE', '4 CAR SPACES'],
    },
  ],

  // `drive` is the time-to-destination shown under each non-primary label.
  // `anchor` chooses which side of the pin its label sits on, so no two
  // label boxes collide at any viewport width.
  // Chennai east coast: the Bay of Bengal is on the RIGHT, land to the left.
  // The coastline runs roughly x 72->78 top to bottom, so every pin sits
  // left of it and every label is anchored away from the water.
  mapPins: [
    { label: 'ECR JUNCTION',         x: 60, y: 16, drive: '8 MIN',  anchor: 'left'  },
    { label: 'OLD MAHABALIPURAM RD', x: 34, y: 30, drive: '12 MIN', anchor: 'right' },
    { label: 'BOTANICAL PARK',       x: 20, y: 52, drive: '18 MIN', anchor: 'right' },
    // coastal villa project — sits close to the shore
    { label: 'VESPERA',              x: 64, y: 58, primary: true,   anchor: 'left'  },
    { label: 'GOLF CLUB',            x: 44, y: 44, drive: '25 MIN', anchor: 'right' },
    { label: 'INTERNATIONAL SCHOOL', x: 26, y: 76, drive: '15 MIN', anchor: 'right' },
    // mobileY lifts it clear of OLD MAHABALIPURAM RD, whose label is long
    // enough on a narrow frame to run straight through this one
    { label: 'AIRPORT',              x: 12, y: 30, mobileY: 18, drive: '35 MIN', anchor: 'right' },
  ],

  // Cartographic furniture — copy lives here like everything else.
  map: {
    scaleBar: { from: '0', to: '2 KM' },
    north: 'N',
  },

  // `ratio` is each photograph's TRUE aspect after the letterbox bars were cut
  // in scripts/frames.mjs. The grid reads it rather than forcing every frame
  // into one shape — the arrival hall is a wide plate and is laid out as one.
  amenities: [
    { label: 'WELLNESS',  frame: 'amenity-wellness.webp',  ratio: '3 / 2',  detail: '25 M LAP POOL · SAUNA · TREATMENT ROOMS'  },
    { label: 'CONCIERGE', frame: 'amenity-concierge.webp', ratio: '3 / 2',  detail: '24 HOUR · ARRIVAL PAVILION' },
    { label: 'DINING',    frame: 'amenity-dining.webp',    ratio: '3 / 2',  detail: 'PRIVATE DINING FOR TWELVE · CHEF ON REQUEST'    },
    { label: 'GARDENS',   frame: 'amenity-gardens.webp',   ratio: '4 / 3',  detail: '1.2 HECTARES · NATIVE COASTAL PLANTING'   },
  ],

  // Full-bleed / split image frames. Centralised so filenames are never
  // hardcoded in components. All frames ship as webp.
  frames: {
    hero: 'hero.webp',
    materials: 'materials.webp',
    interior: 'interior.webp',
    aerial: 'aerial.webp',
  },

  units: { area: 'M²', areaLower: 'm²', metre: 'm', currency: '₹', crore: 'Cr' },

  materialsTitle: 'MATERIAL',
  amenitiesTitle: 'AMENITIES',

  // Section 03 presents ONE material study photograph as a plate plus a true
  // detail crop of the same plate, annotated in the drawing language the rest
  // of the site uses. The plate/detail captions live here with all other copy.
  materials: {
    // aspect of the two plates, so a landscape or portrait material
    // photograph can be swapped in without touching the component
    plateRatio: '3 / 2',
    detailRatio: '4 / 3',
    plateCaption: 'PLATE 01',
    plateNote: 'TRAVERTINE / BRONZE / SMOKED OAK / CONCRETE',
    detailCaption: 'DETAIL A',
    detailNote: 'TRAVERTINE, VEIN CUT',
    key: [
      { code: '01', name: 'ROMAN TRAVERTINE',      spec: 'VEIN CUT · HONED' },
      { code: '02', name: 'BRONZE',                spec: 'PATINATED · SATIN' },
      { code: '03', name: 'SMOKED OAK',            spec: 'SOLID · OILED' },
      { code: '04', name: 'BOARD-FORMED CONCRETE', spec: 'IN SITU · 200 MM BOARD' },
    ],
  },

  form: {
    fields: ['NAME', 'EMAIL', 'TELEPHONE'],
    cta: 'ENQUIRE',
  },

  // Balances the enquire section: the form sits left, this sits right, so
  // the asymmetry reads as composed rather than accidental.
  contact: {
    heading: 'SALES & VIEWINGS',
    lines: [
      'VESPERA SALES PAVILION',
      'EAST COAST ROAD',
      'CHENNAI 600119',
    ],
    phone: '+91 44 4000 1200',
    email: 'RESIDENCES@VESPERA.IN',
    hours: 'DAILY 10.00 — 18.00',
  },

  finishSchedule: [
    ['FLOOR',   'HONED TRAVERTINE'],
    ['WALLS',   'BOARD-FORMED CONCRETE'],
    ['JOINERY', 'SOLID OAK'],
    ['GLAZING', 'BRONZE-ANODISED, FLOOR TO CEILING'],
    ['TERRACE', 'TRAVERTINE, EXTERNAL GRADE'],
  ],

  // Section 09 closes the site: an enquiry above a real footer bar.
  enquire: {
    title: 'REGISTER YOUR INTEREST',
    lead: 'Private viewings are held at the sales pavilion by appointment.',
    label: 'ENQUIRE',
  },

  footer: {
    colophon: 'VESPERA — EAST COAST ROAD, CHENNAI',
    copyright: '© 2026 VESPERA. ALL RIGHTS RESERVED.',
    legal: ['PRIVACY', 'TERMS'],
  },

  registrationNote: [
    'ALL ENQUIRIES RESPONDED TO WITHIN TWO WORKING DAYS.',
    'RERA REGISTRATION NO. TN/01/BUILDING/0248/2024.',
    'ALL DRAWINGS AND SPECIFICATIONS ARE INDICATIVE.',
  ],

  // Measured type safe zones, as {top,left,width,height} percentages of the
  // 16:9 frame. Each section positions its type AND its dev overlay from
  // these exact numbers, so the overlay under [data-labels] matches on screen.
  safeZones: {
    hero:      { top: 73, left: 4,  width: 42, height: 9  }, // tagline, baseline ~80%
    materials: { top: 24, left: 61, width: 33, height: 52 }, // philosophy column
    interior:  { top: 0,  left: 0,  width: 100, height: 13 }, // reserved nav strip
  },
};
