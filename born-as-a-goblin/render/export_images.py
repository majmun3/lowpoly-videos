"""Export scene keyframes (1080x1920) and the goblin design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_hook_the_goblin_king', '02_the_great_trees', '03_born_among_the_tribe', '04_smaller_than_all_of_them', '05_left_behind', '06_the_wolf_watches',
         '07_the_knights_came', '08_your_home_burned', '09_you_ran', '10_learning_to_hunt', '11_the_winter_wolf', '12_seasons_passed', '13_the_brute',
         '14_the_warlord_rises', '15_goblins_follow_you', '16_the_return', '17_the_knights_ran', '18_the_goblin_king', '19_amber_eyes']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png')); labels = ['RUNT', 'SURVIVOR', 'WARLORD', 'GOBLIN KING', 'HEAD (NOTCHED LEFT EAR)', 'KING — BACK', 'KNIGHT OF THE KINGDOM', 'THE BRUTE & THE DIRE WOLF']
tw, th = 540, 960; cols = 4; W = tw * cols; H = 280 + th * 2 + 300
sh = Image.new('RGB', (W, H), (18, 20, 14)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'THE GOBLIN', font=ft, fill=(226, 224, 196), anchor='mm'); d.text((W // 2, 175), 'ONE ORIGINAL DESIGN  ·  FROM RUNT TO KING', font=fs, fill=(240, 184, 48), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(12, 14, 10)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(230, 226, 205), anchor='mm')
notes = ('Forest-green and olive mottled skin; huge blade-like ears with a torn notch in the LEFT ear (his mark from birth); small amber glowing eyes under a heavy brow; long hooked nose; '
         'two lower fangs; long thin arms with big three-fingered hands; short bowed legs and big flat feet. RUNT: child proportions, a leather scrap. SURVIVOR: leather loincloth and '
         'straps, wolf-pelt mantle, tooth necklace, stone-tipped spear. WARLORD: the brute\'s spiked iron pauldron and cleaver, a crimson rag cape. KING: a jagged gold crown with a '
         'blood-red stone, dark iron breastplate with gold trim, spiked pauldrons on both shoulders, royal crimson cape with a gold hem, the gold-edged cleaver.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + 2 * th + 30 + i * 40), t, font=fb, fill=(205, 200, 185))
sh.save(f'{out}/00_goblin_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
