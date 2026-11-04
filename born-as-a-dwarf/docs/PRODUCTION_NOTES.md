# WHAT IF YOU WERE BORN AS A DWARF?

A ~64-second vertical (9:16, 1080×1920, 30 fps) second-person dark-fantasy comedy in the PS1/PS2 low-poly style. The world is played completely straight: epic, mysterious and dangerous. The narrator is deep, calm and deadpan. All the comedy comes from one ridiculous dwarf and the physics of his backside.

**Final video:** [`../output/what_if_you_were_born_as_a_dwarf.mp4`](../output/what_if_you_were_born_as_a_dwarf.mp4) (H.264 + AAC 48 kHz, −14.3 LUFS)

## Script and timing
| Start | Narration | Scene |
|------:|-----------|-------|
| 0:00.3 | You were born as a dwarf. | D01: a crane down from enormous green mountains to a dwarf village, with the fortress gate at the head of the valley. The title caption is on screen from frame one. |
| 0:02.4 | But there was one problem... | D02: in the hearth-lit home, the parents lean over the cradle. |
| *(pause)* | | The music cuts out. |
| 0:04.5 | Your ass was bigger than your future. | D03: the newborn's tiny ginger beard and serious frown look straight into the lens. The camera tilts up to his colossal diapered rump towering behind him, wobbling as he kicks. D04: the parents react. |
| 0:07.5 | Other dwarves spent their childhood learning to fight. | D05: young dwarves spar with wooden swords in the village square. |
| 0:10.9 | You spent yours learning how to walk... without causing an earthquake. | D06–D07: the child walks past. Every step thumps, kicks up dust and shakes the camera. The other children stop and stare. A wooden sword is dropped and a barrel topples over. |
| 0:15.5 | At the age of thirty, you began your warrior training. | D08: in the training yard, he raises the great rune axe (low heroic angle, the camera arcing round to his side). |
| *(fall)* | | D09–D10: the swing spins him round, the backside swings out, and he goes face-first into the mud in slow motion, backside in the air. |
| 0:20.3 | Unfortunately... your greatest enemy was gravity. | D11: the comedic pause. Wide and silent while the recruits stare. He tries to get up and slips back down, and the drill master's palm meets his face. |
| 0:24.9 | You became a blacksmith. | D12: the great underground forge, with its glowing rune door, molten channels, furnaces and smiths. |
| 0:26.8 | Your weapons were legendary. | D13: a slow-motion hammer strike on glowing steel, with sparks. |
| 0:29.6 | Your proportions... were questionable. | D14: he turns and walks away. Every smith's head tilts in time with the wobble. |
| 0:32.5 | Then, one day, the orcs invaded your kingdom. | D15: thousands of orcs with torches march on the mountain fortress at dusk. |
| 0:36.0 | And for the first time... | D16: dwarf warriors on the ramparts. |
| 0:37.8 | your people needed you. | D17: he takes the axe off his back. D18: a slow-motion charge out of the gate, wobbling dramatically with every step. |
| 0:43.4 | The orc king made one mistake. | D19: the orc king towers over him, pointing and laughing. |
| *(silence)* | | D20: he slowly turns around. The music drops out, leaving only the wind. |
| 0:49.0 | | D21: the secret weapon: a backward hip-check, with a shockwave, a flash and slow motion. |
| 0:49.4 | He underestimated... the power of the dwarf. | D22: the orc king flies across the battlefield and crashes into his own army. The dwarves cheer. |
| 0:53.3 | And so, you became the greatest dwarf king in history. | D23: in the throne hall, thousands kneel as he climbs to the golden throne. |
| 0:57.2 | Feared by enemies. Loved by your people. | D24: he slowly sits down. One final wobble, a squash, a dust puff and a creak from the throne. |
| 1:00.7 | Remembered... by everyone. | D25: the camera pulls back to reveal a colossal golden statue of the king behind the throne, seen in profile, proportions included. The title card follows. |

## The protagonist (one design, from cradle to throne)
See [`../images/00_dwarf_design_sheet.png`](../images/00_dwarf_design_sheet.png). He follows the protagonist reference image and is built on one rig for every age.

