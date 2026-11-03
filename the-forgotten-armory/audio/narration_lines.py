# Narration script for VHALDREN — EPISODE 3: THE ARMOR THAT WOULD LAST FOREVER.
PHONETIC = {"Vhaldren": "Valdren", "Cael Vorn": "Kale Vorn", "Cael": "Kale"}

def tts_text(text):
    for k, v in PHONETIC.items():
        text = text.replace(k, v)
    return text

LINES = [
    ("n01", "Every knight has a story."),
    ("n02", "But some... inherit a legacy."),
    ("n03", "Deep within a forgotten fortress, Cael discovered something untouched by time."),
    ("n04", "An armor once worn by the guardians of a kingdom that no longer exists."),
    ("n05", "When he touched it, an old sigil woke beneath his hand..."),
    ("n06", "the same sign he had carried all his life."),
    ("n07", "Piece by piece, he abandoned his old armor..."),
    ("n08", "and inherited the legacy of those who came before him."),
    ("n09", "Somewhere in the darkness, an ancient order had found its successor."),
    ("n10", "And this time... he would not walk unprotected."),
]

SUB_CHUNKS = {
    "n01": ["Every knight has a story."],
    "n02": ["But some...", "inherit a legacy."],
    "n03": ["Deep within a forgotten fortress,", "Cael discovered something", "untouched by time."],
    "n04": ["An armor once worn", "by the guardians of a kingdom", "that no longer exists."],
    "n05": ["When he touched it,", "an old sigil woke", "beneath his hand..."],
    "n06": ["the same sign", "he had carried all his life."],
    "n07": ["Piece by piece,", "he abandoned his old armor..."],
    "n08": ["and inherited the legacy", "of those who came before him."],
    "n09": ["Somewhere in the darkness,", "an ancient order", "had found its successor."],
    "n10": ["And this time...", "he would not walk unprotected."],
}
