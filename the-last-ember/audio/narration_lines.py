# Narration script for THE LAST EMBER. Each entry: (id, text).
# Timing (start seconds) is assigned in timeline.json after synthesis.
# PHONETIC maps on-screen spellings to TTS-friendly spellings.
PHONETIC = {"Vhaldren": "Valdren", "Cael Vorn": "Kale Vorn", "Ashwights": "Ash-wights", "Knellwyrm": "Knell-wurm"}

def tts_text(text):
    for k, v in PHONETIC.items():
        text = text.replace(k, v)
    return text

LINES = [
    ("n01", "The last fire in the world called my name."),
    ("n02", "I should never have answered."),
    ("n03", "For a thousand years, the Ember Heart kept Vhaldren alive."),
    ("n04", "Now it was dying... and so were we."),
    ("n05", "I am Cael Vorn. A wanderer, with no kingdom left to serve."),
    ("n06", "The soldiers I once marched beside had become Ashwights."),
    ("n07", "Grey shells, with nothing left but hunger."),
    ("n08", "Beneath the bridge of Odran, the Knellwyrm woke."),
    ("n09", "Every step it took... tolled a funeral."),
    ("n10", "I killed it. I told myself it was a monster."),
    ("n11", "At the summit of the Ashen Cathedral, the Heart was waiting."),
    ("n12", "It did not need a savior."),
    ("n13", "It needed a keeper."),
    ("n14", "Carved in the stone, I saw the truth. Every keeper... becomes a beast."),
    ("n15", "The Knellwyrm... wore my crest."),
    ("n16", "Someone has to burn, so the world can see."),
    ("n17", "The dawn returned to Vhaldren."),
    ("n18", "And in a thousand years... another wanderer will come to kill me."),
]

# On-screen subtitle phrasing (short, readable chunks per line).
SUB_CHUNKS = {
    "n01": ["The last fire in the world", "called my name."],
    "n02": ["I should never", "have answered."],
    "n03": ["For a thousand years,", "the Ember Heart", "kept Vhaldren alive."],
    "n04": ["Now it was dying...", "and so were we."],
    "n05": ["I am Cael Vorn.", "A wanderer,", "with no kingdom left to serve."],
    "n06": ["The soldiers", "I once marched beside", "had become Ashwights."],
    "n07": ["Grey shells,", "with nothing left but hunger."],
    "n08": ["Beneath the bridge of Odran,", "the Knellwyrm woke."],
    "n09": ["Every step it took...", "tolled a funeral."],
    "n10": ["I killed it.", "I told myself", "it was a monster."],
    "n11": ["At the summit", "of the Ashen Cathedral,", "the Heart was waiting."],
    "n12": ["It did not need a savior."],
    "n13": ["It needed a keeper."],
    "n14": ["Carved in the stone,", "I saw the truth.", "Every keeper...", "becomes a beast."],
    "n15": ["The Knellwyrm...", "wore my crest."],
    "n16": ["Someone has to burn,", "so the world can see."],
    "n17": ["The dawn returned", "to Vhaldren."],
    "n18": ["And in a thousand years...", "another wanderer", "will come to kill me."],
}
