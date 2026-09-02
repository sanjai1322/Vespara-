Drop the nine photographs here (any filenames, any format: png/jpg/webp).

Claude will look at each one, work out which section it belongs to, and wire
the mapping in scripts/frames.mjs -- then `node scripts/frames.mjs` re-encodes
everything into public/frames/ at the right names.

Expected content -> destination:
  villa exterior at dusk, infinity pool   -> hero.webp        (section 01)
  living room, sea view                   -> interior.webp    (section 04)
  material flatlay (travertine/brass/oak) -> materials.webp   (section 03)
  cliffside aerial of the villas          -> aerial.webp      (section 08)
  indoor lap pool + sauna                 -> amenity-wellness.webp
  arrival canopy + car + reflecting pool  -> amenity-concierge.webp
  dining table, sunset                    -> amenity-dining.webp
  hillside garden, lavender + olive       -> amenity-gardens.webp
