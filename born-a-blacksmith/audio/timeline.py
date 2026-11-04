"""Master timeline for BEING BORN AS A BLACKSMITH IN MEDIEVAL TIMES WAS HORRIFYING (seconds). Mirrors render/src/film.js."""
DURATION = 62.0
NARRATION = {"n01": 0.3, "n02": 6.6, "n03": 8.7, "n04": 13.7, "n05": 21.1, "n06": 28.9, "n07": 33.5, "n08": 37.8, "n09": 45.6, "n10": 54.1}
SHOTS = [
    ("B01", 0.0, 1.4, "Hook: the father's hammer lands on glowing iron; sparks fly at the lens"), ("B02", 1.4, 3.2, "A medieval village on a cold morning; the smithy beside the family home"),
    ("B03", 3.2, 4.8, "Inside, the newborn cries in his cradle"), ("B04", 4.8, 6.6, "The father strikes glowing metal with an enormous hammer"),
    ("B05", 6.6, 9.2, "Age seven: hauling a heavy coal bucket"), ("B06", 9.2, 10.8, "His father points to the furnace"), ("B07", 10.8, 13.6, "Working the bellows; the fire roars; sweat"),
    ("B08", 13.6, 16.0, "Age twelve: the father demonstrates the blow"), ("B09", 16.0, 18.4, "He tries the same movement"), ("B10", 18.4, 20.8, "He misses: the hammer hits the anvil, the bar jumps"),
    ("B11", 20.8, 23.2, "A careless touch of hot iron; he jerks his hand back"), ("B12", 23.2, 25.4, "Close-up: the scorched leather glove"), ("B13", 25.4, 28.8, "He wraps the injured hand in linen"),
    ("B14", 28.8, 31.2, "The busy forge: a farmer, a soldier and a villager wait"), ("B15", 31.2, 33.6, "Blow after blow"), ("B16", 33.6, 35.6, "They wanted them yesterday"), ("B17", 35.6, 37.6, "Quenching"),
    ("B18", 37.6, 40.4, "Late at night, still hammering"), ("B19", 40.4, 43.6, "He wipes the sweat from his sooty face"), ("B20", 43.6, 45.6, "Rough, scarred hands"),
    ("B21", 45.6, 48.6, "Old, grey, beside a dying fire"), ("B22", 48.6, 51.6, "Trembling hands fail to lift the hammer"), ("B23", 51.6, 52.9, "The man he used to be"),
    ("B24", 52.9, 56.6, "He lays the hammer on the anvil; the fire fades"), ("B25", 56.6, 59.0, "The next morning: a cold forge, the hammer on the anvil"), ("B26", 59.0, 62.0, "A young apprentice picks it up"),
]
# hammer contact times (computed from each shot's strike cycle: contact at 60% of every period); weight = loudness
HITS = [(0.18, 1.0), (1.18, 1.0), (2.0, 0.35), (3.0, 0.35), (5.17, 1.0), (6.12, 1.0), (6.86, 0.45), (7.96, 0.45), (9.06, 0.45), (14.36, 0.9), (15.46, 0.9), (16.8, 0.75),
        (29.34, 0.8), (30.24, 0.8), (31.14, 0.8), (31.392, 1.0), (32.212, 1.0), (33.032, 1.0), (33.81, 0.6), (34.66, 0.6), (35.51, 0.6), (38.39, 0.7), (39.54, 0.7), (51.76, 0.8), (52.61, 0.8)]
CUES = {"miss": 18.87, "cry": (3.2, 4.8), "bucket": (6.6, 9.2), "bellows": [11.17, 12.67], "touch": 21.85, "sizzle": (21.85, 25.4), "wrap": (25.6, 28.2), "crowd": (28.8, 36.0), "tap": (33.6, 35.6),
        "quench": 36.4, "night": (37.6, 45.6), "breath": (40.4, 43.6), "old": (45.6, 52.9), "knock": 51.2, "place": 54.3, "morning": (56.6, 62.0), "steps": (59.0, 60.4), "lift": 61.05, "title": 59.6}
