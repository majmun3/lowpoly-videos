# BEING BORN AS A BLACKSMITH IN MEDIEVAL TIMES WAS HORRIFYING

A ~62-second vertical (9:16, 1080×1920, 30 fps) historically inspired documentary in PS1/PS2 low-poly 3D. It covers the life of one medieval blacksmith, from birth beside the forge to old age. It has no kings, no legendary warriors, no magic and no happy ending.

**Final video:** [`../output/being_born_as_a_blacksmith_in_medieval_times_was_horrifying.mp4`](../output/being_born_as_a_blacksmith_in_medieval_times_was_horrifying.mp4) (H.264 + AAC 48 kHz, −14.4 LUFS)

## Script and timing
| Start | Narration | Scene |
|------:|-----------|-------|
| 0:00.3 | Being born as a blacksmith in medieval times was horrifying. | B01: the first frame is a hammer landing on glowing iron, the father's face lit by the forge. B02: a medieval village on a misty, cold morning, with the smithy beside the family home and chimneys smoking. B03: inside, the newborn cries in his cradle. B04: the father strikes glowing metal with an enormous hammer. |
| 0:06.6 | Your childhood ended early. | B05: at seven, he hauls a heavy coal bucket across the forge, struggling. |
| 0:08.7 | By the age of seven, you were already working beside your father. | B06: his father points to the furnace. B07: he pumps the bellows. The fire roars with each stroke, and sweat runs down his face. |
| 0:13.7 | By twelve, you were expected to work from sunrise until the fire went out. | B08: at twelve, his father demonstrates the blow. B09: he tries it himself. B10: he misses; the hammer rings off the anvil and the bar jumps. He winces and shakes out his hand. |
| 0:21.1 | One mistake could leave you burned, crippled, or unable to work ever again. | B11: grown, he touches a hot iron by accident and jerks his hand back. B12: a close-up of the smoking leather glove. B13: he wraps the injured hand in linen. |
| 0:28.9 | Your customers wanted horseshoes, tools, weapons and repairs. | B14: the busy forge, with a farmer holding a bent horseshoe, a soldier with a broken sword and a villager with a sickle waiting at the open front. B15: blow after blow. |
| 0:33.5 | And they wanted them yesterday. | B16: the soldier holds out the broken sword and the farmer taps his foot. B17: hot iron hisses into the quench tub. |
| 0:37.8 | The heat, smoke, constant noise and endless hours slowly destroyed your body. | B18: late at night, alone, still hammering. B19: he wipes the sweat from his sooty, exhausted face as the camera closes in. B20: his rough hands in the firelight. |
| 0:45.6 | By the time you were old, your hearing was damaged, your back was broken, and your hands could barely hold a hammer. | B21: an old man, grey-bearded and hunched beside a dying fire. B22: his trembling hands try to lift the hammer, then give up. B23: a brief flash of the man he used to be. |
| 0:54.1 | You spent your entire life making things that outlived you. | B24: he lays the hammer on the anvil as the fire fades. B25: the next morning the forge is cold, with the hammer still on the anvil. B26: a young apprentice walks in and picks it up. The title follows at 0:59.6. |

## The blacksmith
See [`../images/00_design_sheet.png`](../images/00_design_sheet.png). He is one rig and one material set from age seven to old age.

**Build and face:**
- strong and broad, with thick bare forearms
- short messy brown hair and a thick beard
- a soot-smudged face

**Clothing:**
- an off-white linen shirt with rolled sleeves
- a scorched leather apron that covers the front only and ties across the back
- brown wool trousers and heavy boots

**Hands:** big, with jointed two-segment fingers and a thumb that close around the hammer handle and the tongs.

**Ages:**
- At seven and twelve he keeps the face, hair and build.
- In old age his hair and beard turn grey, his back bends and his hands tremble.

As the brief asked, his silhouette includes a strongly exaggerated backside at every age. It stays clearly visible: the apron is front-only. Nobody mentions it or reacts to it.

