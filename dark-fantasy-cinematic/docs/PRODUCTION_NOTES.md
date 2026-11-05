# DARK FANTASY CINEMATIC (30 s)

A 30-second vertical montage of scenes from a forgotten PS2-era dark-fantasy RPG. It is purely visual:
- no voiceover, dialogue, music or sound effects
- no subtitles, text, logo or fade to black

The MP4 has **no audio track**, so you can lay your own music and sound over it.

**Video:** [`../output/dark_fantasy_cinematic_30s.mp4`](../output/dark_fantasy_cinematic_30s.mp4) (H.264, CRF 16, 1080×1920, 30 fps)

## Shot list
| Time | Shot | What happens |
|-----:|------|--------------|
| 0:00 | **The Blacksmith** | The Violet Smith works at an anvil in an old timber-and-stone forge at night: mottled purple-blue plate, a pointed hood-helm, a dark face with two violet eyes. His left gauntlet grips the hilt of a glowing violet blade that lies across the anvil. His right hand brings the hammer down four times: lift, swing, contact, rebound, recovery. On each contact, purple-white and orange sparks burst from the impact point and the blade flares. The forge burns beside him and the camera creeps closer from a low angle. |
| 0:04 | **The Wizard** | A robed wizard in a pointed hat stands on a stone causeway before a massive gate. Its portal is a living swirl of violet light. He slowly raises his staff and energy gathers at its tip (the crystal shifts from green to violet). The portal pulses and swells, braziers burn violet, motes drift past, and his robe and hat stir in the wind. The camera approaches from behind him. |
| 0:08 | **The Knights' Feast** | Three crusaders in great helms and red-cross surcoats sit at a long table in a blue-lit hall, under red banners with white crosses. A map, a candle and tankards are on the table, with sconces on the walls. One knight raises his tankard and drinks; another sets his down; the third turns his helm toward the others and makes an open-handed gesture. The candle flickers, the banners stir, and the camera tracks sideways across the table. |
| 0:12 | **The Forgotten Castle** | A huge gothic castle on a rocky crag under a purple storm, beside a pink setting sun, with fog drifting between the towers and warm windows. A purple flash lights the clouds. The camera makes a wide aerial approach. |
| 0:16 | **The Lone Knight** | A knight in blackened steel with a long dark cape walks slowly down the street of an abandoned village in the rain. Torches flicker on the empty houses and his cape moves in the wind. The camera follows low behind him, and his foot placement matches his speed so he doesn't slide. |
| 0:20 | **The Ancient Temple** | An enormous abandoned cathedral with violet light falling through tall windows and dust drifting in the beams. A purple crystal floats above a stepped altar between two pillars. Three rune rings orbit it while energy swirls around it. The camera dollies slowly toward the altar. |
| 0:24 | **The Armory** | A dark weapons chamber lined with suits of armour on stands, racks of swords and axes, shields hung with crossed blades, and a row of spears. Torchlight and violet slit-light play over the metal. The dark knight walks past as the camera glides along the displays. |
| 0:27 | **Final Shot** | Back at the portal, now blazing brighter, the wizard stands perfectly still in silhouette. The camera pulls back and up to reveal the scale of the ancient gate, the causeway and the abyss around it. It ends on that frame. |

Shots are joined by short dissolves (0.5–0.6 s) and are 3–4 s long.

## Reference images
- **Used:** the three references named in the brief, for the purple-armoured smith at the anvil, the hooded wizard before the purple portal, and the three knights at the table. Their palette, geometry, lighting and mood carry through the whole piece, and the other shots extend the same world. The extra castle image informed the purple-and-pink castle sky.
- **Not used:** the bat-eared helmet image. That design is a recognisable copyrighted character, so the feast knights wear original crusader great helms instead.
- Every model is original and built in code.

## Characters
**Knights** use one rig and one material set per kit:
- **The Violet Smith:** a mottled purple-blue plate texture with faint emission, oversized layered pauldrons, a pointed hood-helm with a dark face and violet eyes, and a purple tabard skirt.
- **The crusader:** silver plate, a flat-topped great helm with an eye slit, a brass centre band and breaths, and a white surcoat with a red cross.
- **The wanderer:** blackened steel, a rounded armet with a pointed visor and crest, tassets, and a long wool cape (a cloth grid driven by wind and walk).

Every knight has:
- full plate: gorget, breastplate with a ridge, faulds, couters, vambraces, cuisses, poleyns, greaves, sabatons
- mail at the joints
- gauntlets with jointed fingers that close on hammers, hilts and tankards

**The wizard** is the original wizard rig from *Today You Will Learn How to Cast Spells*: deep blue robe, pointed hat, a staff with a floating crystal. It is retinted toward the reference, with a blue mantle and a crystal that turns from green to violet.

## Animation
- **Hammer blows** use the blacksmith film's strike system. The pose is solved so the hammer face lands exactly on the blade; sparks and a light pulse fire on the contact frame.
- **The smith's left hand** is placed on the hilt by a small numeric IK that bends shoulder and elbow (residual error about 1 mm). The hilt position is chosen within his reach, so the hand never floats or passes through the sword.
- **Walking** advances the root at the stride's speed, so feet don't slide.
- **Capes** use a cloth grid driven by wind and walking.
- **Hands** stay closed on whatever they hold. Tankards are parented to the fist.
- **Environmental motion:** fire, embers, rising smoke, rain streaks, drifting fog, dust and motes, waving banners, flickering candles and torches, the swirling portal, the orbiting rune rings, and the bobbing crystal.

## Look
The PS1/PS2 renderer from the series:
- vertex-snapped angular geometry
- Gouraud lighting
- fog and dither

For readability:
- **Resolution:** 540×960 internally (2× upscale).
- **Colour:** smoother 63-level colour.
- **Texture warping:** much less, so textures stay straight and readable.

The palette is deep purple and blue, with orange torch and forge light as the contrast colour. Exposure is controlled so the subject of every shot stays readable: the portal is tone-mapped so it glows without blowing out.

## Quality check
- **Eight distinct shots**, each with continuous character and environmental motion. Nothing is a static image.
- **No floating weapons, no hands through objects, no sliding feet, no armour deformation.** Every character stays consistent within its shot.
- **Every hammer contact is visible** and synced with sparks.
- **No audio track, no text, no logo.**
- **Length:** 30.0 s.

## Rebuild
Run `../build.sh`.
