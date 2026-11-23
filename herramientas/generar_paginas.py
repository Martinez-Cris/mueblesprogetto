"""Genera las páginas para Google (una carpeta por página) y el sitemap.

  python herramientas/generar_paginas.py

Lee productos.json, js/config.js (WhatsApp y mensaje por mueble) y herramientas/paginas.json (textos).
Escribe <slug>/index.html, sitemap.xml y actualiza los enlaces del pie de index.html.
Córrelo cada vez que agregues muebles o cambies textos, revisa y sube los cambios a GitHub.
No necesita instalar nada.
"""
import html, json, os, re, sys, unicodedata
from urllib.parse import quote

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITIO = "https://www.mueblesprogetto.co/"
MARCA = "<!-- generado por herramientas/generar_paginas.py -->"
INICIO, FIN = "<!-- paginas:inicio -->", "<!-- paginas:fin -->"
SINGULAR = {"juegos": "juego de mesa y sillas", "juegos-sofas": "juego de mesa con sofás o puff", "mesas": "mesa",
            "sillas": "silla", "butacos": "butaco", "sofas-puff": "sofá o puff", "barras-recepciones": "barra",
            "wimpy": "mesa wimpy", "escolar": "mueble escolar", "gondolas": "góndola"}

e = lambda s: html.escape(str(s), quote=True)


def wa(numero, texto):
    return f"https://wa.me/{numero}?text={quote(texto, safe='')}"


def sin_acentos(s):
    return unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()


# ---------- Datos ----------
def cargar_config(ruta):
    """Lee el número de WhatsApp y el mensaje por mueble de js/config.js."""
    with open(ruta, encoding="utf-8") as f:
        js = f.read()
    num = re.search(r'\bwhatsapp:\s*"(\d+)"', js)
    if not num:
        sys.exit(f"ERROR: no encontré 'whatsapp: \"57...\"' en {ruta}")
    msg = re.search(r'\bmueble:\s*"([^"]*)"', js)
    return {"whatsapp": num.group(1),
            "mueble": msg.group(1) if msg else "Hola, me interesa el mueble «{nombre}». ¿Me das más información?"}


def _cumple(p, s):
    if "tipo" in s and s["tipo"] not in p.get("tipo", []):
        return False
    for campo in ("material", "composicion"):
        if campo in s and s[campo] not in p.get(campo, []):
            return False
    if "negocio" in s and not set(s["negocio"]) & set(p.get("negocio", [])):
        return False
    return True


def poner_visita(texto, precio):
    """Reemplaza {visita} por el precio de la visita en los textos."""
    return texto.replace("{visita}", precio)


def muebles_de(pagina, productos):
    """[(titulo_seccion, [muebles])] sin secciones vacías ni muebles repetidos en la misma página."""
    vistos, salida = set(), []
    orden = lambda p: (not p.get("nuevo"), sin_acentos(p["nombre"]))
    for s in pagina["secciones"]:
        lista = sorted((p for p in productos if p["id"] not in vistos and _cumple(p, s)), key=orden)
        if "max" in s:
            lista = lista[: s["max"]]
        if lista:
            vistos.update(p["id"] for p in lista)
            salida.append(_Seccion(s["titulo"], lista, s))
    return salida


class _Seccion(tuple):
    """Tupla (titulo, muebles) que además recuerda su configuración (enlace a página completa)."""
    def __new__(cls, titulo, muebles, conf):
        obj = super().__new__(cls, (titulo, muebles)); obj.conf = conf; return obj


# ---------- HTML ----------
def sprite():
    with open(os.path.join(RAIZ, "index.html"), encoding="utf-8") as f:
        m = re.search(r'<svg xmlns="http://www.w3.org/2000/svg" width="0".*?</svg>', f.read(), re.S)
    return m.group(0) if m else ""


ICO = lambda n: f'<svg class="ico" aria-hidden="true"><use href="#i-{n}"/></svg>'


