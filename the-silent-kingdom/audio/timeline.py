"""Shared master timeline for VHALDREN — EPISODE 2: THE SILENT KINGDOM (seconds). Mirrors render/src/film.js."""

DURATION = 63.0

NARRATION = {
    "n01": 0.25, "n02": 3.35, "n03": 5.85, "n04": 9.80, "n05": 13.60, "n06": 18.00,
    "n07": 22.00, "n08": 24.35, "n09": 26.00, "n10": 32.60, "n11": 35.80, "n12": 38.00,
    "n13": 41.30, "n14": 46.10, "n15": 48.60, "n16": 50.90, "n17": 55.00, "n18": 57.85,
}

SHOTS = [
    ("S01", 0.0, 5.5, "Hook: a hooded figure with a blank porcelain face, seated in lamplight under falling snow"),
    ("S02", 5.5, 9.6, "Cael Vorn crosses a frozen mountain pass in a blizzard"),
    ("S03", 9.6, 13.4, "From the pass: Aurelmoor, a valley city of a thousand golden lights"),
    ("S04", 13.4, 15.6, "Through the great gate into the silent city"),
    ("S05", 15.6, 17.9, "Streets of motionless people seated at tables and standing at doors"),
    ("S06", 17.9, 21.9, "Close: centuries of snow on a seated figure's shoulders"),
    ("S07", 21.9, 25.8, "One of them turns its head: it has no face"),
    ("S08", 25.8, 29.4, "High angle: every figure in the street turns toward Cael"),
    ("S09", 29.4, 30.5, "Cael raises Vowbrand into guard"),
    ("S10", 30.5, 32.5, "The Wakebell rings above the city; a shockwave ring; snow cascades"),
    ("S11", 32.5, 35.6, "The Stilled close in around him"),
    ("S12", 35.6, 37.9, "They kneel and point down; golden light seeps from below"),
    ("S13", 37.9, 41.1, "The plaza opens; the frozen fountain sinks into golden light"),
    ("S14", 41.1, 46.0, "The vault below: the Stillwork, gimbal rings around a golden core"),
    ("S15", 46.0, 48.5, "The iris opens: the machine sees him"),
    ("S16a", 48.5, 51.0, "Golden threads rise from the core to every soul above"),
    ("S16b", 51.0, 54.8, "Cael walks toward the open core"),
    ("S17", 54.8, 57.4, "He raises Vowbrand; the kingdom shakes; hard cut to black before the blow"),
    ("BLACK", 57.4, 60.0, "Black: 'Others fear what comes after it.'"),
    ("CARD", 60.0, 63.0, "Title card and question"),
]

CUES = {
    "steps": [(13.4, 17.9, 0.82), (17.9, 21.9, 0.7)], "turn": (22.8, 24.3), "no_face": 24.3, "all_turn": (26.1, 28.6),
    "sword": 29.45, "bell": 30.62, "whisper": (32.5, 41.0), "open": 38.2, "iris": 46.4, "cut": 57.4, "title": 60.0,
}
