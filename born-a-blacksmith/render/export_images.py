"""Export scene keyframes (1080x1920) and the vampire design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_the_first_blow', '02_a_cold_morning', '03_the_newborn', '04_his_father', '05_the_coal_bucket', '06_the_furnace', '07_the_bellows', '08_the_lesson', '09_his_turn',
         '10_the_miss', '11_hot_iron', '12_the_burned_glove', '13_bandaging', '14_the_customers', '15_blow_after_blow', '16_they_wanted_them_yesterday', '17_quenching', '18_late_at_night',
         '19_exhaustion', '20_his_hands', '21_old_age', '22_trembling_hands', '23_the_man_he_was', '24_the_last_hammer', '25_the_cold_forge', '26_the_apprentice']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['FRONT', 'THREE-QUARTER', 'SIDE', 'BACK', 'FACE', 'HANDS & HAMMER', 'AGE SEVEN', 'AGE TWELVE', 'OLD AGE', 'HIS FATHER', 'THE APPRENTICE', 'ANVIL & TOOLS']
tw, th = 540, 960; cols = 4; rows = 3; W = tw * cols; H = 280 + th * rows + 380
sh = Image.new('RGB', (W, H), (20, 16, 14)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'THE BLACKSMITH', font=ft, fill=(232, 222, 200), anchor='mm'); d.text((W // 2, 175), 'ONE LIFE  ·  BOYHOOD TO OLD AGE', font=fs, fill=(248, 144, 48), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(14, 12, 10)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(232, 226, 210), anchor='mm')
notes = ('A strong, broad medieval smith with thick bare forearms, short messy brown hair, a thick beard and a soot-smudged face. Off-white linen shirt with rolled sleeves, a scorched '
         'leather apron (front only, tied across the back), brown wool trousers and heavy boots; big hands with jointed fingers that wrap the hammer and the tongs. A strongly exaggerated backside '
         'is a permanent part of his silhouette at every age; it reacts to every hammer blow with delayed, damped secondary motion and is never commented on. Age seven and twelve keep the face, '
         'hair and build; in old age the hair and beard turn grey, the back bends and the hands tremble. His father is heavier and darker-bearded. All designs are original; reference images used for mood only.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + rows * th + 30 + i * 40), t, font=fb, fill=(210, 202, 188))
sh.save(f'{out}/00_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
