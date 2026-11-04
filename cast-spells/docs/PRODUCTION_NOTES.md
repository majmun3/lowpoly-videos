# TODAY YOU WILL LEARN HOW TO CAST SPELLS

A ~62-second vertical (9:16, 1080×1920, 30 fps) spell-casting explainer. It plays as a lesson inside a fantasy RPG: an old wizard speaks straight to you, the apprentice, and demonstrates each spell as he names it. The look is PS1/PS2-era low-poly fantasy and **deliberately bright**: a sunlit forest training ground with fog and light shafts, a storm only for the lightning lesson, and a sunset over a kingdom for the finale.

**Final video:** [`../output/today_you_will_learn_how_to_cast_spells.mp4`](../output/today_you_will_learn_how_to_cast_spells.mp4) (H.264 + AAC 48 kHz, −14.2 LUFS)

## Script and timing
| Start | Narration | Scene |
|------:|-----------|-------|
| 0:00.3 | Today... you will learn how to cast spells. | W01, the hook: the wizard strikes his staff on the ground and a ring of light bursts out over the rune circle. W02: the clearing and the wizard tower; mana spirals up into the staff's crystal. |
| 0:06.5 | Every spell begins with mana. | W03, *THE BASICS / MANA* card: a close-up of the hand gripping the staff as mana motes rise. |
| 0:09.4 | Focus your energy. Control your breathing. And channel it through your staff. | W04: a blue aura rises around him, his robe runes glow, and the runes on the ring of standing stones light up. |
| 0:14.9 | First, the Fireball. | W05, *LESSON I / FIREBALL* card: he turns to the stone target. |
| 0:16.8 | Gather heat in your palm. Compress the flames... | W06: a flame forms above his open palm, grows into a roaring ball, then is squeezed small and white-hot. |
| 0:20.4 | then release. | W07: an over-the-shoulder throw that becomes a chase camera behind the fireball and its trail. |
| 0:22.7 | | W08, slow motion: the target explodes in a fireball, with a shock ring, flying debris and smoke. |
| 0:25.9 | Next, Lightning Bolt. | W09, *LESSON II / LIGHTNING BOLT* card: the sky darkens and the wind rises; he raises the staff into the storm. |
| 0:28.2 | Draw electricity from the air. Focus it into a single point... | W10: sparks between his fingers, then arcs crawling up the staff into the crystal. |
| 0:32.6 | and unleash it. | W11: a branching blue-white bolt from the sky and the staff strikes the lone menhir, with a white flash and a spark burst. W12: arcs still crawl over the smoking, rune-lit stone. |
| 0:37.3 | Finally, the Magic Shield. | W13, *LESSON III / MAGIC SHIELD* card: a tusked brute bursts from the trees and charges. |
| 0:39.8 | Shape your mana into a barrier. | W14: the wizard plants his staff and a translucent blue rune dome rises from the circle. |
| 0:43.0 | Even the strongest attacks can be stopped. | W15, slow motion: the brute's cleaver hits the dome; a ripple and flash spread from the impact, the brute is thrown back and falls. |
| 0:47.4 | Master these three spells... | W16, *MASTERY / ALL THREE* card: a hill above a kingdom at sunset; the camera pulls back to reveal the city. |
| 0:51.1 | and you will no longer be an ordinary traveler. | W17: fire, lightning and blue mana orbit him as he raises the staff. |
| 0:56.4 | You will be a wizard. | W18: the three elements merge into a beam and burst over the kingdom; end title *TODAY YOU LEARNED HOW TO CAST SPELLS* at 0:59.4. |

The edit has no logo, intro, filler or subscribe request. The first frame is already a spell (the staff strike), and the hook caption *TODAY YOU WILL LEARN HOW TO CAST SPELLS* is on screen from 0:00. The lesson cards are short top-of-frame titles, timed to each spell's first line, so you always know which spell you're watching.

## The wizard (one original design)
See [`../images/00_wizard_design_sheet.png`](../images/00_wizard_design_sheet.png). He is one rig in every shot, holding the same staff:
- a tall, pointed midnight-blue hat with a brass band and a tip bent backwards
- a long midnight-blue robe that flares to the hem, with gold trim and teal rune bands that glow when he channels mana
- wide bell sleeves, and a burgundy shoulder mantle with a gold hem
- a leather belt with a brass buckle, **three potion bottles** (red, green, blue) on the left hip and a satchel on the right
- a long grey beard and bushy brows; his eyes glow teal while he casts
- **the staff:** gnarled wood ending in three prongs that hold a floating, slowly turning teal crystal. It is in his right hand in every shot where a spell is shown.

