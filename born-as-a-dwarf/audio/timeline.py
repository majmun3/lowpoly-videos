"""Master timeline for WHAT IF YOU WERE BORN AS A DWARF? (seconds). Mirrors render/src/film.js."""
DURATION = 64.0
NARRATION = {
    "n01": 0.30, "n02": 2.35, "n03": 4.50, "n04": 7.50, "n05": 10.90, "n06": 15.50, "n07": 20.30, "n08": 21.85, "n09": 24.90, "n10": 26.80,
    "n11": 29.60, "n12": 32.50, "n13": 36.00, "n14": 37.80, "n15": 43.40, "n16": 49.40, "n17": 53.30, "n18": 57.20, "n19": 60.70,
}
SHOTS = [
    ("D01", 0.0, 2.3, "Enormous green mountains; crane down over the dwarf village; the fortress gate at the head of the valley"),
    ("D02", 2.3, 4.4, "Hearth-lit home: the parents lean over the cradle"),
    ("D03", 4.4, 6.4, "The newborn's serious bearded face — then the colossal diapered rump towering behind it"),
    ("D04", 6.4, 7.4, "The parents' reaction"),
    ("D05", 7.4, 10.7, "Young dwarves spar with wooden swords in the village square"),
    ("D06", 10.7, 13.0, "You walk past; every step shakes the ground; they all stare"),
    ("D07", 13.0, 15.3, "From behind: a sword is dropped, a barrel topples"),
    ("D08", 15.3, 18.9, "Age thirty: the warrior raises the great rune axe in the training yard"),
    ("D09", 18.9, 19.9, "The swing; momentum spins him"),
    ("D10", 19.9, 21.6, "Face-first into the mud, backside in the air (slow motion)"),
    ("D11", 21.6, 24.7, "The comedic pause: recruits stare, the drill master's palm meets his face"),
    ("D12", 24.7, 26.8, "The great underground forge and its glowing rune door"),
    ("D13", 26.8, 28.8, "The hammer strike in slow motion; sparks"),
    ("D14", 28.8, 32.3, "He turns and walks away; every smith's head follows the wobble"),
    ("D15", 32.3, 35.6, "The orc horde marches on the mountain fortress at dusk"),
    ("D16", 35.6, 37.8, "Dwarf warriors on the ramparts"),
    ("D17", 37.8, 39.4, "He takes up the axe"),
    ("D18", 39.4, 43.0, "The charge, in slow motion"),
    ("D19", 43.0, 46.0, "The orc king points and laughs"),
    ("D20", 46.0, 48.2, "He slowly turns around. Silence."),
    ("D21", 48.2, 49.6, "The secret weapon: a backward hip-check, shockwave"),
    ("D22", 49.6, 53.0, "The orc king flies across the battlefield into his own army"),
    ("D23", 53.0, 57.4, "The throne hall: thousands kneel as he walks to the golden throne"),
    ("D24", 57.4, 60.6, "He sits; one final wobble; the throne creaks"),
    ("D25", 60.6, 64.0, "Pull back to the colossal statue of the king; title"),
]
def _steps(t0, first, period, t1):
    out, t = [], t0 + first
    while t < t1: out.append(round(t, 3)); t += period
    return out
CUES = {
    "reveal": 4.4, "sting": 6.4,
    "kid_steps": _steps(10.7, 0.194, 0.3875, 13.0) + _steps(13.0, 0.221, 0.443, 15.3), "big_shake": 14.4, "sword": 14.35, "barrel": 14.75,
    "lift": 15.8, "raised": 17.3, "swing": (18.9, 19.9), "splat": 20.535, "slip": 23.55,
    "strike": 28.09, "turn": 29.0, "forge_steps": _steps(29.5, 0.234, 0.469, 32.3),
    "horn": 36.0, "grab": 38.35, "charge_steps": _steps(39.4, 0.12, 0.239, 43.0),
    "laugh": (43.5, 46.0), "hush": (46.0, 49.0), "hit": 49.05, "fly": (49.6, 51.35), "crash": 51.35, "cheer": (51.6, 53.2),
    "king_steps": _steps(53.0, 0.129, 0.258, 57.2), "sit": 58.6, "title": 62.5,
}
