# THE SLATE — Image Prompt Library

Standalone, model-agnostic prompts for **every** image the site uses or wants.
Each entry: target file, slot, spec, and a self-contained prompt. Drop generated files into
`site/public/img/` under the exact filename (convert with `cwebp -q 80 in.png -o out.webp`) — no code changes needed.

Palette anchors: cold-open near-black `#0E0B09` · paper `#F4F2EC` · tungsten `#171512` · midnight `#0B0D12` · golden `#1A130E`
Accents: vermilion `#FF4B33` · amber `#F2A93B` · arc-blue `#5B8CFF` · gold `#E8B45A`.

---

## IN USE — regenerate at 4K for best quality (current versions are 2K placeholders)

### 1. `hero-cold-open.webp` — the hero backdrop ⭐ highest impact
- **Slot:** full-bleed behind the title. **Spec:** 16:9, 3840×2160. Keep the lower-left third close to black (the title and stats sit there); the beam should live in the upper-right two-thirds.

> Interior of a vast dark cinema, a single projector beam cutting diagonally through haze from the upper right toward the lower left, seen from inside the auditorium. Deep near-black shadows (#0E0B09) with a warm red-orange tint in the beam (#FF4B33) and fine dust motes suspended in it. The projector lens is a small hot point of light at the right edge. The bottom third of the frame is almost pure black, with only the faintest suggestion of seat backs. Photorealistic, cinematic, moody, high contrast, atmospheric haze. Exclude: people, readable text, logos, blue tones, bright walls.

### 2. `empty-cinema-golden.webp` — the Verdict backdrop
- **Slot:** behind the GOOD PAYS. BIG DOESN'T. act at 12% opacity. **Spec:** 16:9, 3840×2160, keep overall luminance LOW.

> An empty cinema auditorium at golden hour, photographed from the movie screen's point of view looking out over rows of empty seats. Warm low-angle golden light (#E8B45A) streams from a high side opening, cutting a visible beam through gentle haze; dust motes hang in the light. Seats and walls fall into rich dark amber-and-honey shadow on a near-black base (#1A130E). Wide symmetrical composition, generous negative space in the upper third. Mood: dawn after the argument — melancholy, resolved. Photorealistic. Exclude: people, text, logos, screen content, saturated reds or blues, daylight-white light.

### 3. `film-edge-macro.webp` — Act II backdrop
- **Slot:** behind "The house takes half" at 12% opacity. **Spec:** 16:9, 3840×2160, very dark.

> Extreme macro photograph of the edge of a 35mm film strip on a pure black background. Sprocket holes in sharp focus catching a warm amber-orange rim light (#F2A93B against near-black #171512); everything else falls into deep shadow with very shallow depth of field. The film edge runs diagonally from lower-left to upper-right. Faint dust in the sliver of light. Moody, high-contrast, photorealistic. Exclude: people, hands, logos, readable edge-codes, bright backgrounds.

---

## WANTED — optional

*(The winner-01…05 poster artworks from an earlier revision are no longer used — the poster wall
became the chip-stack chart, which needs no imagery. If they were already generated, keep or discard freely.)*

### 4. `paper-texture.webp` — optional Act I warmth
- **Slot:** very low-opacity texture behind the DAYLIGHT act. **Spec:** 16:9 or square, tileable feel, ≥2K, extremely subtle.

> Flat-lay macro of warm ivory cotton paper (#F4F2EC), soft raking light from the left revealing gentle fibre texture and a faint deckled grain, no creases, no objects, edge-to-edge paper. Neutral-warm white balance, extremely low contrast, matte. Exclude: text, shadows of objects, yellowing, folds.

---

## IMPLEMENTED IN CODE (no asset needed; prompts kept for optional filmed replacements)

- **Projector-beam dust** (midnight act): canvas particles — `src/core/effects.ts`.
- **Film-burn act-break flash**: CSS gradients — `#light-leak`.
- **Grain + vignette**: inline SVG turbulence — `base.css`.
- **Poster tiles**: typographic, generated from data — `src/scenes/act1-wall.ts`.
