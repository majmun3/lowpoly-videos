"""Export scene keyframes (1080x1920) and the vampire design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_the_crimson_moon', '02_his_eyes_open', '03_every_candle_dies', '04_the_elders', '05_the_gothic_hall', '06_a_heartbeat', '07_he_vanishes', '08_beside_the_heartbeat',
         '09_the_knights', '10_crimson_smoke', '11_faster_than_the_eye', '12_every_knight_falls', '13_they_grow_old', '14_while_you_remained', '15_the_army_of_hunters',
         '16_the_balcony', '17_his_eyes_glow', '18_the_sky_turns_crimson', '19_thousands_of_bats', '20_the_swarm', '21_into_the_army', '22_by_sunrise', '23_the_elders_kneel',
         '24_the_vampire_king', '25_the_darkness_feared']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['FRONT', 'THREE-QUARTER', 'SIDE', 'BACK', 'FACE', 'NEWBORN', 'CHILD (FIVE)', 'THE VAMPIRE KING', 'KING — SIDE', 'THE ELDERS', 'HUMANS & KNIGHTS', 'THE SWARM']
tw, th = 540, 960; cols = 4; rows = 3; W = tw * cols; H = 280 + th * rows + 380
sh = Image.new('RGB', (W, H), (14, 10, 14)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'THE VAMPIRE', font=ft, fill=(232, 222, 200), anchor='mm'); d.text((W // 2, 175), 'ONE DESIGN  ·  FROM CRADLE TO THRONE', font=fs, fill=(230, 50, 60), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(14, 12, 10)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(232, 226, 210), anchor='mm')
notes = ('Tall, slender and pale, with glowing crimson eyes, sharp fangs, pointed ears, stern brows and slicked black hair with a widow\'s peak. A black frock coat over a grey waistcoat '
         'with silver buttons and a crimson cravat; crimson cuffs; black trousers and boots. A long black cape with a tall standing collar lined in crimson. His silhouette includes a strongly '
         'exaggerated backside at every age; it is simply part of the design (the cape drapes over it) and is never commented on. The Vampire King keeps everything and adds black-and-crimson '
         'spiked plate armour and an iron crown with a blood-red stone. All designs are original; the reference images were used for mood only.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + rows * th + 30 + i * 40), t, font=fb, fill=(210, 202, 188))
sh.save(f'{out}/00_vampire_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
