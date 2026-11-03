"""Export the 10 Episode 3 scene images (1080x1920) and the PERMANENT Cael Vorn (Vigil Plate) reference sheet.
Usage: python export_images.py SCENES_DIR SHEET_DIR OUT_DIR FONTS_DIR"""
import sys, glob
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_approaching_the_forgotten_fortress', '02_entering_the_armory_in_old_armor', '03_the_armor_on_its_ancient_stand', '04_helmet_close_up',
         '05_chest_and_pauldrons_close_up', '06_the_watchful_ember_shield', '07_casting_off_the_old_armor', '08_putting_on_the_new_helm',
         '09_fully_equipped_shield_and_sword', '10_leaving_the_fortress']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['FRONT', 'BACK', 'SIDE', 'THREE-QUARTER', 'HELM', 'HELM FRONT', 'CHEST & PAULDRONS', 'SHIELD', 'WITH VOWBRAND & SHIELD']
tw, th = 540, 960; cols = 3; W = tw * cols; rows = 3; H = 300 + th * rows + 560
sheet = Image.new('RGB', (W, H), (16, 17, 21)); d = ImageDraw.Draw(sheet)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 76); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26); fsm = ImageFont.truetype(F + 'Cinzel-700.ttf', 26)
d.text((W // 2, 100), 'CAEL VORN', font=ft, fill=(232, 228, 220), anchor='mm')
d.text((W // 2, 180), 'THE VIGIL PLATE  ·  PERMANENT CANONICAL APPEARANCE', font=fs, fill=(216, 180, 106), anchor='mm')
d.text((W // 2, 228), 'VHALDREN SERIES  ·  FROM EPISODE 3 ONWARD', font=fsm, fill=(150, 160, 180), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 300 + (i // cols) * th
    sheet.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y))
    d.rectangle([x, y + th - 54, x + tw, y + th], fill=(10, 10, 13)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(230, 224, 212), anchor='mm')
notes = ['HELM: original enclosed close helm — rounded, slightly elongated skull with a low comb; one narrow horizontal eye-slit',
         'with a centre bar and a faint ember glow; two angled columns of vertical breaths; aged-bronze brow band with the brass',
         'diamond sigil; bronze visor rivets; three-lame gorget.   BODY: weathered silver-grey plate with etched bronze bands, a keeled',
         'breastplate and plackart over dark chainmail; three-lame faulds; charcoal cloth with a blue-grey bronze-hemmed front panel;',
         'leather belts and a chest strap.   SHOULDERS: matching layered rounded pauldrons with bronze edges.   LIMBS: couters,',
         'engraved vambraces, steel gauntlets, poleyns, greaves, laminated sabatons.   SCARF: blue-grey, tail over the right shoulder.',
         'SHIELD: elongated heater, steel rim with bronze rivets, blue-grey field, the WATCHFUL EMBER in aged gold (crown bar,',
         'lozenge, cradling hands, three falling lines).   WEAPON: VOWBRAND (unchanged), drawn left-handed from the right hip.',
         'PALETTE: silver-grey steel · aged bronze #8A6A3A · charcoal #2E2E34 · blue-grey #5A6E8C · ember #FF7A22']
import textwrap
text = ' '.join(notes); lines = []
for para in text.split('   '):
    lines += textwrap.wrap(para, 104)
fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 23)
for i, t in enumerate(lines[:16]): d.text((40, 300 + rows * th + 30 + i * 33), t, font=fb, fill=(200, 196, 188))
sheet.save(f'{out}/00_cael_vorn_vigil_plate_reference_sheet.png', optimize=True)
print('exported', len(names) + 1, 'images ->', out)