**Other characters:**
- His father, heavier and darker-bearded, shares the family build.
- The apprentice at the end is a different, normally proportioned boy.
- The customers and the mother are ordinary villagers.

## Animation
- **The strike** is a keyed cycle: rest, lift (wrist cocked), downward swing, contact, rebound and recovery. The poses are solved so the hammer face lands exactly on the hot bar: each character is positioned at the anvil from the contact pose's hammer-face position.
- **The hammer** is parented to the fist with the fingers closed around it, so it never floats or teleports.
- **The tongs** are re-posed every frame between the left hand and the bar, so they stay connected.
- **At every contact:**
  - sparks burst from the impact point on that exact frame;
  - the knees dip and the torso follows through;
  - the backside reacts a beat later (35–70 ms) with damped spring motion (bounce, sway and alternating cheeks) that settles before the next blow and carries through when blows overlap.
- **The miss** lands the hammer 11 cm beside the bar: the anvil rings, the bar jumps and he winces.
- **Other movement:**
  - the bellows compress and the fire flares with each stroke;
  - a sweat drip;
  - the glove smoulders;
  - the bandage is wrapped turn by turn;
  - the old man's hands tremble, and the fire dies.

## Look and clarity
The film uses the project's PS1/PS2 renderer, set for clarity:
- **Resolution:** 540×960 internally with a 2× nearest-neighbour upscale (the earlier films are 360×640 at 3×).
- **Colour:** smoother 63-level colour.
- **Texture warping:** much less, so textures stay straight and readable.

The low-poly look comes from the geometry and art direction, not from blur. Materials are kept distinct: linen, leather, wool, iron, polished steel, wood grain, stone and plaster.

**Lighting:**
- warm, flickering forge light with a lantern fill
- cool daylight through the open front
- night lit only by the forge
- cold daylight for the final morning

Important actions stay readable on a phone.

## Audio
All original and procedural (`../audio/synth.py`).

**Hammer blows** are placed on the exact contact frames of the animation (25 hits). Each has a weighty strike, a short bright ring and a sizzle. The miss rings longer and higher.

**Sound effects:**
- fire and crackle
- the bellows
- the baby's cry
- the coal bucket and footsteps on stone
- the sizzle of the burn
- cloth as the bandage is wrapped
- customers murmuring and a tapping foot
- the quench hiss
- night crickets and heavy breathing
- the soft knock as the old man lays the hammer down
- morning birds and the apprentice's footsteps
- wind throughout

**The score** is sombre and medieval:
- a low drone, hurdy-gurdy and a wooden flute theme
- a low string ostinato through childhood
- a tense pulse for the dangers
- a driving rhythm that locks to the work
- a heavier night section
- an emotional minor reprise in old age
- a quiet resolution and a single bell at the end

Music and effects duck under the narration. The narration is Kokoro-82M (Apache-2.0) in a deep, serious documentary voice. Subtitles are Cinzel (SIL OFL), with key words in forge orange.

## Quality check
1. **Recognisable characters:** faces with eyes, brows, nose, mouth and beard; hands with fingers.
2. **Sharp textures:** sharper internal resolution and less warping.
3. **No broken geometry.** The shot framings were reviewed frame by frame and reworked where a camera clipped a character or obscured the action.
4. **The forge is clearly lit.** Night and old age are dim but readable.
5. **The hammer is held and animated correctly** in the fist through the whole cycle.
6. **Every strike connects with the metal.** Sparks and sound are on the contact frame.
7. **The body reacts** with a knee dip and follow-through.
8. **The backside reacts to every strike** with delayed secondary motion.
9. **One consistent design** from childhood to old age.
10. **62 s total.**
11. **The story reads without explanation:** birth, childhood, apprenticeship, danger, the endless work, the cost, old age, and the hammer passed on.

## Rebuild
Run `../build.sh`.