**Fixed features**
- A massive ginger beard with two side braids (steel rings) and a long central braid to the belly.
- Long braided ginger hair down his back.
- Thick ginger brows over a permanently serious face, and a big bulbous nose.

**Armour and equipment**
- Riveted steel plates over a brown leather jerkin, layered steel-and-leather pauldrons, leather bracers.
- Grey-green wool sleeves and trousers, tall heavy boots.
- A huge leather belt with a steel buckle, a hammer on the left hip, a pouch on the right, and a brass lens on a chain.
- The tassets cover the front only.
- His rune-engraved bearded battle axe is carried over his right shoulder.

**Stages**
- **Newborn:** a tiny ginger beard, a single curl, a swaddle, and a giant diapered rump.
- **Child:** a green tunic, a small beard and short braids.
- **Warrior:** the full reference look.
- **King:** keeps everything, and adds a gold crown with gems, gilded plates and a short ermine-collared mantle. The mantle stops at the shoulder blades, so nothing hides the legend.

**The backside** is absurdly oversized at every age and never hidden by armour or camera angle. It is two cheek meshes on the pelvis with analytic spring physics, so every frame renders independently:
- **Walking and running:** side-to-side sway once per stride, alternating cheek bounce on each step, and a squash-and-stretch bounce on every footfall. Running doubles the amplitude.
- **Events:** damped spring "kicks" for impacts, the mud landing, the hip-check, and the final squash onto the throne.

**Other characters**, all original:
- His parents, the village children, the drill master and recruits, the smiths, and the dwarf warriors.
- A green, tusked orc king with a crown of bones, spiked pauldrons and a huge cleaver.
- Instanced crowds: a horde of about 2,600 orcs and about 1,100 kneeling dwarves.

The six reference images were used for mood and architecture only: a dwarf settlement under green mountains, a glowing rune forge, and a fortress besieged at dusk. No existing character, franchise design or artwork was reproduced.

## Look
The same PS1/PS2 renderer as the rest of the project: affine texture warp, vertex snapping, Gouraud lighting, fog, Bayer dither and 15-bit colour, at 360×640 upscaled 3× nearest-neighbour. The palette follows the brief: forest green, stone grey, warm brown, glowing orange forge light, muted crimson and golden sunlight.

The world is bright where it can be:
- a sunlit valley with snow-capped green mountains
- a warm hearth
- a daylight training yard

It is darker only where the story asks for it: the forge, the dusk battlefield and the torch-lit throne hall.

## Audio
All original and procedural (`../audio/synth.py`). The music stays serious throughout:
- a vast choir-and-brass opening
- a flute village theme
- a heroic training theme that is cut dead by the fall
- an anvil-rhythm forge theme
- war drums and minor choir building to the charge
- total silence for the turn
- a colossal orchestral blow on the hit
- a majestic A-major finale

The comedy is in the sound design and the silences:
- a soft rubbery "flub" under every wobble, kept subtle
- earthquake footsteps with rattling pebbles
- a mud splat, a slow-motion anvil clang and an orc-king laugh
- the orc's receding yell, the crash into his army and the cheering dwarves
- the thump, wobble and creak of the throne

There are no cartoon boings.

The narration is Kokoro-82M (Apache-2.0): a deep, calm blend of two male voices delivered deadpan at a slow pace. Subtitles are Cinzel (SIL OFL), timed from each line's measured audio, with key words in forge gold.

## Quality check
- **The protagonist stays consistent:** one rig and one set of materials. Face, beard, braids, armour, belt and axe stay identical from the training yard to the throne.
- **The backside gag runs throughout:** the cradle reveal, the earthquake walk, the swing and fall, the forge walk-away, the slow-motion charge, the hip-check, the throne and the statue.
- **The hook lands:** an epic establishing shot with the title caption, then the punchline at 0:04.5 after a deliberate silence.
- **Retention:** a new shot every 1–4 seconds across seven locations, moving from birth through childhood, training, the forge and the invasion to the duel and the throne.
- **The world is never cartoonish:** the epic camera work, music and narration are played completely straight, and the jokes come only from the dwarf.
- **No logos, introductions, filler or subscribe requests.**

## Rebuild
Run `../build.sh`.
