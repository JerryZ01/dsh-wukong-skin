"""Generate the 31-frame Wukong portrait ladder as placeholder WebP assets.

These are deliberately abstract placeholders: concentric halos, a staff, and
the rank typography occupying the same 31 anchor levels the real artwork will
use. They let the plugin, the portrait loader, and the appearance pipeline run
end to end before illustrated frames exist. Replacing them needs no code
change - drop new 1024x1024 WebPs with the same names into assets/portrait/.

Usage:
    python tools/make-placeholders.py
"""

from __future__ import annotations

import os
from PIL import Image, ImageDraw, ImageFilter, ImageFont

OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "portrait")
SIZE = 1024
FONT_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_LIGHT = r"C:\Windows\Fonts\msyh.ttc"

# 六级果位：与 src/client/logic.js 的 RANKS 一一对应
RANKS = ["石猴", "美猴王", "齐天大圣", "孙行者", "斗战胜佛", "斗战胜祖"]

# 每一级的主色：石白 → 赭石 → 蟠桃金 → 丹炉火 → 黑金
STOPS = [
    ((236, 234, 228), (24, 22, 20), (192, 57, 43)),
    ((222, 214, 199), (27, 24, 20), (190, 60, 45)),
    ((196, 178, 148), (30, 26, 20), (184, 64, 46)),
    ((140, 116, 86), (26, 22, 18), (176, 74, 48)),
    ((46, 38, 32), (246, 238, 224), (200, 140, 54)),
    ((18, 16, 14), (248, 240, 226), (200, 160, 60)),
]

FRAMES = [
    "stage-00",
    "level-01", "level-02", "level-03", "level-04", "level-05",
    "stage-06",
    "level-07", "level-08", "level-09", "level-10", "level-11",
    "stage-12",
    "level-13", "level-14",
    "bridge-15",
    "level-16", "level-17",
    "stage-18",
    "level-19", "level-20", "level-21", "level-22", "level-23",
    "stage-24",
    "level-25", "level-26",
    "bridge-27",
    "level-28", "level-29", "stage-30",
]


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def lerp_rgb(a, b, t: float):
    t = max(0.0, min(1.0, t))
    return tuple(int(round(lerp(a[i], b[i], t))) for i in range(3))


def palette_for(level: float):
    stage = min(5, int(level // 6))
    nxt = min(5, stage + 1)
    span = (nxt * 6) - (stage * 6)
    t = 0.0 if span == 0 else (level - stage * 6) / span
    return (
        stage,
        lerp_rgb(STOPS[stage][0], STOPS[nxt][0], t),
        lerp_rgb(STOPS[stage][1], STOPS[nxt][1], t),
        lerp_rgb(STOPS[stage][2], STOPS[nxt][2], t),
    )


def load_font(path: str, size: int):
    try:
        return ImageFont.truetype(path, size)
    except Exception:
        return ImageFont.load_default()


def make_frame(index: int) -> Image.Image:
    level = index  # 0..30
    stage, page, ink, accent = palette_for(level)
    strength = level / 30.0

    img = Image.new("RGB", (SIZE, SIZE), page)
    draw = ImageDraw.Draw(img)
    cx, cy = SIZE / 2, SIZE / 2 - 10

    # 背光：由内向外扩散的同心环，随等级变密、变亮。
    rings = 26
    for i in range(rings, 0, -1):
        t = i / rings
        r = 120 + 400 * t
        mix_t = (1 - t) * (0.18 + 0.42 * strength)
        draw.ellipse(
            [cx - r, cy - r, cx + r, cy + r],
            outline=lerp_rgb(page, accent, mix_t),
            width=2,
        )

    # 头光：佛相背光，两级以上才出现，随等级增厚。
    if stage >= 2:
        for k in range(4 + stage):
            r = 250 + k * 16
            draw.ellipse(
                [cx - r, cy - r, cx + r, cy + r],
                outline=lerp_rgb(accent, page, 0.10 + 0.10 * k),
                width=max(1, 6 - stage),
            )

    # 金箍棒：一根竖直的长杖，等级越高越显金。
    staff_x = cx
    staff_top, staff_bottom = 150, SIZE - 210
    draw.rounded_rectangle(
        [staff_x - 7, staff_top, staff_x + 7, staff_bottom],
        radius=7,
        fill=lerp_rgb(ink, accent, 0.25 + 0.55 * strength),
    )
    for cap_y in (staff_top, staff_bottom):
        draw.rounded_rectangle(
            [staff_x - 26, cap_y - 16, staff_x + 26, cap_y + 16],
            radius=10,
            fill=accent if strength > 0.4 else lerp_rgb(ink, accent, 0.5),
        )

    # 紧箍：环绕金箍棒的椭圆箍圈，圈数随等级从 1 增到 4。
    hoops = 1 + stage
    for h in range(hoops):
        ry = 96 + h * 46
        rx = 186 - h * 12
        cy_h = cy + 30
        draw.ellipse(
            [cx - rx, cy_h - ry * 0.42, cx + rx, cy_h + ry * 0.42],
            outline=lerp_rgb(accent, ink, 0.12 * h),
            width=max(2, 8 - h),
        )

    # 果位印：底部右侧的方形印章，随等级由空心转实心。
    seal = 132
    sx, sy = SIZE - 96 - seal, SIZE - 96 - seal
    if strength >= 0.8:
        draw.rounded_rectangle([sx, sy, sx + seal, sy + seal], radius=14, fill=accent)
        seal_ink = page
    else:
        draw.rounded_rectangle([sx, sy, sx + seal, sy + seal], radius=14, outline=accent, width=5)
        seal_ink = accent
    # 印面只刻果位的首字：石 / 美 / 齐 / 孙 / 斗。满称另在图注里给。
    draw.text(
        (sx + seal / 2, sy + seal / 2),
        RANKS[stage][0],
        font=load_font(FONT_BOLD, 76),
        fill=seal_ink,
        anchor="mm",
    )

    # 左下角：等级数字与果位名。
    draw.text((96, SIZE - 232), f"{level:02d}", font=load_font(FONT_BOLD, 96), fill=ink, anchor="ls")
    draw.text(
        (96, SIZE - 132),
        RANKS[stage],
        font=load_font(FONT_BOLD, 46),
        fill=lerp_rgb(ink, accent, 0.55),
        anchor="ls",
    )

    # 底部进度条。
    bar_y = SIZE - 72
    draw.rectangle([96, bar_y, SIZE - 96, bar_y + 6], fill=lerp_rgb(page, ink, 0.14))
    draw.rectangle([96, bar_y, 96 + (SIZE - 192) * strength, bar_y + 6], fill=accent)

    return img.filter(ImageFilter.GaussianBlur(0.3))


def main() -> None:
    os.makedirs(OUT_DIR, exist_ok=True)
    for index, name in enumerate(FRAMES):
        make_frame(index).save(os.path.join(OUT_DIR, f"{name}.webp"), "WEBP", quality=86, method=5)
        print(f"{name}.webp  <= level {index}")


if __name__ == "__main__":
    main()
