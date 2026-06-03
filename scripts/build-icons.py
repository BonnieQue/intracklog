"""Convert Blended Pin.jpg into the three platform icon PNGs Expo needs.

- assets/icon.png             1024x1024, keep white background (clean launcher icon)
- assets/adaptive-icon.png    1024x1024, transparent bg, pin centered in safe area
- assets/splash.png           1024x1024, transparent bg, smaller pin (splash shows whitespace)

Run from repo root: python scripts/build-icons.py
"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "Blended Pin.jpg"
ASSETS = ROOT / "assets"

WHITE_THRESHOLD = 245
CANVAS = 1024


def remove_white_bg(im: Image.Image) -> Image.Image:
    """Replace near-white pixels with transparent. Returns a fresh RGBA image."""
    rgba = im.convert("RGBA")
    pixels = list(rgba.getdata())
    cleaned = [
        (r, g, b, 0) if (r >= WHITE_THRESHOLD and g >= WHITE_THRESHOLD and b >= WHITE_THRESHOLD) else (r, g, b, a)
        for r, g, b, a in pixels
    ]
    out = Image.new("RGBA", rgba.size)
    out.putdata(cleaned)
    return out


def centred_paste(canvas_size: int, content_size: int, content: Image.Image) -> Image.Image:
    """Paste content (RGBA) centered onto a transparent canvas."""
    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    resized = content.resize((content_size, content_size), Image.LANCZOS)
    offset = ((canvas_size - content_size) // 2, (canvas_size - content_size) // 2)
    canvas.paste(resized, offset, resized)
    return canvas


def main():
    if not SOURCE.exists():
        raise SystemExit(f"Source not found: {SOURCE}")
    ASSETS.mkdir(exist_ok=True)

    src = Image.open(SOURCE)
    print(f"Source: {src.size} {src.mode}")

    # 1. icon.png — launcher icon, keep white background
    src.convert("RGB").save(ASSETS / "icon.png", "PNG", optimize=True)
    print("  wrote icon.png (white bg, 1024x1024)")

    # 2. adaptive-icon.png — transparent bg, pin in 720x720 safe area
    transparent = remove_white_bg(src)
    adaptive = centred_paste(CANVAS, 720, transparent)
    adaptive.save(ASSETS / "adaptive-icon.png", "PNG", optimize=True)
    print("  wrote adaptive-icon.png (transparent, 720x720 pin centered in 1024)")

    # 3. splash.png — transparent bg, pin smaller so the splash shows breathing room
    splash = centred_paste(CANVAS, 480, transparent)
    splash.save(ASSETS / "splash.png", "PNG", optimize=True)
    print("  wrote splash.png (transparent, 480x480 pin centered in 1024)")


if __name__ == "__main__":
    main()
