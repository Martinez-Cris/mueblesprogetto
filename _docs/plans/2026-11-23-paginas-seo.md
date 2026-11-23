# Páginas para Google – plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Generar 14 páginas HTML estáticas (9 por tipo de mueble, 5 por negocio) legibles por Google, enlazarlas desde la portada y regenerar el sitemap.

**Architecture:** Un script de Python sin dependencias lee `productos.json`, `js/config.js` y `herramientas/paginas.json` (textos), y escribe `<slug>/index.html` + `sitemap.xml`. Las páginas reutilizan `css/styles.css` y añaden pocas reglas nuevas. Sin JavaScript obligatorio en las páginas generadas.

**Tech Stack:** Python 3 (stdlib: json, re, html, unittest), HTML/CSS estático, GitHub Pages (Jekyll por defecto).

**Spec:** `_docs/specs/2026-11-23-paginas-seo-design.md`

## Global Constraints
- Solo librería estándar de Python; nada que instalar.
- URLs absolutas con `https://www.mueblesprogetto.co/` (canonical, OG, sitemap). Rutas de recursos con `/` inicial (`/css/styles.css`, `/img/...`) porque las páginas viven en subcarpetas.
- Visita para tomar medidas: solo en Bogotá, costo $40.000. Fuera de Bogotá: asesoría por WhatsApp con medidas enviadas por el cliente.
- Textos solo con hechos del negocio: fábrica propia en Bogotá desde 2006, envíos a ciudades principales de Colombia, ajustes de medidas/colores/acabados, horario L–V 9:30–18:30. Nada de precios.
- El número de WhatsApp se lee de `js/config.js` (`whatsapp: "57…"`), nunca se repite en el script.
- Salida determinista: correr el script dos veces no cambia ningún archivo (salvo `lastmod` del sitemap si cambió una página).

## Review Focus
- Nombre de mueble con comillas, `&` o tildes → HTML escapado y mensaje de WhatsApp codificado en URL.
- Tipo sin muebles (p. ej. se vacía una categoría) → la página no se genera ni entra al sitemap, y no queda un enlace roto en la portada.
- Muebles nuevos (`nuevo: true`) → aparecen primero y con la etiqueta "Nuevo".
- Carpetas de páginas viejas que ya no están en `paginas.json` → el script avisa (no borra a ciegas).
- `js/config.js` sin el campo `whatsapp` → error claro, no páginas con enlaces rotos.

---

### Task 1: Generador y textos

**Files:**
- Create: `herramientas/generar_paginas.py`
- Create: `herramientas/paginas.json`
- Create: `herramientas/test_generar_paginas.py`

**Interfaces:**
- Produces: `cargar_whatsapp(ruta_config: str) -> str`; `muebles_de(pagina: dict, productos: list) -> list[tuple[str, list]]` (secciones: título, muebles ordenados nuevos primero y luego alfabético); `render_pagina(pagina: dict, secciones, todas: list[dict], wa: str) -> str`; `render_sitemap(paginas: list[dict], hoy: str) -> str`; `main()`.
- `paginas.json`: lista de objetos `{slug, clase: "mueble"|"negocio", titulo_seo, descripcion, h1, intro: [párrafos], preguntas: [[p, r]], wa_mensaje, secciones: [{titulo, tipo?, material?, negocio?, max?}]}`.

- [ ] Tests (`unittest`): `test_whatsapp_desde_config` ("573023584445"); `test_escapa_nombre` (nombre `Silla "A" & B` aparece escapado y el href de wa.me lo lleva codificado); `test_orden_nuevos_primero`; `test_seccion_vacia_se_omite`; `test_pagina_sin_muebles_no_se_genera`; `test_sitemap_incluye_portada_y_paginas`; `test_config_sin_whatsapp_falla`.
- [ ] Correr `python -m unittest herramientas/test_generar_paginas.py` → FAIL.
- [ ] Implementar. Cada página: `<title>`, meta description, canonical, OG, JSON-LD `BreadcrumbList` + `ItemList` (nombre e imagen), cabecera con logo a `/` y enlace "Catálogo completo" a `/#catalogo`, migas, h1, intro, botones WhatsApp (negocio: "Pedir asesoría" y "Pedir visita para tomar medidas"), secciones con tarjetas (foto `loading="lazy"`, alt "<nombre>, <tipo en singular>", botón Cotizar), preguntas en `<details>`, bloque de enlaces a las demás páginas, pie, botón flotante. Escribir los 14 textos en `paginas.json` según la tabla del spec (góndolas dentro de barras). Avisar de carpetas huérfanas.
- [ ] Tests → PASS. Correr `python herramientas/generar_paginas.py` → 14 carpetas + `sitemap.xml` con 15 URLs. Segunda corrida → `git status` sin cambios nuevos.
- [ ] Commit.

### Task 2: Estilos, portada y publicación

**Files:**
- Modify: `css/styles.css` (bloque nuevo al final: migas, intro de página, rejilla estática de tarjetas, bloque de enlaces del pie)
- Modify: `index.html` (enlace "Ver muebles para …" en cada tarjeta de negocio; bloque de enlaces a las 14 páginas en el pie)
- Create: `_config.yml` (`exclude: [herramientas, README.md]`)
- Modify: `README.md` (sección "Páginas para Google")

- [ ] Revisar en navegador (Live Server o `python -m http.server`) en móvil y escritorio: una página de mueble, una de negocio y la portada. Comprobar que no hay enlaces rotos (script rápido que recorre los `href` internos de las 15 páginas).
- [ ] Commit.

### Task 3: Pasos manuales para el dueño (sin código)
- [ ] Tras publicar: reenviar `sitemap.xml` en Search Console y pedir indexación de 2–3 páginas clave con "Inspección de URLs".
- [ ] Guía corta para crear el Perfil de Empresa en Google.
