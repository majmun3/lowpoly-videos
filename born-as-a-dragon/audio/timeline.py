"""Master timeline for WHAT IF YOU WERE BORN AS A DRAGON? (seconds). Mirrors render/src/film.js."""
DURATION = 58.5
NARRATION = {
    "n01": 0.20, "n02": 4.70, "n03": 8.35, "n04": 10.30, "n05": 14.10, "n06": 17.10, "n07": 19.20, "n08": 21.70, "n09": 25.20,
    "n10": 28.00, "n11": 32.30, "n12": 34.50, "n13": 38.45, "n14": 40.55, "n15": 42.60, "n16": 46.10, "n17": 49.85,
}
SHOTS = [
    ("D00", 0.0, 1.6, "Flash-forward hook: the ancient dragon roars fire from an erupting volcano"),
    ("D01", 1.6, 4.6, "A charcoal egg with glowing veins pulses like a heart; an amber eye opens in a crack"),
    ("D02", 4.6, 8.3, "The shell bursts; the hatchling unfolds its tiny wings"),
    ("D03", 8.3, 10.2, "Small, weak, alone: the hatchling beside a lava pool in a vast cavern"),
    ("D04", 10.2, 14.0, "Fifth winter: the juvenile coughs smoke, then its first fire"),
    ("D05", 14.0, 16.9, "A frontier watchtower sees fire shoot from the volcano"),
    ("D06", 16.9, 19.1, "Hunters with torches and spears climb toward the mountain"),
    ("D07", 19.1, 21.6, "The young dragon glides through misty peaks"),
    ("D08a", 21.6, 23.0, "At twenty: it rears over the hunters' palisade as arrows fly"),
    ("D08b", 23.0, 25.1, "Its fire sweeps the palisade and camp"),
    ("D09", 25.1, 27.9, "At one hundred: the adult crosses the sun above a castle"),
    ("D10", 27.9, 32.2, "Three kingdoms' armies; the dragon lands on the ridge and roars"),
    ("D11", 32.2, 34.4, "Their war banner: a horned dragon"),
    ("D12", 34.4, 38.3, "Flashback: a thousand years ago, one dragon burns the world"),
    ("D13", 38.3, 40.4, "The ancient dragon's amber eye"),
    ("D14", 40.4, 42.4, "It flies home into the volcano"),
    ("D15a", 42.4, 43.55, "The skull of the last dragon: same lyre horns, the left tip broken"),
    ("D15b", 43.55, 44.75, "Match cut: your own head, the same horns"),
    ("D15c", 44.75, 46.0, "You loom over the bones of the last dragon"),
    ("D16a", 46.0, 51.8, "On the erupting volcano you spread your wings and breathe fire into the sky"),
    ("D16b", 51.8, 54.6, "Your eye ignites; cut to black"),
    ("CARD", 54.6, 58.5, "Black; title and question"),
]
CUES = {
    "hook_roar": 0.15, "heartbeats": [1.97, 3.47], "crack": 4.95, "chirp": 7.3, "cough": 11.1, "first_fire": (12.4, 13.6),
    "jet": 14.25, "alarm": (14.6, 16.9), "horn_hunt": 17.0, "steps": (16.9, 19.1), "glide": (19.1, 21.6),
    "young_roar": 21.75, "arrows": (21.7, 23.0), "sweep": (23.05, 25.0), "wingbeats_sun": [25.5, 27.2], "army_drums": (27.9, 30.5),
    "land": 29.5, "adult_roar": 30.7, "banner": (32.2, 34.4), "flash_in": 34.4, "ancient_roar_past": 35.6, "flash_out": 38.3,
    "breath": 38.7, "descent_beats": [40.6, 41.7], "bone_hits": [42.42, 43.57, 44.77], "climax_roar": 48.0, "climax_fire": (48.4, 51.0),
    "ignite": (52.2, 54.3), "final_hit": 54.35, "cut": 54.6, "last_heartbeat": 56.2,
}
