"""Optional: recreate the committed sharing assets with Pillow (not needed to build)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

out = Path(__file__).resolve().parents[1] / 'public'
font_path = '/System/Library/Fonts/Supplemental/Arial.ttf'
bold_path = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
def font(size, bold=False):
    return ImageFont.truetype(bold_path if bold else font_path, size)

im = Image.new('RGB', (1200, 630), '#20211f')
d = ImageDraw.Draw(im)
d.rounded_rectangle((64, 58, 116, 110), 12, fill='#f1f0e9')
d.text((72, 68), 'CB', font=font(24, True), fill='#20211f')
d.ellipse((104, 98, 122, 116), fill='#e87560', outline='#20211f', width=3)
d.text((134, 66), 'Cueboard', font=font(32, True), fill='#f1f0e9')
d.text((64, 166), 'Your next video,', font=font(66, True), fill='#f1f0e9')
d.text((64, 245), 'with a plan.', font=font(66, True), fill='#f1f0e9')
d.text((67, 357), 'A content planner for YouTube', font=font(27), fill='#c7c7bd')
d.text((67, 395), 'and Instagram creators.', font=font(27), fill='#c7c7bd')
d.line((64, 518, 1136, 518), fill='#42433d', width=2)
d.text((67, 551), 'Themes. Progress. A YouTube calendar.', font=font(23), fill='#bcbdb2')
for x, label, dot, heights in [(765, 'Tutorials', '#9ba99c', [66, 86]), (963, 'Behind the scenes', '#c7a782', [100, 62])]:
    d.ellipse((x, 162, x + 8, 170), fill=dot)
    d.text((x + 16, 158), label, font=font(15), fill='#d3d3c9')
    y = 196
    for h in heights:
        d.rounded_rectangle((x, y, x + 172, y + h), 9, fill='#2b2d28', outline='#474a41', width=2)
        d.rounded_rectangle((x + 15, y + 16, x + 125, y + 21), 2, fill='#a9aea1')
        d.rounded_rectangle((x + 15, y + 32, x + 100, y + 36), 2, fill='#686e61')
        if h > 80:
            d.rounded_rectangle((x + 15, y + h - 25, x + 75, y + h - 12), 3, fill='#47584d')
        y += h + 17
    d.line((x, 420, x + 172, 420), fill='#51544a', width=2)
    d.rounded_rectangle((x, 439, x + 172, 483), 7, fill='#252721', outline='#35382f')
im.save(out / 'social-card.png', optimize=True)
icon = Image.new('RGB', (180, 180), '#20211f')
d = ImageDraw.Draw(icon)
d.text((29, 46), 'CB', font=font(78, True), fill='#f1f0e9')
d.ellipse((135, 135, 171, 171), fill='#e87560')
icon.save(out / 'apple-touch-icon.png', optimize=True)
