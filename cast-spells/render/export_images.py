"""Export scene keyframes (1080x1920) and the wizard design sheet. Usage: python export_images.py SCENES SHEET OUT FONTS"""
import sys, glob, textwrap
from PIL import Image, ImageDraw, ImageFont
scenes, sheetdir, out, F = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4].rstrip('/') + '/'
names = ['01_hook_today_you_will_learn', '02_mana_gathers_at_the_staff', '03_the_basics_mana', '04_channel_it_through_your_staff', '05_lesson_one_fireball', '06_gather_heat_in_your_palm',
         '07_then_release', '08_the_target_explodes', '09_lesson_two_lightning_bolt', '10_draw_electricity_from_the_air', '11_unleash_it', '12_the_scorched_stone',
         '13_lesson_three_magic_shield', '14_shape_your_mana_into_a_barrier', '15_the_attack_is_stopped', '16_the_kingdom_below', '17_fire_lightning_and_mana', '18_you_will_be_a_wizard']
for f, n in zip(sorted(glob.glob(scenes + '/t*.png')), names):
    Image.open(f).convert('RGB').resize((1080, 1920), Image.NEAREST).save(f'{out}/{n}.png', optimize=True)
views = sorted(glob.glob(sheetdir + '/t*.png'))
labels = ['FRONT', 'THREE-QUARTER', 'SIDE', 'BACK', 'FACE & HAT', 'THE STAFF', 'BELT & POTIONS', 'MANA: RUNES & AURA', 'FIREBALL', 'LIGHTNING BOLT', 'MAGIC SHIELD', 'THE BRUTE']
tw, th = 540, 960; cols = 4; rows = 3; W = tw * cols; H = 280 + th * rows + 340
sh = Image.new('RGB', (W, H), (14, 18, 24)); d = ImageDraw.Draw(sh)
ft = ImageFont.truetype(F + 'Cinzel-700.ttf', 72); fs = ImageFont.truetype(F + 'Cinzel-700.ttf', 30); fb = ImageFont.truetype(F + 'Cinzel-400.ttf', 26)
d.text((W // 2, 95), 'THE WIZARD', font=ft, fill=(222, 228, 236), anchor='mm'); d.text((W // 2, 175), 'ONE ORIGINAL DESIGN  ·  THREE SPELLS', font=fs, fill=(96, 240, 232), anchor='mm')
for i, (v, l) in enumerate(zip(views, labels)):
    x = (i % cols) * tw; y = 280 + (i // cols) * th
    sh.paste(Image.open(v).convert('RGB').resize((tw, th), Image.NEAREST), (x, y)); d.rectangle([x, y + th - 54, x + tw, y + th], fill=(10, 12, 16)); d.text((x + tw // 2, y + th - 27), l, font=fs, fill=(226, 230, 236), anchor='mm')
notes = ('A tall, pointed midnight-blue hat with a brass band and a tip bent backwards; a long midnight-blue robe that flares to the hem, with gold trim and teal rune bands that glow '
         'when he channels mana; wide bell sleeves; a burgundy shoulder mantle with a gold hem; a leather belt with a brass buckle, three potion bottles (red, green, blue) on the left '
         'hip and a satchel on the right; a long grey beard and bushy brows; eyes that glow teal while he casts. The gnarled wooden staff (always in his right hand) ends in three prongs '
         'holding a floating teal crystal. FIREBALL: heat gathered and compressed in the left palm. LIGHTNING BOLT: arcs between the fingers, a branching blue-white strike from the staff. '
         'MAGIC SHIELD: a translucent blue rune dome with ripples on impact. All designs are original.')
for i, t in enumerate(textwrap.wrap(notes, 132)): d.text((40, 280 + rows * th + 30 + i * 40), t, font=fb, fill=(200, 206, 214))
sh.save(f'{out}/00_wizard_design_sheet.png', optimize=True)
print('exported', len(names) + 1)
