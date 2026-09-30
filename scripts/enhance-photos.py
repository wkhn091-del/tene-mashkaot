"""
Re-develops the store photos from the original phone captures:
luminance-only levels, a gentle white-balance correction (the warm store mood is kept),
local contrast ("clarity"), fine sharpening and a light saturation lift, then WebP.

Usage: python3 scripts/enhance-photos.py <mapping.json> <uploads_dir> <out_dir>
mapping.json: {"store-x.webp": {"src": "123_image.png"}, ...}
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter


def develop(img: Image.Image) -> Image.Image:
    rgb = np.asarray(img.convert('RGB'), dtype=np.float32) / 255.0
    lum = rgb @ np.array([0.2126, 0.7152, 0.0722], dtype=np.float32)
    # Levels on luminance only (per-channel stretching would shift colours).
    lo, hi = np.percentile(lum, [0.4, 99.6])
    scale = 1.0 / max(hi - lo, 1e-3)
    rgb = np.clip((rgb - lo) * scale, 0.0, 1.0)
    # Gentle grey-world correction on mid-tones, 25% of the way, so the store's warmth survives.
    mid = (lum > 0.2) & (lum < 0.8)
    if mid.sum() > 1000:
        means = rgb[mid].mean(axis=0)
        gains = means.mean() / np.maximum(means, 1e-3)
        rgb = np.clip(rgb * (1.0 + 0.25 * (gains - 1.0)), 0.0, 1.0)
    # Slight shadow lift / highlight roll-off (soft S in reverse at the ends).
    rgb = np.clip(rgb + 0.06 * rgb * (1.0 - rgb) * (1.0 - 2.0 * rgb) * -1.0, 0.0, 1.0)
    out = Image.fromarray((rgb * 255.0 + 0.5).astype(np.uint8))
    out = out.filter(ImageFilter.UnsharpMask(radius=24, percent=14, threshold=0))  # clarity
    out = out.filter(ImageFilter.UnsharpMask(radius=1.1, percent=65, threshold=2))  # detail
    out = ImageEnhance.Color(out).enhance(1.07)
    return out


def main() -> None:
    mapping = json.loads(Path(sys.argv[1]).read_text())
    uploads, out_dir = Path(sys.argv[2]), Path(sys.argv[3])
    for name, entry in mapping.items():
        if entry.get('err', 0) > 50:
            print(f'skip {name}: no matching original')
            continue
        src = Image.open(uploads / entry['src'])
        developed = develop(src)
        target = out_dir / name
        developed.save(target, 'WEBP', quality=84, method=6)
        print(f'{name}: {target.stat().st_size // 1024}KB')


if __name__ == '__main__':
    main()
