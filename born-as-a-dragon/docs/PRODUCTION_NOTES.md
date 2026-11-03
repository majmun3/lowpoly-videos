# WHAT IF YOU WERE BORN AS A DRAGON?

A ~58-second vertical (9:16, 1080×1920, 30 fps) second-person "What If" short in a PS1/PS2-era low-poly dark-fantasy style. It is a standalone video and its world is original.

**Final video:** [`../output/what_if_you_were_born_as_a_dragon.mp4`](../output/what_if_you_were_born_as_a_dragon.mp4) (H.264 + AAC 48 kHz, −14.1 LUFS)

## Script (second person) and timing
| Start | Line | Scene |
|------:|------|-------|
| 0:00.2 | What if you weren't born human... but as the most feared creature in the world? | D00 flash-forward: the ancient dragon roars fire over an erupting volcano. D01: the egg pulses like a heart and an amber eye opens. |
| 0:04.7 | You hatched in darkness, beneath a sleeping volcano. | D02: the shell bursts and the hatchling unfolds tiny wings |
| 0:08.35 | Small. Weak. Alone. | D03: tiny beside a lava pool in a vast cavern |
| 0:10.3 | By your fifth winter, you found the fire inside you. | D04: a cough of smoke, then the first flame |
| 0:14.1 | But fire can be seen from very far away. | D05: a frontier watchtower sees fire shoot from the volcano; alarm bells |
| 0:17.1 | The humans sent hunters. | D06: torches and spears climbing the mountain |
| 0:19.2 | So you ran. You hid. You grew. | D07: gliding through misty peaks |
| 0:21.7 | At twenty, you fought back. | D08: rearing over the palisade through arrows, then a fire sweep |
| 0:25.2 | At one hundred, you blotted out the sun. | D09: the adult crosses the sun above a castle; the world dims |
| 0:28.0 | The kingdoms stopped fighting each other... to fight you. | D10: three kingdoms' armies; the dragon lands on the ridge and roars |
| 0:32.3 | But they weren't afraid of your fire. | D11: their war banner is a horned dragon |
| 0:34.5 | A thousand years ago, one dragon burned the whole world. | D12: red flashback of burning cities under a colossal dragon |
| 0:38.45 | Its bones were never found. | D13: your ancient eye |
| 0:40.55 | Until you flew home. | D14: descending into the volcano |
| 0:42.6 | Same horns. Same scars. Same fire. | D15a–c: the skull of the last dragon, the same framing on your head, then you looming over the bones |
| 0:46.1 | You spent your whole life becoming the monster they feared... | D16a: on the erupting volcano you spread your wings and breathe fire into the sky |
| 0:49.85 | only to discover you already were. | D16b: your eye ignites; hard cut to black and silence; one heartbeat in the dark |
| 0:54.8 | *End card:* WHAT IF YOU WERE BORN AS A DRAGON? WHAT SHOULD YOU BE BORN AS NEXT? TELL ME IN THE COMMENTS | |

**The twist:** the kingdoms aren't hunting a new monster, they're hunting a returning one. The bones of the last dragon, the one that burned the world, lie in the very volcano where you hatched. The skull has the same lyre horns, the same broken left horn tip and the same claw-scars as you. The final line, "only to discover you already were", turns the story into reincarnation and history repeating.

## The dragon (one original design, four life stages)
See [`../images/00_dragon_design_sheet.png`](../images/00_dragon_design_sheet.png).
- **Colour and eyes:** charcoal-black scales with deep-red glowing seams between some scales; glowing amber eyes under heavy brow ridges.
- **Horns and spikes:** the signature horn crown is two great horns that sweep back and curl up at the tips like a lyre, with small crown spurs, a nasal horn, and three cheek spikes per side. Dorsal spikes run along the back.
- **Tail and wings:** a long tail ending in a spade blade with two barbs; bat-like wings with three long fingers and a thumb claw.
- **Stages:** the same rig is scaled and re-proportioned for each stage.
  - Hatchling (≈0.7 m): oversized head and eyes, horn nubs, small wings.
  - Juvenile and young: horns and wings grow.
  - Adult (≈14 m).
  - Ancient (≈37 m): tattered wings, three claw-scars over the left eye, a broken left horn tip, stronger inner glow.
- **Originality:** the design is not based on any existing film, game or book dragon. The uploaded images were used only as general mood references (glowing egg, winged silhouettes against castles, a retro 3D look).

## Visual style
A real low-poly 3D production rendered in headless Chromium with the series' PS1/PS2 shader engine: affine texture warp, vertex snapping, Gouraud lighting, fog, Bayer dither, 15-bit colour and bloom at 360×640, upscaled 3× with nearest-neighbour. The dragon's wing membranes are rebuilt every frame from the bone positions, and fire breath is a GPU particle stream aimed from the mouth.

## Audio
All original and procedural (`../audio/synth.py`, built on the series toolkit):
- **The dragon:** a heartbeat in the egg, shell crackle, the hatchling's chirp, layered roars that deepen with age, fire breath, wing beats.
- **Its world:** lava bubbling, alarm bells, hunters' horns, footsteps, torches, arrows, crowds, army horns and drums, eruption rumble, thunder.
- **The score** is in C minor and grows with the dragon:
  - a drone and a soft choir at birth;
  - a pulsing string ostinato from the hunt;
  - battle drums and brass from the first fight;
  - a dissonant lament for the past;
  - three hits on "Same horns. Same scars. Same fire.";
  - a full Cm → A♭ → E♭ → G climax that cuts to silence at 0:54.6.

The narration is Kokoro-82M (Apache-2.0) with the series voice at speed 1.0 for punchier pacing. Subtitles are Cinzel (SIL OFL), timed from each line's start and measured duration.

## Quality check
- **The dragon stays consistent:** every stage uses the same rig and features.
- **The hook lands:** the first 1.6 s are an erupting volcano, a roaring fire-breathing dragon and a smash cut to the egg.
- **The story moves forward:** birth, fire, hunted, growth, battle, war, revelation, return, ending.
- **Subtitles are synchronised:** they are generated from the narration timeline and audio durations, in short phrases.
- **There are no dead stretches:** the longest gap without narration is the roar and fire beat at 0:30.9–0:32.3.
- **The ending holds:** the final line, the eye igniting, a cut to black, silence, one heartbeat, then a question for comments.

## Rebuild
Run `../build.sh`. It renders the frames, keyframe images and design sheet, synthesises audio and subtitles, and assembles the MP4.
