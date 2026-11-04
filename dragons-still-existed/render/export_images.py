"""Export scene keyframes (1080x1920) and the vampire design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_a_dragon_over_the_city', '02_people_look_up', '03_above_the_avenue', '04_on_the_apartment_roof', '05_the_bus_stop', '06_past_the_traffic_light', '07_dragon_landing_zone',
         '08_the_commute', '09_alongside_the_airliner', '10_feeding_day', '11_the_veterinarians', '12_the_sanctuary', '13_losing_control', '14_the_rooftop', '15_emergency_services',
         '16_evacuation', '17_no_fly_zone', '18_police_helicopter', '19_registration', '20_the_airbase', '21_inspection', '22_wings_and_jets', '23_sunset', '24_walking_home', '25_everyday_life']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['PEOPLE — FRONT', 'PEOPLE — SIDE', 'PEOPLE — BACK', 'UNIFORMS', 'SLATE COMMON', 'RUST & MOSS', 'DOMESTICATED', 'MILITARY', 'SCALE', 'VEHICLES', 'AIRCRAFT', 'SIGNS']
tw, th = 540, 960; cols = 4; rows = 3; W = tw * cols; H = 280 + th * rows + 380
sh = Image.new('RGB', (W, H), (16, 18, 22)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'A WORLD WITH DRAGONS', font=ft, fill=(232, 222, 200), anchor='mm'); d.text((W // 2, 175), 'PEOPLE  ·  SPECIES  ·  INFRASTRUCTURE', font=fs, fill=(248, 168, 64), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(14, 12, 10)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(232, 226, 210), anchor='mm')
notes = ('A modern Earth where dragons never went extinct. Every human shares the same body type, a strongly exaggerated backside, as an ordinary trait of the species; they wear '
         'normal modern clothes and uniforms (casual, office, police, fire, pilot, ground crew, veterinary, military). The dragons are one original rig in five species palettes '
         '(slate, rust, moss, cobalt, ash), about 30 m long, with saddles for domesticated commuters, registration tags, and armour for military service. Infrastructure: dragon landing '
         'zones, air lanes and no-fly signs, feed trucks, sanctuaries, inspection stations, police helicopters and airbases. All designs are original; reference images used for mood only.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + rows * th + 30 + i * 40), t, font=fb, fill=(210, 202, 188))
sh.save(f'{out}/00_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
