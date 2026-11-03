# WHAT IF YOU WERE BORN AS A GOBLIN?

A ~62-second vertical (9:16, 1080×1920, 30 fps) second-person "What If" short. It uses a PS1/PS2-era low-poly style in a **brighter dark-fantasy** world: sunlit forests, misty meadows, overgrown ruins, a goblin village, and a human kingdom at sunset. Caves and night are avoided.

**Final video:** [`../output/what_if_you_were_born_as_a_goblin.mp4`](../output/what_if_you_were_born_as_a_goblin.mp4) (H.264 + AAC 48 kHz, −14.3 LUFS)

## Script and timing
| Start | Narration | Scene |
|------:|-----------|-------|
| 0:00.2 | What if you were born a goblin... the weakest one in the forest? | G00 flash-forward: the Goblin King raises his cleaver over his army at sunset. G01a: a smash cut to sunlight falling through giant trees, craning down into the tribe's clearing. |
| 0:04.0 | You opened your eyes beneath the great trees, surrounded by your tribe. | G01b: the runt opens its amber eyes; the tribe looms over it |
| 0:08.9 | But you were smaller than all of them. | G02: the runt walks in a line of tall goblins |
| 0:11.3 | They took your food. They left you behind. | G03: a big goblin snatches its meat, the runt falls, and the tribe walks off laughing |
| 0:14.2 | Out here, weakness is a death sentence. | G04: a dire wolf watches the runt from the treeline |
| 0:17.0 | Then the knights came. | G05: knights march out of the forest at sunset with torches and a banner |
| 0:19.1 | Your home burned. Your tribe fell. | G06: the huts burn and goblins fall; the runt hides in the grass |
| 0:21.9 | And you ran. | G07: running through golden grass, smoke on the horizon |
| 0:23.5 | Alone, you learned to hunt. To make weapons. | G08a (summer): spearing a hare. G08b (autumn): binding a stone blade by a fire under a ruined arch. |
| 0:26.7 | To kill things that wanted to eat you. | G09 (winter): a dire wolf leaps and the survivor kills it |
| 0:29.7 | Seasons passed. Then years. | G10: spring → autumn → winter → spring on a hilltop with a great tree; the goblin grows |
| 0:32.9 | Until you killed something far stronger than yourself... | G11a: overgrown ruins; a tusked brute roars and swings its cleaver. G11b: the goblin leaps onto it and strikes; the brute falls. |
| 0:37.6 | and took its armor. | G12: the warlord rises in the brute's spiked pauldron, with its cleaver and a crimson rag cape |
| 0:40.0 | Goblins began to follow you. | G13: a growing column follows him across a sunlit meadow |
| 0:43.4 | Years later, you came back... to the kingdom that burned your home. | G14: a sunset reveal; the horde advances behind the warlord |
| 0:47.8 | The knights who once hunted you... ran. | G15: knights on the gatehouse sound a horn. G16: they flee as the horde floods past. |
| 0:53.6 | And the weakest goblin in the forest... | G17: the Goblin King on a rock above thousands of kneeling goblins, the burning castle beyond |
| 0:56.4 | became the king of an entire kingdom. | G18: the camera approaches his amber eyes, which flare; cut to black at 0:59.6 |
| 0:59.8 | *End card:* WHAT IF YOU WERE BORN AS A GOBLIN? WHAT SHOULD YOU BE BORN AS NEXT? TELL ME IN THE COMMENTS | |

## The goblin (one original design, from runt to king)
See [`../images/00_goblin_design_sheet.png`](../images/00_goblin_design_sheet.png).

**Fixed features** (identical in every scene, built from one rig):
- forest-green and olive mottled skin
- huge blade-like ears, with a **torn notch in the left ear**
- small glowing **amber eyes** under a heavy brow
- a long hooked nose and two lower fangs
- long thin arms with big three-fingered hands; short bowed legs and big flat feet

**Stages:**
- **Runt:** childlike proportions (shorter limbs, bigger head) and a leather scrap.
- **Survivor:** leather loincloth and straps, a wolf-pelt mantle, a tooth necklace, a stone-tipped spear.
- **Warlord:** the brute's spiked iron pauldron and cleaver (the same models the brute wore), a crimson rag cape.
- **King:** a jagged gold crown with a blood-red stone, a dark iron breastplate with gold trim, spiked pauldrons on both shoulders, a royal crimson cape with a gold hem, the gold-edged cleaver.

**Other characters**, all original: the tribe goblins, the kingdom's knights (great helms, azure-and-gold tabards, kite shields), the dire wolf, the tusked brute, a hare. His banner shows a crown above a notched ear.

The reference images were used only for general mood (low-poly goblin silhouettes, crowns and capes, a castle at dusk). No existing character, franchise design or artwork was reproduced.

## Look
The same PS1/PS2 renderer as the rest of the project (affine texture warp, vertex snapping, Gouraud lighting, fog, Bayer dither, 15-bit colour) at 360×640, upscaled 3× with nearest-neighbour. This video uses daylight palettes:
- golden sunlight through the canopy, with additive light shafts and dust motes
- warm sunsets
- a bright winter
- hazy green-olive fog instead of black

Characters stand on a fine local terrain layer over a coarse far ground, so they sit exactly on the rendered surface.

## Audio
All original and procedural (`../audio/synth.py`):
- **The forest:** birdsong, wind in the leaves, campfire, goblin chatter, squeaks and laughter, a growl and a distant howl.
- **The knights and the fire:** marching plate, war horns, the village burning, sword clashes.
- **Survival:** running feet, a spear throw, stone knapping, the winter wind, the wolf fight.
- **The brute:** its roar, the cleaver swing, the killing blow, the fall.
- **The army:** marching feet and a sea of voices, the charge, thousands kneeling at once, and his heartbeat before the cut.

The score moves from D dorian through D minor to D major:
- a wooden flute melody in the forest, turning sad when he is abandoned;
- war drums and minor choir for the knights, then a fast ostinato for the escape;
- the hero theme on flute, then on horn, as the seasons pass;
- dark drums for the brute;
- a war march for the return;
- a triumphant D major choir with the theme on horns for the king, cutting to silence at 0:59.6.

The narration is Kokoro-82M (Apache-2.0). Subtitles are Cinzel (SIL OFL), timed from each line's measured audio.

## Quality check
- **The goblin stays consistent:** one rig, with fixed ears, notch, eyes and fangs across all stages.
- **The hook lands:** the first two seconds are the future king raising a cleaver over his army, then a smash cut to the forest on "the weakest one in the forest".
- **Retention:** a new environment or beat every 2–4 seconds, with no repeated set-ups.
- **The story moves forward:** birth, rejection, invasion, escape, survival, the seasons, the brute, the armour, followers, the return, the rout, the king.
- **It's bright:** most scenes are daylight or sunset; the only darker moment is the burning village at dusk.
- **The payoff lands:** the final line plays over a push into the king's amber eyes, which flare, then black and the end card.

## Rebuild
Run `../build.sh`.
