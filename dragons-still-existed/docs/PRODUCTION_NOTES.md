# WHAT IF DRAGONS STILL EXISTED?

A ~62-second vertical (9:16, 1080×1920, 30 fps) alternate-history documentary in PS1/PS2 low-poly 3D. It shows a modern Earth where dragons never went extinct.

What it deliberately leaves out:
- kings and kingdoms
- heroes and battles
- transformations

It shows only the believable consequences, moving from everyday life through transportation, the economy, danger, regulation and the military, to a calm ending.

**Final video:** [`../output/what_if_dragons_still_existed.mp4`](../output/what_if_dragons_still_existed.mp4) (H.264 + AAC 48 kHz, −14.0 LUFS)

## Script and timing
| Start | Narration | Scene |
|------:|-----------|-------|
| 0:00.3 | What if dragons had never gone extinct? | D01: the first frame is a massive dragon flying between skyscrapers above the traffic, with the title on screen. D02: its shadow sweeps the street and people look up. D03: an aerial chase above the avenue. |
| 0:06.1 | By now, seeing one above your apartment would be completely normal. | D04: a dragon rests on an apartment roof while people below walk a dog and carry their shopping. D05: an ordinary bus stop, where one man is on his phone. D06: a dragon flies past a traffic light as it turns green. |
| 0:13.1 | Air travel would look very different. | D07: a dragon lands on the airport's marked Dragon Landing Zone, next to the windsocks, a hangar and a taxiing airliner. |
| 0:15.7 | Some people would even commute on domesticated dragons. | D08: a commuter in a suit climbs the boarding steps to a saddled dragon while others queue. D09: above the clouds, dragons fly alongside a passenger airliner. |
| 0:20.3 | Entire industries would exist just to feed, house and care for them. | D10: feeding day at the sanctuary, with "Dragon Feed Co." trucks, forklifts and crates of meat. D11: veterinarians on a scaffold examine a dragon. D12: the scale of it: barns, paddocks and a convoy of feed trucks. |
| 0:27.1 | But living alongside a creature that can breathe fire wouldn't always be safe. | D13: a dragon loses control in flight, with a burst of fire. D14: it comes down hard on a rooftop, bringing debris, flames and smoke. D15: fire engines, police and an ambulance arrive. D16: officers evacuate the street. |
| 0:35.3 | Governments would need strict laws. | D17: "No Fly Zone" and "Dragon Air Lane" signs, with a dragon keeping to its lane above the avenue. |
| 0:37.7 | Flying zones, registration, and mandatory dragon training. | D18: a police helicopter monitors the dragon corridor. D19: officers with a clipboard inspect a dragon wearing a registration tag at the Dragon Inspection & Registration station. |
| 0:43.4 | And every major military would want dragons on its side. | D20: armoured dragons stand beside fighter jets at an airbase. D21: crew inspect a harness. D22: a dragon spreads its wings and roars as two jets take off. |
| 0:52.2 | Eventually, dragons wouldn't be legends anymore. | D23: at sunset, a dragon glides between the towers while the city's windows light up. |
| 0:56.0 | They'd just be another part of everyday life. | D24: traffic carries on and people walk home beneath it. D25: a wide aerial view of the city lit for the night, with dragons in the distance. Title at 0:59.6. |

## People
See [`../images/00_design_sheet.png`](../images/00_design_sheet.png).

Every human, in every shot, shares one body type with a strongly exaggerated backside. This includes:
- pedestrians, commuters and office workers
- police and firefighters
- pilots, ground crew and veterinarians
- soldiers

It is simply a trait of humanity in this world. It is clearly visible, never hidden, never mentioned, never joked about, and no one reacts to it.

Everyone wears realistic modern clothes: t-shirts and jeans, suits and ties, police vests and caps, fire turnout gear, pilot uniforms, hi-vis vests and hard hats, scrubs, and camouflage.

Crowds are instanced with the same proportions.

## Dragons
The dragons are one original rig, the Ashborn from *What If You Were Born as a Dragon?*, at modern-city scale (about 30 m long). It is used in five species palettes: slate, rust, moss, cobalt and ash.

They move like large animals:
- slow, heavy wingbeats and glides
- folded wings at rest
- landing flares
- a lazy neck sway on rooftops

Human-made gear: commuter saddles, registration tags, and military armour plates.

## Look
The same PS1/PS2 renderer as the rest of the project. The city is procedural: glass towers, offices and brick blocks with windows that light up at dusk. It also has lane markings and crosswalks, traffic lights, street lamps, trees, and instanced traffic (cars, taxis, buses).

Other locations:
- an airport
- a countryside sanctuary
- an airbase
- a flight above the clouds

Lighting goes from natural daylight, to sunset, to dusk with the city lights coming on.

## Audio
All original and procedural (`../audio/synth.py`).

**Music.** Subtle and mysterious, in a documentary style:
- soft choir pads and a hovering drone
- a gentle plucked pulse through the everyday sections
- low tremolo strings and a taut pulse for the danger
- measured, neutral music for regulation
- firmer brass for the military
- a warm, open ending

The music never competes with the narration: music and effects duck under the voice.

**Sound design:**
- distant city traffic, passing cars, horns and wind
- huge, slow wingbeats and deep roars
- a bus and the crossing signal
- an airliner's hum and the engines of jets taking off
- forklift beeps and crates at the sanctuary
- the fire, the crash, debris and the crowd
- emergency sirens and a police helicopter
- an inspection stamp

The narration is Kokoro-82M (Apache-2.0): a deep, calm documentary voice. Subtitles are Cinzel (SIL OFL) with key words in amber.

## Quality check
- **Instant concept:** frame one is a dragon between skyscrapers above traffic.
- **Constant novelty:** 25 shots, a new visual every 1.8–3.2 s, across a city street, rooftop, bus stop, airport, sky, sanctuary, emergency scene, regulation, airbase and sunset.
- **It stays grounded:** a modern Earth only, with no king, throne, battle, chosen one or transformation, and a calm ending.
- **The people are consistent:** every human shares the same proportions in every scene, and no one comments on them.
- **The dragons read as enormous animals:** they are skyscraper-scale, cast shadows over the street, and dwarf buses and jets.
- **No logos, introductions, filler or subscribe requests.**

## Rebuild
Run `../build.sh`.
