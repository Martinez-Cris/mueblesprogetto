"""Agrega muebles nuevos: PNG sin fondo -> WebP con marca de agua -> productos.json.

  1. Pon los PNG nuevos (con fondo transparente) en una carpeta, ej. nuevos/
  2. python herramientas/agregar_productos.py nuevos tipo [subtipo]
     tipo    = juegos | combos | mesas | sillas | butacos | sofas | barras | wimpy | escolar | gondolas
     subtipo (opcional):
        juegos (mesa + 4 sillas): acero | tapiz | plastico | madera | otros   (material de las sillas)
        combos (mesa + sofás/puff): 2-sofas | 2-sillas-1-sofa | 4-puff | 2-puff-1-sofa
     Ejemplo: python herramientas/agregar_productos.py nuevos juegos plastico
  3. Revisa img/ y sube los cambios a GitHub.

Requiere: pip install pillow numpy
Los PNG originales NUNCA se suben a GitHub: solo el WebP con marca de agua.
"""
import sys, os, re, json, unicodedata
import numpy as np
from PIL import Image, ImageFilter
RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGOS = os.path.join(RAIZ, "herramientas", "logos")
W, SALIDA, BG = 1000, 800, (250, 250, 249)
TIPOS = {"juegos": "juegos", "combos": "juegos-sofas", "mesas": "mesas", "sillas": "sillas", "butacos": "butacos",
         "sofas": "sofas-puff", "barras": "barras-recepciones", "wimpy": "wimpy",
         "escolar": "escolar", "gondolas": "gondolas"}

def slug(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def bonito(s):
    return re.sub(r"\s+", " ", re.sub(r"[_\-]+", " ", s)).strip().title()

def lienzo(prod):
    c = Image.new("RGB", (W, W), BG); m = int(W * .88)
    s = min(m / prod.width, m / prod.height)
    p = prod.resize((max(1, int(prod.width * s)), max(1, int(prod.height * s))), Image.LANCZOS)
    x, y = (W - p.width) // 2, (W - p.height) // 2
    sh = Image.new("L", (W, W), 0); sh.paste(p.getchannel("A").point(lambda v: int(v * .55)), (x + 6, y + 18))
    sh = sh.filter(ImageFilter.GaussianBlur(14))
    c.paste(Image.new("RGB", (W, W), (40, 40, 40)), (0, 0), sh.point(lambda v: int(v * .35)))
    c.paste(p, (x, y), p); return c

def mascara(logo, ancho, op):
    a = logo.getchannel("A"); a = a.resize((ancho, int(a.height * ancho / a.width)), Image.LANCZOS)
    return a.point(lambda v: int(v * op))

def marca(base, lv, lh):
    m = Image.new("L", (W, W), 0)
    g = mascara(lv, int(W * .50), .16); m.paste(g, ((W - g.width) // 2, (W - g.height) // 2))
    q = mascara(lh, int(W * .22), .55); m.paste(q, (W - q.width - 24, W - q.height - 24), q)
    b = np.asarray(base).astype(np.float32)
    lum = (.299 * b[..., 0] + .587 * b[..., 1] + .114 * b[..., 2]) / 255
    objetivo = (1 - np.clip((lum - .35) / .3, 0, 1)) * 255
    mm = (np.array(m).astype(np.float32) / 255)[..., None]
    return Image.fromarray(np.clip(b * (1 - mm) + objetivo[..., None] * mm, 0, 255).astype(np.uint8))

def main():
    if len(sys.argv) < 3 or sys.argv[2] not in TIPOS: print(__doc__); return
    carpeta, tipo = sys.argv[1], TIPOS[sys.argv[2]]
    sub = sys.argv[3] if len(sys.argv) > 3 else None
    lv = Image.open(os.path.join(LOGOS, "logo_vertical_negro.png")).convert("RGBA")
    lh = Image.open(os.path.join(LOGOS, "logo_horizontal_negro.png")).convert("RGBA")
    jp = os.path.join(RAIZ, "productos.json")
    P = json.load(open(jp, encoding="utf-8")); ids = {p["id"] for p in P}
    for f in sorted(os.listdir(carpeta)):
        if not f.lower().endswith(".png"): continue
        im = Image.open(os.path.join(carpeta, f)).convert("RGBA")
        a = np.array(im.getchannel("A"))
        if a.min() == 255: print("SIN FONDO TRANSPARENTE, se omite:", f); continue
        ys, xs = np.where(a > 8); im = im.crop((xs.min(), ys.min(), xs.max() + 1, ys.max() + 1))
        base = os.path.splitext(f)[0]; i = slug(base); n = 2
        while i in ids: i = f"{slug(base)}-v{n}"; n += 1
        out = marca(lienzo(im), lv, lh).resize((SALIDA, SALIDA), Image.LANCZOS)
        out.save(os.path.join(RAIZ, "img", i + ".webp"), "WEBP", quality=82, method=6)
        P.append({"id": i, "nombre": bonito(base), "imagen": f"img/{i}.webp", "tipo": [tipo], "material": [sub] if sub and tipo == "juegos" else [],
                  "composicion": [sub] if sub and tipo == "juegos-sofas" else [], "negocio": [], "linea": [], "carpetas_origen": [], "medidas": "", "precio": None,
                  "nuevo": True, "destacado": False})
        ids.add(i); print("Agregado:", i)
    json.dump(P, open(jp, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

if __name__ == "__main__": main()
