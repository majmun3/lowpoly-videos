"""Export the 10 scene images (1080x1920) and the Cael Vorn character sheet.
Usage: python export_images.py SCENES_DIR SHEET_DIR OUT_DIR FONTS_DIR"""
import sys, glob
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_kingdom_beyond_the_mountains', '02_entering_the_silent_city', '03_the_motionless_inhabitants', '04_the_first_movement', '05_the_wakebell_rings',
         '06_the_inhabitants_surround_cael', '07_discovery_of_the_stillwork', '08_the_machine_recognizes_cael', '09_cael_prepares_to_strike', '10_final_shot_before_the_cut']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['FRONT', 'THREE-QUARTER', 'SIDE', 'BACK', 'THREE-QUARTER BACK', 'KEEL-PROW HELM', 'HELM PROFILE (RIGHT SPUR)', 'LANTERN & SIGIL']
tw, th = 540, 960; W = tw * 4; H = th * 2 + 260 + 430
sheet = Image.new('RGB', (W, H), (18, 18, 22)); d = ImageDraw.Draw(sheet)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 74); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 27)
d.text((W // 2, 95), 'CAEL VORN', font=ft, fill=(236, 226, 210), anchor='mm')
d.text((W // 2, 175), 'CHARACTER REFERENCE  ·  VHALDREN SERIES  ·  EPISODES 1 & 2 (IDENTICAL MODEL)', font=fs, fill=(255, 156, 60), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % 4) * tw; y = 260 + (i // 4) * th
    sheet.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y))
    d.rectangle([x, y + th - 56, x + tw, y + th], fill=(10, 10, 12)); d.text((x + tw // 2, y + th - 28), l, font=fs, fill=(230, 220, 205), anchor='mm')
notes = ['HELM: faceted keel-prow face, tall keel fin brow-to-nape, sallet back flare, single swept spur on the RIGHT temple,',
         'ember-orange chevron (V) eye-slit, faded-brass diamond sigil on the brow.   SHOULDERS: three layered iron plates on the LEFT;',
         'tattered oxblood half-cloak over the RIGHT.   BODY: blackened iron plate over muted-brown gambeson, lamellar waist and thighs.',
         "TABARD: dark crimson with the WEEPING EMBER sigil (gold diamond, ember dot, three ash-tears).   RIGHT HIP: lantern (Pilgrim's Spark).",
         'WEAPON: VOWBRAND (left hand) — long single-edged blade, hooked back-spur, ember vein, open octagonal brass ring-guard.',
         'PALETTE: charcoal iron #2A2826 · oxblood #5A1414 · crimson #781A18 · faded brass #8A6A35 · ember #FF7A22']
for i, t in enumerate(notes): d.text((60, 260 + 2 * th + 40 + i * 58), t, font=fb, fill=(205, 198, 188))
sheet.save(f'{out}/00_cael_vorn_character_sheet.png', optimize=True)
print('exported', len(names) + 1, 'images ->', out)
