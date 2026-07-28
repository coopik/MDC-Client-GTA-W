#!/usr/bin/env python3
import os
from PIL import Image, ImageDraw

S = 256

BEZEL = (110, 110, 102)
BEZEL_HI = (150, 150, 142)
BEZEL_LO = (58, 58, 54)
SCREEN = (10, 36, 106)
SCREEN_LO = (16, 22, 58)
TEXT_LINE = (200, 216, 240)
TEXT_DIM = (136, 156, 196)
SEL_BAR = (30, 79, 160)
ALERT = (192, 0, 0)
OK_LED = (21, 122, 21)
STAND = (85, 85, 79)
BASE = (122, 122, 114)

def build(size=S):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    k = size / 256.0

    def r(*v):
        return [round(x * k) for x in v]

    d.rectangle(r(112, 188, 144, 212), fill=STAND, outline=BEZEL_LO, width=max(1, round(2 * k)))
    d.rectangle(r(72, 210, 184, 226), fill=BASE, outline=BEZEL_LO, width=max(1, round(2 * k)))

    d.rectangle(r(24, 36, 232, 194), fill=BEZEL, outline=BEZEL_LO, width=max(1, round(3 * k)))
    d.line(r(30, 41, 226, 41), fill=BEZEL_HI, width=max(1, round(2 * k)))

    d.rectangle(r(40, 52, 216, 172), fill=SCREEN, outline=SCREEN_LO, width=max(1, round(2 * k)))

    d.rectangle(r(48, 60, 208, 72), fill=SEL_BAR)
    for i in range(4):
        d.rectangle(r(52, 63, 52 + 10, 69), fill=TEXT_LINE)

    rows = [
        (80, 150, TEXT_LINE),
        (92, 128, TEXT_DIM),
        (104, 160, TEXT_LINE),
    ]
    for y, w, col in rows:
        d.rectangle(r(48, y, 48 + w, y + 6), fill=col)

    d.rectangle(r(44, 116, 212, 132), fill=SEL_BAR)
    d.rectangle(r(48, 121, 168, 127), fill=(255, 255, 255))
    d.rectangle(r(176, 119, 208, 129), fill=ALERT)

    for y, w, col in [(140, 140, TEXT_DIM), (152, 116, TEXT_DIM)]:
        d.rectangle(r(48, y, 48 + w, y + 6), fill=col)

    d.rectangle(r(40, 180, 50, 188), fill=OK_LED, outline=BEZEL_LO, width=max(1, round(1 * k)))
    d.rectangle(r(58, 180, 68, 188), fill=(90, 90, 84), outline=BEZEL_LO, width=max(1, round(1 * k)))

    return img

def main():
    out_dir = "/data/mdt-terminal/build"
    os.makedirs(out_dir, exist_ok=True)

    master = build(1024)

    sizes = [(16, 16), (20, 20), (24, 24), (32, 32), (40, 40),
             (48, 48), (64, 64), (128, 128), (256, 256)]

    ico_src = master.resize((256, 256), Image.LANCZOS)
    ico_path = os.path.join(out_dir, "icon.ico")
    ico_src.save(ico_path, format="ICO", sizes=sizes)

    png_path = os.path.join(out_dir, "icon.png")
    ico_src.save(png_path, format="PNG")

    print("wrote", ico_path, os.path.getsize(ico_path), "bytes")
    print("wrote", png_path, os.path.getsize(png_path), "bytes")

if __name__ == "__main__":
    main()
