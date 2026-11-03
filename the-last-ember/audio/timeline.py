"""Shared master timeline for THE LAST EMBER (seconds). Mirrors render/src/film.js."""

DURATION = 64.0

# narration line id -> start time on the master timeline
NARRATION = {
    "n01": 0.30, "n02": 3.05, "n03": 5.40, "n04": 9.55, "n05": 12.45, "n06": 17.00,
    "n07": 21.15, "n08": 24.40, "n09": 27.85, "n10": 30.75, "n11": 34.60, "n12": 38.70,
    "n13": 41.40, "n14": 43.45, "n15": 48.70, "n16": 51.30, "n17": 54.70, "n18": 57.30,
}

SHOTS = [
    ("S01", 0.0, 3.0, "Hook: the keel-prow helm in darkness"),
    ("S02", 3.0, 5.2, "The dying Ember Heart chained to the cathedral spire"),
    ("S03", 5.2, 9.5, "Glide over the ruined kingdom of Vhaldren"),
    ("S04", 9.5, 12.4, "Village of ash statues; one crumbles"),
    ("S05", 12.4, 15.0, "Cael Vorn crosses the bridge of Odran"),
    ("S05b", 15.0, 16.9, "Close-up: the Pilgrim's Spark lantern and the Weeping Ember sigil"),
    ("S06", 16.9, 21.1, "Ashwights emerge from the ash forest"),
    ("S07", 21.1, 24.2, "Parry, slow-motion slash, an Ashwight bursts into ash"),
    ("S08", 24.2, 27.7, "The Knellwyrm rises from the abyss beside the bridge"),
    ("S09", 27.7, 30.6, "Low angle: the Knellwyrm towers and roars"),
    ("S10", 30.6, 34.3, "The leap and the killing blow; the beast crashes onto the bridge"),
    ("S11", 34.3, 38.6, "The Ashen Cathedral; tilt up to the chained Heart"),
    ("S12", 38.6, 40.8, "Summit: the empty Keeper's Seat beneath the Heart"),
    ("S13", 40.8, 43.3, "Close-up: Cael looks up (silence)"),
    ("S14", 43.3, 48.4, "The carved wall: wanderer, keeper, beast"),
    ("S15a", 48.4, 50.0, "Flashback: the dead beast's fused helm bears the sigil"),
    ("S15b", 50.0, 51.1, "Match cut: the same sigil on Cael's helm"),
    ("S16", 51.1, 54.6, "He takes the seat; fire climbs the chains"),
    ("S17", 54.6, 57.2, "Dawn returns to Vhaldren"),
    ("S18", 57.2, 64.0, "The final keeper burns; fade; title"),
]

# key sound events (seconds)
CUES = {
    "hook_boom": 0.05, "pulse": [0.6, 3.0], "sun_flare": 3.9, "crumble": 11.0,
    "steps": [(12.4, 16.9, 0.85, 0.0), (34.3, 38.6, 0.8, 0.2)],   # (start, end, cycles/s, phase)
    "parry": 21.92, "slash": (22.65, 23.46), "ash_burst": 23.46,
    "wyrm_rise": 24.2, "roar": 28.5, "strike_whoosh": (31.25, 31.8), "strike": 31.8, "crash": 32.35,
    "cathedral_bell": 34.4, "chains": 38.6, "silence": (40.8, 43.3), "flash1": 48.4, "flash2": 50.0,
    "ignite": 52.05, "dawn": 54.6, "title_bell": 62.0, "fade": 61.3,
}
