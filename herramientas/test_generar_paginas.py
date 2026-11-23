"""Pruebas del generador de páginas.  Correr:  python -m unittest herramientas/test_generar_paginas.py"""
import os, sys, tempfile, unittest
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import generar_paginas as g


def prod(id_, nombre, tipo, nuevo=False, **kw):
    p = {"id": id_, "nombre": nombre, "imagen": f"img/{id_}.webp", "tipo": [tipo], "material": [],
         "negocio": [], "composicion": [], "nuevo": nuevo}
    p.update(kw)
    return p


def pagina(slug="butacos-para-bar", secciones=None, clase="mueble"):
    return {"slug": slug, "clase": clase, "titulo_seo": "Butacos para bar", "descripcion": "Desc",
            "h1": "Butacos para bar", "intro": ["Texto."], "preguntas": [["¿P?", "R."]],
            "wa_mensaje": "Hola, vi los butacos.", "nav": "Butacos",
            "secciones": secciones or [{"titulo": "Butacos", "tipo": "butacos"}]}


PRODUCTOS = [
    prod("b-zeta", "Butaco Zeta", "butacos"),
    prod("b-alfa", "Butaco Álfa", "butacos"),
    prod("b-nuevo", "Butaco Nuevo", "butacos", nuevo=True),
    prod("s-uno", "Silla Uno", "sillas"),
]


class Pruebas(unittest.TestCase):
    def test_config_desde_js(self):
        cfg = g.cargar_config(os.path.join(g.RAIZ, "js", "config.js"))
        self.assertEqual(cfg["whatsapp"], "573023584445")
        self.assertIn("{nombre}", cfg["mueble"])

    def test_config_sin_whatsapp_falla(self):
        with tempfile.NamedTemporaryFile("w", suffix=".js", delete=False, encoding="utf-8") as f:
            f.write('window.PROGETTO = { nombre: "x" };')
        try:
            with self.assertRaises(SystemExit):
                g.cargar_config(f.name)
        finally:
            os.unlink(f.name)

    def test_orden_nuevos_primero(self):
        secciones = g.muebles_de(pagina(), PRODUCTOS)
        self.assertEqual([p["id"] for p in secciones[0][1]], ["b-nuevo", "b-alfa", "b-zeta"])

    def test_seccion_vacia_se_omite(self):
        pg = pagina(secciones=[{"titulo": "Butacos", "tipo": "butacos"}, {"titulo": "Mesas", "tipo": "mesas"}])
        self.assertEqual([t for t, _ in g.muebles_de(pg, PRODUCTOS)], ["Butacos"])

    def test_max_y_sin_repetidos_en_la_pagina(self):
        pg = pagina(secciones=[{"titulo": "A", "tipo": "butacos", "max": 2}, {"titulo": "B", "tipo": "butacos"}])
        secs = g.muebles_de(pg, PRODUCTOS)
        self.assertEqual(len(secs[0][1]), 2)
        self.assertEqual([p["id"] for p in secs[1][1]], ["b-zeta"])

    def test_filtro_por_negocio_y_material(self):
        ps = [prod("w", "Wimpy", "wimpy", negocio=["panaderia"]), prod("j", "Juego", "juegos", material=["acero"])]
        self.assertEqual(g.muebles_de(pagina(secciones=[{"titulo": "x", "negocio": ["panaderia"]}]), ps)[0][1][0]["id"], "w")
        self.assertEqual(g.muebles_de(pagina(secciones=[{"titulo": "x", "tipo": "juegos", "material": "acero"}]), ps)[0][1][0]["id"], "j")

    def test_filtro_por_composicion(self):
        ps = [prod("a", "A", "juegos-sofas", composicion=["4-puff"]), prod("b", "B", "juegos-sofas", composicion=["2-sofas"])]
        secs = g.muebles_de(pagina(secciones=[{"titulo": "x", "tipo": "juegos-sofas", "composicion": "4-puff"}]), ps)
        self.assertEqual([p["id"] for p in secs[0][1]], ["a"])

    def test_precio_visita_en_textos(self):
        self.assertEqual(g.poner_visita('{"r": "cuesta {visita}"}', "$40.000"), '{"r": "cuesta $40.000"}')

    def test_pagina_sin_muebles_no_se_genera(self):
        pg = pagina(secciones=[{"titulo": "Mesas", "tipo": "mesas"}])
        self.assertEqual(g.muebles_de(pg, PRODUCTOS), [])

    def test_escapa_nombre(self):
        p = prod("raro", 'Silla "A" & B', "sillas")
        pg = pagina(secciones=[{"titulo": "Sillas", "tipo": "sillas"}])
        cfg = {"whatsapp": "57300", "mueble": "Me interesa «{nombre}»"}
        html = g.render_pagina(pg, g.muebles_de(pg, [p]), [pg], cfg)
        self.assertIn("Silla &quot;A&quot; &amp; B", html)
        self.assertNotIn('Silla "A"', html)
        self.assertIn("%22A%22%20%26%20B", html)

    def test_pagina_tiene_lo_basico(self):
        cfg = {"whatsapp": "57300", "mueble": "{nombre}"}
        pg = pagina()
        html = g.render_pagina(pg, g.muebles_de(pg, PRODUCTOS), [pg], cfg)
        self.assertIn('<link rel="canonical" href="https://www.mueblesprogetto.co/butacos-para-bar/">', html)
        self.assertIn("<h1", html)
        self.assertIn('"@type": "BreadcrumbList"', html)
        self.assertIn('"@type": "ItemList"', html)
        self.assertIn('src="/img/b-alfa.webp"', html)
        self.assertIn("https://wa.me/57300?text=Hola%2C%20vi%20los%20butacos.", html)

    def test_sitemap_incluye_portada_y_paginas(self):
        xml = g.render_sitemap([pagina("a"), pagina("b")])
        self.assertIn("<loc>https://www.mueblesprogetto.co/</loc>", xml)
        self.assertIn("<loc>https://www.mueblesprogetto.co/a/</loc>", xml)
        self.assertIn("<loc>https://www.mueblesprogetto.co/b/</loc>", xml)

    def test_bloque_portada(self):
        html = "x<!-- paginas:inicio -->viejo<!-- paginas:fin -->y"
        nuevo = g.reemplazar_bloque(html, "NUEVO")
        self.assertEqual(nuevo, "x<!-- paginas:inicio -->NUEVO<!-- paginas:fin -->y")


if __name__ == "__main__":
    unittest.main()
