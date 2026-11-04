# WHAT IF YOU WERE BORN AS A VAMPIRE?

A ~62-second vertical (9:16, 1080×1920, 30 fps) second-person dark-fantasy origin story in the PS1/PS2 low-poly style. It covers a whole lifetime in one minute: mystery, discovery, power, loss, war, the climax and the crown.

**Final video:** [`../output/what_if_you_were_born_as_a_vampire.mp4`](../output/what_if_you_were_born_as_a_vampire.mp4) (H.264 + AAC 48 kHz, −14.4 LUFS)

## Script and timing
| Start | Narration | Scene |
|------:|-----------|-------|
| 0:00.3 | You were born into a bloodline that had ruled the night for a thousand years. | V01: a gigantic gothic castle beneath a vast crimson moon, with bats circling the towers and the title on screen from frame one. V02: the newborn opens his glowing red eyes. V03: every candle in the room goes out in a wave. V04: the vampire elders stare in disbelief. |
| 0:06.0 | But by the age of five, you discovered something terrifying. | V05: the five-year-old walks an enormous moonlit hall. V06: a heartbeat; his eyes flare bright crimson. |
| 0:10.4 | You weren't like the others. | V07: he vanishes in crimson smoke. V08: he appears behind the servant carrying the candle; she slowly turns. |
| 0:13.0 | By twenty, you could move faster than the human eye could follow. | V09: armoured knights surround him in the courtyard. V10: they attack at once, and he is gone in a crimson burst. V11: crimson streaks between the knights as their swords are torn away. V12: he stands calmly while every knight behind him falls. |
| 0:20.2 | But immortality had a price. | V13: a time-lapse. Day and night flicker through the windows while his companions at the feast table grow old. |
| 0:23.0 | Everyone you loved eventually died... while you remained. | V14: one by one they are gone. The seasons pass in leaves, snow and dust, ivy and cobwebs take the hall, and the candles die. He stands alone, unchanged. |
| 0:28.2 | Three hundred years later, humanity gathered an army to destroy you. | V15: thousands of hunters with torches and silver banners stretch across the battlefield at a crimson sunset. V16: he watches from his balcony. V17: his eyes begin to glow. |
| 0:36.3 | They brought an army. | V18: he raises his hand, the sky turns crimson, and lightning strikes. |
| 0:38.5 | You brought the night itself. | V19: thousands of bats pour from the towers. V20: he dissolves into the swarm. V21: the swarm sweeps into the army, scattering the soldiers and their torches. There is no gore. |
| 0:46.6 | By sunrise, even the oldest vampires had begun to fear your name. | V22: at dawn he stands on the battlefield in black-and-crimson royal armour, wrapped in a crimson aura. V23: vampires and elders approach and kneel around him. |
| 0:54.0 | And so, you became the Vampire King. | V24: he sits on a black bat-winged throne in an enormous throne room as a giant shadow of wings unfolds behind him. |
| 0:57.2 | The one creature even the darkness feared. | V25: the camera pushes into his glowing eyes for the final close-up, then the title. |

## The vampire (one design, from cradle to throne)
See [`../images/00_vampire_design_sheet.png`](../images/00_vampire_design_sheet.png). He is one rig at every age.

**Face and hair**
- pale skin, glowing crimson eyes, sharp fangs and pointed ears
- stern brows, and slicked black hair with a widow's peak

**Clothing**
- a black frock coat over a grey waistcoat with silver buttons, a crimson cravat and crimson cuffs
- a long black cloth cape with a tall standing collar lined in crimson

**Stages**
- newborn: a black silk swaddle
- child at five
- noble at twenty
- king: adds spiked black-and-crimson plate and an iron crown with a blood-red stone

As the brief asked, his silhouette includes a strongly exaggerated backside at every age. It is a normal, permanent part of the design: the cape drapes over it, and it is never mentioned, joked about or reacted to.

The reference images were used for mood only: a low-poly vampire bust, a castle under a red moon, a gothic throne room and a besieged castle. No existing character, franchise design or artwork was reproduced.

## Look
The video uses the project's PS1/PS2 renderer: affine textures, vertex snapping, Gouraud lighting, fog, dither, 15-bit colour, 360×640 upscaled 3×. The palette is crimson, black, silver and dark purple, varied across:
- a crimson moon night
- moonlit silver-blue halls and courtyard
- a candlelit nursery
- a crimson sunset
- a crimson storm
- a pink-gold dawn
- the warm, candlelit throne room

## Audio
All original and procedural (`../audio/synth.py`).

The score is in D minor:
- a vast choir and organ-like drone for the bloodline
- tremolo strings under the heartbeat
- driving strings and drums for the gift
- a music box through the centuries
- war drums and brass for the hunt
- full choir, brass and racing drums for the night awakening
- a solemn dawn horn theme
- a grand ending with a final deep impact

The sound design covers:
- castle wind and thunder
- the heartbeat
- candles being snuffed
- crimson vanish and appear whooshes
- sword draws and clashes
- armour falling
- bells through the centuries
- the army and its horns
- a sea of bat wings and squeaks
- the transformation
- cinematic bass impacts

The music ducks under the narration. The narration is Kokoro-82M (Apache-2.0) in a deep, calm, cinematic voice. Subtitles are Cinzel (SIL OFL), with key words in crimson.

## Quality check
- **The vampire stays consistent:** one rig and one set of materials from newborn to king, including the same eyes, hair, ears, fangs, cape and proportions.
- **The opening is visual:** the first two seconds are the castle under a giant crimson moon with circling bats, then the glowing eyes and the candles dying.
- **A new visual every 1–4 seconds:** 25 shots across 8 locations and 6 lighting moods.
- **The story builds:** mystery, discovery, power, loss, conflict, the climax with the bats, then evolution and the crown.
- **The climax is spectacular:** a crimson sky, lightning, bats pouring from the towers, the transformation and the sweep into the army, all without gore.
- **No logos, introductions, filler or subscribe requests.**

## Rebuild
Run `../build.sh`.
