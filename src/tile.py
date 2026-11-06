"""tile.py <listfile> <cols> <out.png> : contact sheet of equally sized images."""
import sys
from PIL import Image
fs = open(sys.argv[1]).read().split()
cols = int(sys.argv[2]); ims = [Image.open(f) for f in fs]
w, h = ims[0].size; rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (w * cols, h * rows))
for i, im in enumerate(ims):
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(sys.argv[3])
