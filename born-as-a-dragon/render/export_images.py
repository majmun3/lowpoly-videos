"""Export scene keyframes (1080x1920) and the dragon design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_hook_the_ancient_roars', '02_the_egg', '03_the_hatchling', '04_small_weak_alone', '05_the_first_fire', '06_seen_from_far_away', '07_the_hunters',
         '08_you_grew', '09_you_fought_back', '10_you_blotted_out_the_sun', '11_the_kingdoms_unite', '12_the_banner', '13_the_burned_world', '14_the_eye', '15_the_bones_of_the_last_dragon', '16_final_eruption']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png')); labels = ['EGG', 'HATCHLING', 'JUVENILE', 'YOUNG', 'ADULT', 'ANCIENT', 'HEAD (ADULT)', 'THE BONES OF THE LAST DRAGON']
tw, th = 540, 960; cols = 4; W = tw * cols; H = 280 + th * 2 + 300
sh = Image.new('RGB', (W, H), (14, 10, 10)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'THE DRAGON', font=ft, fill=(236, 220, 200), anchor='mm'); d.text((W // 2, 175), 'ONE ORIGINAL DESIGN  ·  EVERY LIFE STAGE', font=fs, fill=(255, 140, 42), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(10, 8, 8)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(232, 220, 205), anchor='mm')
notes = ('Charcoal-black scales with deep-red glowing seams between some of them; glowing amber eyes under heavy brow ridges; a lyre-shaped crown of two great horns that sweep back '
         'and curl up at the tips, small crown spurs, a nasal horn and three cheek spikes per side; dorsal spikes; a long tail ending in a spade blade with two side barbs; bat-like wings '
         'with three long fingers and a thumb claw. Proportions shift with age (big head and eyes when young, small wings), the silhouette never changes. The ANCIENT has '
         'tattered wings, three claw-scars over the left eye and a broken left horn tip — and so do the bones of the last dragon.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + 2 * th + 30 + i * 40), t, font=fb, fill=(205, 195, 185))
sh.save(f'{out}/00_dragon_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