def tarjeta(p, cfg):
    tipo = SINGULAR.get((p.get("tipo") or [""])[0], "mueble")
    msg = cfg["mueble"].replace("{nombre}", p["nombre"])
    nuevo = '<span class="mueble__nuevo">Nuevo</span>' if p.get("nuevo") else ""
    return (f'<li class="mueble"><div class="mueble__foto">{nuevo}'
            f'<img src="/{e(p["imagen"])}" alt="{e(p["nombre"])}, {e(tipo)} fabricado por Progetto en Bogotá" '
            f'width="800" height="800" loading="lazy" decoding="async"></div>'
            f'<h3 class="mueble__nombre">{e(p["nombre"])}</h3>'
            f'<div class="mueble__acciones"><a class="btn btn--wa btn--sm" href="{e(wa(cfg["whatsapp"], msg))}" '
            f'target="_blank" rel="noopener" aria-label="Cotizar {e(p["nombre"])} por WhatsApp">{ICO("whatsapp")}Cotizar</a></div></li>')


def json_ld(pagina, secciones):
    url = SITIO + pagina["slug"] + "/"
    items = [p for _, lista in secciones for p in lista]
    datos = [
        {"@context": "https://schema.org", "@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Inicio", "item": SITIO},
            {"@type": "ListItem", "position": 2, "name": pagina["h1"], "item": url}]},
        {"@context": "https://schema.org", "@type": "ItemList", "name": pagina["h1"], "url": url,
         "numberOfItems": len(items), "itemListElement": [
             {"@type": "ListItem", "position": i + 1, "name": p["nombre"], "image": SITIO + p["imagen"]}
             for i, p in enumerate(items)]},
    ]
    return "\n".join(f'<script type="application/ld+json">\n{json.dumps(d, ensure_ascii=False, indent=1)}\n</script>' for d in datos)


def enlaces(todas, actual=None):
    grupos = [("Muebles por tipo", "mueble"), ("Muebles por negocio", "negocio")]
    out = []
    for titulo, clase in grupos:
        lis = "".join(
            f'<li><a href="/{e(p["slug"])}/"{" aria-current=\"page\"" if actual and p["slug"] == actual else ""}>{e(p["nav"])}</a></li>'
            for p in todas if p["clase"] == clase)
        if lis:
            out.append(f'<div><p class="enlaces__titulo">{titulo}</p><ul>{lis}</ul></div>')
    return f'<nav class="enlaces" aria-label="Más muebles">{"".join(out)}</nav>'


