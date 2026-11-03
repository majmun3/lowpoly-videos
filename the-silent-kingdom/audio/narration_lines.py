# Narration script for VHALDREN — EPISODE 2: THE SILENT KINGDOM.
# PHONETIC maps on-screen spellings to TTS-friendly spellings.
PHONETIC = {"Vhaldren": "Valdren", "Cael Vorn": "Kale Vorn", "Aurelmoor": "Oralmoor"}

def tts_text(text):
    for k, v in PHONETIC.items():
        text = text.replace(k, v)
    return text

LINES = [
    ("n01", "What if you found a kingdom where nobody could die..."),
    ("n02", "but nobody was truly alive?"),
    ("n03", "Beyond the frozen peaks of Vhaldren, I found Aurelmoor."),
    ("n04", "From afar, a city of a thousand golden lights."),
    ("n05", "Up close... nobody spoke. Nobody moved. Nobody breathed."),
    ("n06", "Snow lay on their shoulders, as if it had for centuries."),
    ("n07", "Then one of them turned its head."),
    ("n08", "It had no face."),
    ("n09", "And every soul in Aurelmoor turned... toward me."),
    ("n10", "They came for me. But they did not attack."),
    ("n11", "They were pointing. Down."),
    ("n12", "Beneath the city, something was still breathing."),
    ("n13", "A machine that had stolen their deaths... and kept their souls from leaving."),
    ("n14", "And when it saw me... it woke."),
    ("n15", "It was never keeping them alive."),
    ("n16", "It was waiting for someone who could finally switch it off."),
    ("n17", "Some kingdoms fear death."),
    ("n18", "Others fear what comes after it."),
]

SUB_CHUNKS = {
    "n01": ["What if you found a kingdom", "where nobody could die..."],
    "n02": ["but nobody", "was truly alive?"],
    "n03": ["Beyond the frozen peaks", "of Vhaldren,", "I found Aurelmoor."],
    "n04": ["From afar,", "a city of a thousand", "golden lights."],
    "n05": ["Up close...", "nobody spoke.", "Nobody moved.", "Nobody breathed."],
    "n06": ["Snow lay on their shoulders,", "as if it had for centuries."],
    "n07": ["Then one of them", "turned its head."],
    "n08": ["It had no face."],
    "n09": ["And every soul in Aurelmoor", "turned...", "toward me."],
    "n10": ["They came for me.", "But they did not attack."],
    "n11": ["They were pointing.", "Down."],
    "n12": ["Beneath the city,", "something was still breathing."],
    "n13": ["A machine", "that had stolen their deaths...", "and kept their souls", "from leaving."],
    "n14": ["And when it saw me...", "it woke."],
    "n15": ["It was never", "keeping them alive."],
    "n16": ["It was waiting for someone", "who could finally", "switch it off."],
    "n17": ["Some kingdoms fear death."],
    "n18": ["Others fear", "what comes after it."],
}