He looks mysterious but approachable: an old teacher, not a villain. The tusked brute in the shield lesson reuses the original brute model from *What If You Were Born as a Goblin?*. No existing character, franchise design or artwork was reproduced.

## Spells and effects
Each spell has its own colour, shape and sound, so none of them blur together.

**Mana (teal)**
- a rotating rune circle on the ground
- rising motes
- an aura shell around him
- glowing robe runes
- standing stones that light up

**Fireball (orange/white)**
- a faceted core inside an additive shell with a soft glow
- a flame particle emitter above the palm that grows, then compresses (the colour shifts to white-hot)
- a fire-light point light on the wizard
- a flaming trail
- the impact: a slow-motion explosion with a shock ring, debris, smoke and a warm flash

**Lightning Bolt (blue-white)**
- the sky and lighting shift to storm, with wind-blown leaves
- fractal bolt paths with branches, drawn as camera-facing ribbons (a white core plus a blue halo) and re-seeded many times a second so they flicker
- arcs between the fingers, the strike from the cloud and the staff, a spark burst, and a white flash with the thunder

**Magic Shield (blue)**
- a translucent faceted dome textured with runes, rising out of a shock ring
- on impact: a hit glow, a ripple scale pulse and a flash; the brute is thrown backwards in slow motion

**The finale**
- three orbiting elemental orbs: a fire emitter, a lightning orb and a mana orb
- these merge into a beam and burst above the kingdom

## Look
The same PS1/PS2 renderer as the rest of the project: affine texture warp, vertex snapping, Gouraud lighting, fog, Bayer dither and 15-bit colour, at 360×640 and upscaled 3× nearest-neighbour. All effects pass through the same 15-bit, dithered pipeline, so the magic looks like it belongs to the world. Bloom and point-light intensity are capped so the spells glow without washing out the frame.

## Audio
All original and procedural (`../audio/synth.py`).

**Magic and the world**
- **Mana:** humming tone clusters, staff-charge risers, glass chimes as each stone lights.
- **The world:** forest birds and leaf wind, then storm wind, then the hill wind at sunset.

**The three spells**
- **Fireball:** an ignition thump, a crackling flame bed, a compression whine, the release whoosh, then the explosion (a sub boom, debris and crackle) and falling stones.
- **Lightning Bolt:** electrical buzzing that intensifies with the arcs, a white crack, then rolling thunder.
- **Magic Shield:** the brute's roar and heavy footsteps, a rising hum for the barrier, the cleaver swing, then a deep glass-bell impact as the blow lands, and the fall.

**The score** is orchestral, in E dorian, resolving to E major:
- a wooden-flute lesson theme under soft choir and strings
- warm rising strings for the fireball, with a brass and choir hit on the explosion
- a low tremolo and an accelerating drum roll for the lightning
- a driving drum pulse for the brute's charge, with a bright chord as the shield holds
- for the finale, the lesson theme in E major on horns over strings and choir, building to a full swell on the burst

The music ducks under the narration.

The narrator is Kokoro-82M (Apache-2.0): a deep, warm blend of two British male voices at a slow teaching pace. Subtitles are Cinzel (SIL OFL), timed from each line's measured audio, with spell names and key words in teal.

## Quality check
- **The wizard stays the same:** one rig and the same staff in every shot; the staff is in hand whenever a spell is shown.
- **The hook lands:** the opening is a staff strike and a ring of light, with the title caption on screen in the first second; the first spell effect is on screen within 2 seconds.
- **Each spell looks different:** orange fire, blue-white branching lightning in a storm, a translucent rune dome; each has its own sound and its own lesson card.
- **Every effect lands on screen:**
  - the flame forms, grows and launches
  - the target explodes in slow motion
  - electricity gathers between the fingers before the strike
  - the brute's blow is stopped and he is thrown back
- **It's bright:** sunlit forest and sunset; only the lightning lesson darkens, as the brief asks.
- **The ending pays off:** the three elements combine above the kingdom on "You will be a wizard."

## Rebuild
Run `../build.sh`.
