"""Master timeline for WHAT IF DRAGONS STILL EXISTED? (seconds). Mirrors render/src/film.js."""
DURATION = 62.0
NARRATION = {"n01": 0.25, "n02": 6.1, "n03": 13.1, "n04": 15.7, "n05": 20.3, "n06": 27.1, "n07": 35.3, "n08": 37.7, "n09": 43.4, "n10": 52.2, "n11": 56.0}
SHOTS = [
    ("D01", 0.0, 2.2, "A massive dragon flies between skyscrapers above the traffic"), ("D02", 2.2, 4.2, "Its shadow sweeps the street; people look up"), ("D03", 4.2, 6.0, "Aerial chase above the avenue"),
    ("D04", 6.0, 8.6, "A dragon rests on an apartment roof; people walk dogs and shop below"), ("D05", 8.6, 10.8, "A bus stop on an ordinary morning"), ("D06", 10.8, 13.0, "A dragon flies past a traffic light"),
    ("D07", 13.0, 15.6, "A dragon lands on the airport's dragon landing zone"), ("D08", 15.6, 17.8, "A commuter in a suit climbs aboard a domesticated dragon"), ("D09", 17.8, 20.2, "Dragons fly alongside a passenger airliner"),
    ("D10", 20.2, 22.6, "The sanctuary: feed trucks, forklifts and crates of meat"), ("D11", 22.6, 24.8, "Veterinarians examine a dragon"), ("D12", 24.8, 27.0, "The scale of it: barns, paddocks, convoys"),
    ("D13", 27.0, 29.2, "A dragon loses control in flight"), ("D14", 29.2, 31.4, "It crashes onto a rooftop; fire and debris"), ("D15", 31.4, 33.4, "Fire engines, police, an ambulance"), ("D16", 33.4, 35.2, "Officers evacuate the street; smoke rises"),
    ("D17", 35.2, 37.6, "No-fly-zone and dragon-air-lane signs"), ("D18", 37.6, 40.0, "A police helicopter monitors the dragon corridor"), ("D19", 40.0, 43.2, "Registration and inspection"),
    ("D20", 43.2, 46.0, "An airbase: armoured dragons beside fighter jets"), ("D21", 46.0, 48.8, "Crew inspect the harness"), ("D22", 48.8, 52.0, "A dragon spreads its wings as jets take off"),
    ("D23", 52.0, 55.6, "Sunset: a dragon glides between towers; lights come on"), ("D24", 55.6, 58.2, "Traffic and people walking home beneath it"), ("D25", 58.2, 62.0, "Wide aerial city at dusk, dragons in the distance"),
]
CUES = {"flyby": 0.0, "shadow": 2.8, "roar1": 1.4, "bus": 9.2, "flypast": 11.6, "land": 13.0, "touch": 15.0, "plane": 17.8, "truck": 20.2, "forklift": 20.6, "stumble": 27.0, "roar_d": 28.0, "fire": 28.3, "crash": 29.8, "sirens": (30.6, 35.2),
        "heli": (37.6, 40.0), "stamp": 41.4, "jets": (49.2, 52.0), "spread": 49.8, "roar_m": 50.2, "sunset": 52.0, "far_roar": 59.2}
