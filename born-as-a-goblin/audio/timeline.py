"""Master timeline for WHAT IF YOU WERE BORN AS A GOBLIN? (seconds). Mirrors render/src/film.js."""
DURATION = 62.5
NARRATION = {
    "n01": 0.20, "n02": 4.00, "n03": 8.90, "n04": 11.30, "n05": 14.20, "n06": 17.00, "n07": 19.10, "n08": 21.90, "n09": 23.50,
    "n10": 26.70, "n11": 29.70, "n12": 32.90, "n13": 37.60, "n14": 40.00, "n15": 43.40, "n16": 47.80, "n17": 53.60, "n18": 56.40,
}
SHOTS = [
    ("G00", 0.0, 2.2, "Flash-forward hook: the Goblin King raises his cleaver over his army at sunset"),
    ("G01a", 2.2, 5.2, "Crane down through sunlit giant trees into the tribe's clearing"),
    ("G01b", 5.2, 8.8, "The runt opens its amber eyes, surrounded by its tribe"),
    ("G02", 8.8, 11.2, "Smaller than all of them: the runt walks in a line of tall goblins"),
    ("G03", 11.2, 14.0, "A big goblin snatches its food; the tribe leaves it behind"),
    ("G04", 14.0, 16.8, "A dire wolf watches the runt from the treeline"),
    ("G05", 16.8, 18.9, "Knights march out of the forest at sunset with torches and a banner"),
    ("G06", 18.9, 21.6, "The settlement burns; the runt watches from the grass"),
    ("G07", 21.6, 23.4, "The runt runs through golden grass"),
    ("G08a", 23.4, 25.0, "Summer: the young survivor hunts a hare with a stone spear"),
    ("G08b", 25.0, 26.6, "Autumn: binding a stone blade by a small fire under a ruined arch"),
    ("G09", 26.6, 29.4, "Winter: a dire wolf leaps; the survivor kills it"),
    ("G10", 29.4, 32.8, "Seasons cycle on a hilltop; the goblin grows"),
    ("G11a", 32.8, 35.4, "Overgrown ruins: the tusked brute roars and swings its cleaver"),
    ("G11b", 35.4, 37.4, "The goblin leaps onto it and strikes; the brute falls"),
    ("G12", 37.4, 39.8, "The warlord rises in the brute's spiked pauldron, cleaver and a crimson cape"),
    ("G13", 39.8, 43.2, "Goblins follow him across a sunlit meadow"),
    ("G14", 43.2, 47.6, "Years later: the horde advances on the kingdom at sunset"),
    ("G15", 47.6, 49.8, "Knights on the gatehouse; one raises a war horn"),
    ("G16", 49.8, 53.2, "The knights run; the horde floods past"),
    ("G17", 53.2, 57.0, "The Goblin King on a rock above thousands of kneeling goblins"),
    ("G18", 57.0, 59.6, "The camera approaches his amber eyes; cut to black"),
    ("CARD", 59.6, 62.5, "Title and question"),
]
CUES = {
    "hook_roar": 0.4, "cleaver_up": 0.5, "wake": 6.0, "snatch": 11.65, "fall": 12.0, "wolf_growl": 14.9, "march": (16.8, 18.9), "horn_knights": 17.0,
    "burn": (18.9, 21.6), "clash": [19.3, 19.9, 20.6, 21.2], "run": (21.6, 23.4), "throw": 24.25, "hit_hare": 24.45, "knap": (25.0, 26.6),
    "wolf_leap": 27.0, "wolf_hit": 27.95, "seasons": (29.4, 32.8), "brute_roar": 33.2, "brute_swing": 35.1, "leap": 35.5, "stab": 36.2, "brute_fall": 37.0,
    "rise": 37.5, "march2": (39.8, 43.2), "army": (43.2, 47.6), "war_horn": 48.3, "charge": (49.8, 53.2), "kneel": 53.3, "eyes": 58.4, "cut": 59.6, "title": 59.7,
}
