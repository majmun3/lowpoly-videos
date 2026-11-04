"""Export scene keyframes (1080x1920) and the dwarf design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_the_valley_of_the_dwarves', '02_the_family_and_the_cradle', '03_one_problem', '04_the_parents', '05_learning_to_fight', '06_learning_to_walk',
         '07_without_causing_an_earthquake', '08_age_thirty', '09_the_swing', '10_gravity_wins', '11_the_comedic_pause', '12_the_great_forge', '13_legendary_weapons',
         '14_questionable_proportions', '15_the_orcs_invade', '16_your_people_needed_you', '17_the_charge', '18_the_orc_king_laughs', '19_he_turns_around',
         '20_the_secret_weapon', '21_the_orc_king_flies', '22_the_throne_hall', '23_one_final_wobble', '24_remembered_by_everyone']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['FRONT', 'THREE-QUARTER', 'SIDE — THE LEGEND', 'BACK', 'FACE & BEARD', 'THE RUNE AXE', 'NEWBORN', 'CHILD', 'THE DWARF KING', 'HIS PEOPLE', 'THE ORC KING', 'SCALE']
tw, th = 540, 960; cols = 4; rows = 3; W = tw * cols; H = 280 + th * rows + 380
sh = Image.new('RGB', (W, H), (22, 18, 14)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'THE DWARF', font=ft, fill=(232, 222, 200), anchor='mm'); d.text((W // 2, 175), 'ONE DESIGN  ·  FROM CRADLE TO THRONE', font=fs, fill=(240, 190, 70), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(14, 12, 10)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(232, 226, 210), anchor='mm')
notes = ('Short, broad and muscular. A massive ginger beard with two side braids (steel rings) and a long central braid to the belly; long braided ginger hair down the back; '
         'thick ginger brows over a permanently serious face; a big bulbous nose. Riveted steel plates over a brown leather jerkin, layered steel-and-leather pauldrons, '
         'leather bracers, grey-green wool sleeves and trousers, tall heavy boots. A huge leather belt with a steel buckle, a hammer on the left hip, a pouch on the right, '
         'a brass lens on a chain; front tassets only. The rune-engraved bearded battle axe rides over his right shoulder. And the backside: absurdly oversized at every age, '
         'never hidden, driven by spring physics on every step. The king keeps everything and adds a gold crown, gilded plates and a short ermine-collared mantle. '
         'Based on the protagonist reference provided; all models, the orc king and the world are original.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + rows * th + 30 + i * 40), t, font=fb, fill=(210, 202, 188))
sh.save(f'{out}/00_dwarf_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
