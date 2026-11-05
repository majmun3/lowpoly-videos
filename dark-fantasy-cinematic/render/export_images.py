"""Export keyframes (1080x1920) and the design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_the_blacksmith', '02_the_wizard', '03_the_knights_feast', '04_the_forgotten_castle', '05_the_lone_knight', '06_the_ancient_temple', '07_the_armory', '08_the_portal_revealed']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['THE VIOLET SMITH', 'SMITH — BACK', 'THE CRUSADER', 'CRUSADER — SIDE', 'THE WANDERER', 'WANDERER — BACK', 'THE WIZARD', 'WIZARD — BACK', 'HELMS', 'WEAPONS', 'SHIELDS', 'THE FORGED BLADE']
tw, th = 540, 960; cols = 4; rows = 3; W = tw * cols; H = 280 + th * rows + 300
sh = Image.new('RGB', (W, H), (14, 10, 22)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'DARK FANTASY CINEMATIC', font=ft, fill=(226, 220, 240), anchor='mm'); d.text((W // 2, 175), 'THE CAST OF A FORGOTTEN WORLD', font=fs, fill=(176, 120, 255), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(10, 8, 16)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(226, 222, 236), anchor='mm')
notes = ('Three original armour kits on one rig, each with full plate, mail at the joints and gauntlets with jointed fingers: the Violet Smith (mottled purple-blue plate, layered pauldrons, a pointed '
         'hood-helm with a dark face and violet eyes, a purple tabard), the crusader (silver plate, flat-topped great helm, white surcoat with a red cross) and the wanderer (blackened steel, a pointed-visor '
         'armet with crest, a long wool cape). The wizard is the series wizard rig, retinted. Inspired by the provided references; no existing character or design was reproduced.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + rows * th + 30 + i * 40), t, font=fb, fill=(206, 200, 222))
sh.save(f'{out}/00_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