def render_pagina(pagina, secciones, todas, cfg):
    url = SITIO + pagina["slug"] + "/"
    numero = cfg["whatsapp"]
    wa_pag = e(wa(numero, pagina["wa_mensaje"]))
    intro = "".join(f"<p>{e(t)}</p>" for t in pagina["intro"])

    botones = f'<a class="btn btn--wa" href="{wa_pag}" target="_blank" rel="noopener">{ICO("whatsapp")}{e(pagina.get("cta", "Cotizar por WhatsApp"))}</a>'
    visita = ""
    if pagina["clase"] == "negocio" and cfg.get("visita_precio"):
        msg_v = pagina.get("wa_visita", "Hola, quiero agendar una visita en Bogotá para tomar medidas de mi local.")
        botones += f'<a class="btn btn--linea" href="{e(wa(numero, msg_v))}" target="_blank" rel="noopener">Pedir visita para tomar medidas</a>'
        visita = f'<p class="pagina__nota">Visitas para tomar medidas solo en Bogotá, con un costo de {e(cfg["visita_precio"])}. Fuera de Bogotá te asesoramos por WhatsApp con las medidas de tu local.</p>'
    botones += '<a class="btn btn--linea" href="/#catalogo">Ver el catálogo completo</a>'

    bloques = []
    for sec in secciones:
        titulo, lista = sec
        conf = getattr(sec, "conf", {})
        ver = ""
        if conf.get("enlace"):
            dest = next((p for p in todas if p["slug"] == conf["enlace"]), None)
            if dest:
                ver = f'<p class="seccion__mas"><a class="btn btn--linea" href="/{e(dest["slug"])}/">Ver todos: {e(dest["nav"])}</a></p>'
        bloques.append(
            f'<section class="seccion seccion--linea seccion--pagina"><div class="contenedor">'
            f'<h2 class="titulo titulo--sub">{e(titulo)}</h2><ul class="muebles muebles--estatico">'
            + "".join(tarjeta(p, cfg) for p in lista) + f"</ul>{ver}</div></section>")

    preguntas = "".join(f"<details><summary>{e(p)}</summary><p>{e(r)}</p></details>" for p, r in pagina["preguntas"])

    return f"""<!DOCTYPE html>
{MARCA}
<html lang="es-CO">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{e(pagina["titulo_seo"])} | Progetto Mobiliario</title>
  <meta name="description" content="{e(pagina["descripcion"])}">
  <link rel="canonical" href="{url}">
  <meta name="theme-color" content="#FAFAF9">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="es_CO">
  <meta property="og:site_name" content="Progetto Mobiliario">
  <meta property="og:title" content="{e(pagina["titulo_seo"])}">
  <meta property="og:description" content="{e(pagina["descripcion"])}">
  <meta property="og:url" content="{url}">
  <meta property="og:image" content="{SITIO}assets/og-image.png">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="/favicon.ico" sizes="any">
  <link rel="icon" type="image/png" href="/assets/favicon-192.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="preload" href="/fonts/archivo-latin-wdth-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="/css/styles.css">
{json_ld(pagina, secciones)}
</head>
<body>
{sprite()}
<a class="saltar" href="#contenido">Ir al contenido</a>

<header class="cab">
  <div class="contenedor cab__fila">
    <a class="cab__logo" href="/" aria-label="Progetto Mobiliario, inicio"><img src="/assets/logo-negro.webp" alt="Progetto" width="560" height="131"></a>
    <nav class="cab__nav" id="menu" aria-label="Principal">
      <a href="/#catalogo">Catálogo</a>
      <a href="/#negocios">Negocios</a>
      <a href="/#nosotros">Nosotros</a>
      <a href="/#contacto">Contacto</a>
    </nav>
    <div class="cab__acciones">
      <a class="btn btn--wa btn--sm cab__wa" href="{wa_pag}" target="_blank" rel="noopener">{ICO("whatsapp")}<span class="cab__wa-texto">Hablar con un asesor</span><span class="sr-only">por WhatsApp</span></a>
      <button class="btn btn--linea btn--sm cab__menu" type="button" aria-expanded="false" aria-controls="menu"><span class="sr-only">Menú</span>{ICO("menu")}</button>
    </div>
  </div>
</header>

<main id="contenido">
  <section class="pagina">
    <div class="contenedor">
      <nav class="migas" aria-label="Estás en"><ol><li><a href="/">Inicio</a></li><li aria-current="page">{e(pagina["nav"])}</li></ol></nav>
      <h1 class="titulo pagina__titulo">{e(pagina["h1"])}</h1>
      <div class="pagina__intro">{intro}</div>
      <div class="hero__ctas">{botones}</div>
      {visita}
    </div>
  </section>

  {"".join(bloques)}

  <section class="seccion seccion--linea" aria-labelledby="t-preguntas">
    <div class="contenedor preguntas__grid">
      <h2 class="titulo" id="t-preguntas">Preguntas frecuentes</h2>
      <div class="preguntas">{preguntas}</div>
    </div>
  </section>

  <section class="seccion seccion--ceniza">
    <div class="contenedor">
      <h2 class="titulo titulo--sub">Fabricamos en Bogotá desde 2006</h2>
      <p class="pagina__cierre">Fábrica propia, sin intermediarios. Ajustamos medidas, colores y acabados, y enviamos a las ciudades principales de Colombia. Escríbenos y un asesor te responde por WhatsApp.</p>
      <div class="hero__ctas"><a class="btn btn--wa btn--grande" href="{wa_pag}" target="_blank" rel="noopener">{ICO("whatsapp")}Hablar con un asesor</a></div>
      {enlaces(todas, pagina["slug"])}
    </div>
  </section>
</main>

<footer class="pie">
  <div class="contenedor pie__fila">
    <img src="/assets/logo-blanco.webp" alt="Progetto" width="560" height="131" loading="lazy">
    <p>Progetto Mobiliario · Calle 35b sur #26-45, barrio Bravo Páez, Bogotá · Lunes a viernes, 9:30 a. m. a 6:30 p. m.</p>
  </div>
</footer>

<a class="flota" href="{wa_pag}" target="_blank" rel="noopener">{ICO("whatsapp")}<span class="flota__texto">Habla con un asesor</span><span class="sr-only">por WhatsApp</span></a>

<script>
document.querySelector(".cab__menu").addEventListener("click", function () {{
  var abierto = document.getElementById("menu").classList.toggle("es-abierto");
  this.setAttribute("aria-expanded", String(abierto));
}});
</script>
</body>
</html>
"""


