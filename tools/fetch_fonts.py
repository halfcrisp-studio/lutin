"""Download the self-hosted fonts (latin subset, woff2) and their licenses.

Source: Fontsource CDN (Google Fonts families, OFL / Apache 2.0).
Run from the repository root: python tools/fetch_fonts.py
"""
import pathlib
import urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "fonts"
LIC = OUT / "licenses"

# (fontsource id, weight or "vf")
FONTS = [
    ("titan-one", 400),
    ("chewy", 400),
    ("fredoka", "vf"),  # interface headings only
    ("patrick-hand", 400),
    ("shadows-into-light", 400),
    ("andika", 400),
    ("dancing-script", "vf"),
    ("pacifico", 400),
    ("lobster", 400),
    ("playfair-display", "vf"),
    ("mountains-of-christmas", 700),
    ("cinzel-decorative", 700),
    ("bangers", 400),
    ("freckle-face", 400),
    ("henny-penny", 400),
    ("bungee", 400),
    ("yeseva-one", 400),
    ("special-elite", 400),
]


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": "font-fetch/1.0"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def main() -> None:
    OUT.mkdir(exist_ok=True)
    LIC.mkdir(exist_ok=True)
    for fid, w in FONTS:
        if w == "vf":
            url = f"https://cdn.jsdelivr.net/fontsource/fonts/{fid}:vf@latest/latin-wght-normal.woff2"
            name = f"{fid}-vf.woff2"
            pkg = f"@fontsource-variable/{fid}"
        else:
            url = f"https://cdn.jsdelivr.net/fontsource/fonts/{fid}@latest/latin-{w}-normal.woff2"
            name = f"{fid}-{w}.woff2"
            pkg = f"@fontsource/{fid}"
        data = get(url)
        (OUT / name).write_bytes(data)
        try:
            lic = get(f"https://cdn.jsdelivr.net/npm/{pkg}/LICENSE")
            (LIC / f"{fid}.txt").write_bytes(lic)
            first = lic.decode("utf-8", "replace").strip().splitlines()[0][:70]
        except Exception as exc:  # noqa: BLE001
            first = f"LICENSE MISSING ({exc})"
        print(f"{name:40s} {len(data)//1024:4d} KB  {first}")


if __name__ == "__main__":
    main()
