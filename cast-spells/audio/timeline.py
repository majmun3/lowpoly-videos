"""Master timeline for TODAY YOU WILL LEARN HOW TO CAST SPELLS (seconds). Mirrors render/src/film.js."""
DURATION = 62.0
NARRATION = {
    "n01": 0.30, "n02": 6.45, "n03": 9.40, "n04": 14.90, "n05": 16.80, "n06": 20.35, "n07": 25.85, "n08": 28.20,
    "n09": 32.60, "n10": 37.30, "n11": 39.75, "n12": 42.95, "n13": 47.35, "n14": 51.10, "n15": 56.40,
}
SHOTS = [
    ("W01", 0.0, 3.0, "Hook: the wizard strikes his staff on the ground; a ring of light bursts out"),
    ("W02", 3.0, 6.2, "The sunlit clearing among ruins and the wizard tower; mana spirals into the staff"),
    ("W03", 6.2, 9.4, "THE BASICS: the hand on the staff; mana motes rise"),
    ("W04", 9.4, 14.7, "Focus, breathe, channel: a blue aura, the rune circle, the standing stones awaken"),
    ("W05", 14.7, 16.6, "LESSON I: he turns to the stone target"),
    ("W06", 16.6, 20.3, "Flame gathers above his palm, grows, and compresses"),
    ("W07", 20.3, 22.3, "Release: the fireball flies, chased by the camera"),
    ("W08", 22.3, 25.6, "Slow motion: the target explodes"),
    ("W09", 25.6, 28.0, "LESSON II: the sky darkens; sparks crawl over the crystal"),
    ("W10", 28.0, 32.6, "Arcs leap between his fingers and the crystal"),
    ("W11", 32.6, 35.6, "Unleash: a bolt from the sky and the staff strikes the menhir (slow motion)"),
    ("W12", 35.6, 37.0, "Aftermath: arcs crawl over the scorched stone"),
    ("W13", 37.0, 39.6, "LESSON III: a tusked brute charges from the trees"),
    ("W14", 39.6, 42.6, "The rune shield rises around him"),
    ("W15", 42.6, 47.0, "The brute strikes the shield and is thrown back (slow motion)"),
    ("W16", 47.0, 51.0, "MASTERY: a hill above a kingdom at golden hour"),
    ("W17", 51.0, 55.4, "He raises the staff; fire, lightning and mana orbit him"),
    ("W18", 55.4, 62.0, "A beam of combined magic bursts into rings over the kingdom"),
]
CUES = {
    "slam": 0.5, "gather": (3.0, 6.2), "mana": (6.2, 14.7), "aura": 9.6, "stones": 11.0, "turn": 14.8,
    "flame": (16.75, 20.0), "compress": 19.0, "release": 20.62, "fly": (20.6, 22.65), "impact": 22.65,
    "storm": 25.6, "sparks": (26.6, 28.0), "arcs": (28.0, 32.6), "bolt": 33.0, "thunder": 33.15, "after": (35.6, 37.0),
    "brute_roar": 37.1, "brute_run": (37.6, 39.6), "shield_up": 39.8, "shield_hum": (40.0, 47.0), "brute_run2": (42.6, 43.1), "swing": 43.2, "hit": 43.55, "brute_fall": 44.9,
    "hill": 47.0, "swirl": (51.4, 56.5), "beam": 56.0, "burst": 56.5,
}