def render_sitemap(paginas):
    urls = [SITIO] + [SITIO + p["slug"] + "/" for p in paginas]
    return ('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
            + "".join(f"  <url><loc>{u}</loc></url>\n" for u in urls) + "</urlset>\n")


def reemplazar_bloque(texto, nuevo):
    a, b = texto.find(INICIO), texto.find(FIN)
    if a < 0 or b < a:
        return texto
    return texto[: a + len(INICIO)] + nuevo + texto[b:]


def escribir(ruta, contenido):
    """Escribe solo si cambió. Devuelve True si escribió."""
    if os.path.exists(ruta):
        with open(ruta, encoding="utf-8", newline="") as f:
            if f.read() == contenido:
                return False
    os.makedirs(os.path.dirname(ruta), exist_ok=True)
    with open(ruta, "w", encoding="utf-8", newline="\n") as f:
        f.write(contenido)
    return True


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    with open(os.path.join(RAIZ, "productos.json"), encoding="utf-8") as f:
        productos = json.load(f)
    with open(os.path.join(RAIZ, "herramientas", "paginas.json"), encoding="utf-8") as f:
        crudo = f.read()
    precio = json.loads(crudo).get("visita_precio", "")
    conf = json.loads(poner_visita(crudo, precio))
    cfg = cargar_config(os.path.join(RAIZ, "js", "config.js"))
    cfg["visita_precio"] = precio

    generadas = []
    for pg in conf["paginas"]:
        secs = muebles_de(pg, productos)
        if not secs:
            print(f"  (omitida, sin muebles) /{pg['slug']}/")
            continue
        generadas.append((pg, secs))
    todas = [pg for pg, _ in generadas]

    cambios = 0
    for pg, secs in generadas:
        if escribir(os.path.join(RAIZ, pg["slug"], "index.html"), render_pagina(pg, secs, todas, cfg)):
            cambios += 1; print(f"  actualizada /{pg['slug']}/  ({sum(len(l) for _, l in secs)} muebles)")
    if escribir(os.path.join(RAIZ, "sitemap.xml"), render_sitemap(todas)):
        cambios += 1; print("  actualizado sitemap.xml")

    ruta_index = os.path.join(RAIZ, "index.html")
    with open(ruta_index, encoding="utf-8", newline="") as f:
        index = f.read()
    if INICIO in index:
        if escribir(ruta_index, reemplazar_bloque(index, enlaces(todas))):
            cambios += 1; print("  actualizados los enlaces del pie de index.html")
    else:
        print(f"  AVISO: index.html no tiene {INICIO} ... {FIN}; no actualicé sus enlaces")

    slugs = {pg["slug"] for pg in todas}
    for d in sorted(os.listdir(RAIZ)):
        ruta = os.path.join(RAIZ, d, "index.html")
        if d not in slugs and os.path.isfile(ruta):
            with open(ruta, encoding="utf-8") as f:
                if MARCA in f.read(500):
                    print(f"  AVISO: /{d}/ ya no está en paginas.json. Si no la quieres, borra la carpeta {d}/")

    print(f"Listo: {len(todas)} páginas, {cambios} archivos cambiados.")


if __name__ == "__main__":
    main()
