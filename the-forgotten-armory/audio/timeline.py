"""Shared master timeline for VHALDREN — EPISODE 3: THE ARMOR THAT WOULD LAST FOREVER. Mirrors render/src/film.js."""

DURATION = 63.0

NARRATION = {
    "n01": 0.30, "n02": 2.40, "n03": 5.90, "n04": 16.90, "n05": 25.20, "n06": 29.00,
    "n07": 32.20, "n08": 36.90, "n09": 44.80, "n10": 55.70,
}

SHOTS = [
    ("S01", 0.0, 4.8, "Hook: the forgotten fortress on its crag in a storm; Cael on the causeway"),
    ("S02", 4.8, 7.6, "Cael (old armour) reaches the great gate"),
    ("S03", 7.6, 11.0, "Inside: the stone doors grind open; his silhouette in the light"),
    ("S04", 11.0, 14.6, "The hall of a fallen order: racks of broken swords, banners, light shafts"),
    ("S05", 14.6, 16.8, "Close: a broken shield and a broken blade on the floor"),
    ("S06", 16.8, 20.0, "At the end of the hall: a complete armour on its stand, the shield beside it, in a beam of light"),
    ("S07", 20.0, 21.8, "Close-up: the enclosed helm"),
    ("S08", 21.8, 23.4, "Close-up: breastplate and pauldrons"),
    ("S09", 23.4, 25.0, "Close-up: the Watchful Ember shield"),
    ("S10", 25.0, 29.0, "He touches the breastplate; the sigil wakes beneath his hand"),
    ("S11", 29.0, 31.8, "Close: the brass diamond he has always worn on his brow"),
    ("S12", 31.8, 34.2, "Transformation I: the old cloak and tabard fall away"),
    ("S13", 34.2, 36.6, "Transformation II: breastplate and pauldrons fastened"),
    ("S14", 36.6, 38.8, "Transformation III: gauntlets and vambraces"),
    ("S15", 38.8, 41.0, "Transformation IV: the old helm is lifted away (from behind)"),
    ("S16", 41.0, 44.0, "Transformation V: the new helm is lowered on; the eye-slit takes his ember"),
    ("S17", 44.0, 48.2, "The reveal: Cael in the Vigil Plate"),
    ("S18", 48.2, 50.4, "He takes up the shield"),
    ("S19", 50.4, 52.6, "He draws Vowbrand"),
    ("S20", 52.6, 55.0, "Hero framing: shield and sword"),
    ("S21", 55.0, 59.6, "He walks out of the fortress into the storm"),
    ("BLACK", 59.6, 63.0, "Cut to black; title and question"),
]

CUES = {
    "thunder": [1.1, 4.0], "steps_ext": (0.0, 7.6, 0.8), "doors": 7.8, "steps_in": [(9.2, 16.8, 0.8), (16.8, 20.0, 0.5)],
    "reveal": 16.9, "touch": 26.2, "sigil": 26.9, "brow": 29.3,
    "cloak_fall": 32.8, "buckle": [34.6, 35.0, 35.4, 35.9, 36.2], "pauldron": 35.35, "gauntlet": 37.1, "gauntlet2": 37.8,
    "helm_off": 39.6, "helm_on": 42.9, "ember": 43.2, "reveal2": 44.0, "shield": 48.6, "shield_set": 49.2, "draw": 51.15,
    "guard": 51.8, "steps_out": (55.0, 59.6, 0.82), "cut": 59.6, "title": 59.9,
}
