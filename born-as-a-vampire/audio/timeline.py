"""Master timeline for WHAT IF YOU WERE BORN AS A VAMPIRE? (seconds). Mirrors render/src/film.js."""
DURATION = 62.0
NARRATION = {"n01": 0.25, "n02": 6.00, "n03": 10.35, "n04": 13.00, "n05": 20.20, "n06": 23.00, "n07": 28.20, "n08": 36.30, "n09": 38.50, "n10": 46.60, "n11": 54.00, "n12": 57.20}
SHOTS = [
    ("V01", 0.0, 1.7, "A gigantic gothic castle beneath a vast crimson moon; bats circle the towers"),
    ("V02", 1.7, 3.0, "The newborn opens his glowing red eyes"),
    ("V03", 3.0, 4.2, "Every candle in the room goes out"),
    ("V04", 4.2, 5.6, "The ancient vampire elders stare in disbelief"),
    ("V05", 5.6, 8.4, "At five, he walks an enormous moonlit gothic hall"),
    ("V06", 8.4, 10.0, "A heartbeat in another room; his eyes turn bright crimson"),
    ("V07", 10.0, 10.9, "He vanishes in crimson smoke"),
    ("V08", 10.9, 12.6, "He appears beside the servant with the candle"),
    ("V09", 12.6, 14.8, "At twenty, armoured knights surround him in the courtyard"),
    ("V10", 14.8, 16.0, "They attack at once; he is gone in a burst of crimson"),
    ("V11", 16.0, 17.4, "Too fast to follow: crimson streaks, swords fly"),
    ("V12", 17.4, 19.8, "He stands calmly; behind him every knight falls"),
    ("V13", 19.8, 23.8, "Time-lapse: his companions grow old at the feast table"),
    ("V14", 23.8, 27.8, "Seasons pass, the hall decays; he alone remains, unchanged"),
    ("V15", 27.8, 31.6, "Three hundred years later: an army of hunters at a crimson sunset"),
    ("V16", 31.6, 33.8, "He watches from his balcony"),
    ("V17", 33.8, 35.6, "His eyes begin to glow"),
    ("V18", 35.6, 38.0, "He raises his hand; the sky turns crimson"),
    ("V19", 38.0, 40.0, "Thousands of bats pour from the towers"),
    ("V20", 40.0, 41.8, "He becomes a swarm of bats"),
    ("V21", 41.8, 46.0, "The swarm sweeps into the army"),
    ("V22", 46.0, 49.8, "Sunrise: royal black-and-crimson armour, a crimson aura"),
    ("V23", 49.8, 53.6, "Even the oldest vampires kneel"),
    ("V24", 53.6, 57.4, "The Vampire King on his black throne; the shadow of wings"),
    ("V25", 57.4, 62.0, "The push into his glowing eyes; title"),
]
CUES = {"eyes": 2.1, "candles": 3.25, "elders": 4.3, "child_steps": [5.6 + 0.28 * k for k in range(10)], "heart": (8.4, 10.1), "flare": 9.3, "vanish": 10.25, "appear": 11.2,
        "draw": 13.0, "charge": 14.8, "gone": 15.35, "hits": [16.1 + 0.2 * k for k in range(7)], "fall": 17.95, "bells": [21.0, 24.6],
        "army": 27.8, "raise": 35.6, "thunder": [37.2, 38.25], "bats": 38.0, "transform": 40.55, "sweep": 42.6, "dawn": 46.0, "kneel": 51.6, "wings": 54.6, "final": 59.8, "title": 60.2}
