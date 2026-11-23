# Páginas para Google (SEO) – diseño

## Por qué
El sitio está publicado (www.mueblesprogetto.co, GitHub Pages) y Search Console ya lo lee, pero para Google es **una sola página**: los 430 muebles se dibujan con JavaScript. Queremos aparecer cuando alguien busca muebles para su negocio. Los clientes llegan de dos formas: unos ya saben qué mueble quieren ("butacos para bar") y otros buscan asesoría para montar un negocio nuevo, a veces con visita para tomar medidas.

## Metas / no-metas
- **Meta:** páginas HTML reales, legibles por Google, por tipo de mueble y por tipo de negocio, con WhatsApp como acción principal.
- **No-metas:** página por cada mueble (sin precio ni medidas serían páginas pobres), precios, cambiar el catálogo interactivo de la portada, Perfil de Empresa en Google (es manual; se darán los pasos aparte).
- **Anti-metas:** textos inventados (solo lo que es cierto del negocio), páginas casi iguales entre sí (Google las descarta), añadir instalaciones o pasos de compilación.

## Enfoques considerados
- **A. Script de Python que genera páginas fijas (elegido).** Encaja con las herramientas actuales, sin instalar nada, el sitio sigue siendo estático.
- B. A + una página por mueble: contenido demasiado delgado hoy. Se puede sumar cuando haya medidas.
- C. Migrar a Astro u otro generador: requiere Node y compilación en GitHub; no aporta frente a A.

## Diseño
**Script:** `herramientas/generar_paginas.py`, solo librería estándar de Python. Lee `productos.json`, el número de WhatsApp de `js/config.js` y los textos de `herramientas/paginas.json`. Escribe `<slug>/index.html` por página y regenera `sitemap.xml`. Se corre después de agregar muebles: `python herramientas/generar_paginas.py`.

**Páginas por mueble** (todos los muebles del tipo, con fotos en carga diferida):
| URL | Contenido |
|---|---|
| /juegos-de-mesa-y-sillas/ | juegos (167), con subtítulos por material |
| /mesas-con-sofas-y-puff/ | juegos-sofas (47) |
| /mesas-para-restaurante/ | mesas (47) |
| /sillas-para-restaurante/ | sillas (44) |
| /butacos-para-bar/ | butacos (34) |
| /sofas-y-puff/ | sofas-puff (50) |
| /barras-y-recepciones/ | barras-recepciones (8) + góndolas (2) |
| /mesas-wimpy/ | wimpy (11) |
| /mobiliario-escolar/ | escolar (20) |

**Páginas por negocio** (texto de asesoría, secciones por tipo de mueble con hasta 8 muebles cada una y enlace a la página completa, botón "Pedir asesoría" y "Pedir visita para tomar medidas"):
| URL | Tipos que muestra |
|---|---|
| /muebles-para-bares/ | butacos, barras, mesas con sofás/puff, sofás y puff, mesas |
| /muebles-para-restaurantes/ | juegos, mesas, sillas, mesas con sofás/puff |
| /muebles-para-cafeterias/ | marcados `cafeteria`, juegos, butacos, mesas, sillas |
| /muebles-para-panaderias-y-fruterias/ | wimpy, marcados `panaderia`/`fruteria`, butacos |
| /muebles-para-colegios/ | escolar |

**Cada página tiene:** título y descripción propios, un h1, 150–300 palabras de texto propio, preguntas frecuentes propias, migas de pan y datos estructurados (BreadcrumbList + ItemList), canonical, Open Graph, fotos con texto alternativo descriptivo ("Butaco Tokio, butaco para bar"). Usa el mismo `css/styles.css`, la misma cabecera y pie. Cada tarjeta lleva el botón "Cotizar" con mensaje de WhatsApp prellenado; el botón flotante y los botones de página llevan un mensaje que nombra la página ("Hola, vi los butacos para bar en la web…"). Sin carrito en estas páginas (para eso está el catálogo de la portada, enlazado).

**Portada:** cada tarjeta de "¿Qué negocio vas a equipar?" suma un enlace a su página; el pie suma un bloque de enlaces a todas las páginas. Así Google las descubre y reparte fuerza.

**Publicación:** `_config.yml` excluye `herramientas/` y `README.md` del sitio publicado (`_docs/` ya queda fuera por empezar con guion bajo).

**Visita para tomar medidas (confirmado por el dueño):** solo en Bogotá, costo de $40.000. Los textos lo dicen así; fuera de Bogotá se ofrece asesoría por WhatsApp con medidas enviadas por el cliente.

## Decisiones mías (revisables)
- Nombres de URL con la palabra que la gente busca ("butacos-para-bar" en vez de "butacos").
- Góndolas va dentro de barras y recepciones: con 2 muebles sería una página demasiado pobre.
- Qué tipos de mueble muestra cada negocio (tabla de arriba).
- Los textos los redacto yo con lo que es cierto del negocio; tú los revisas antes de publicar.

## Para el constructor
Diseño visual de las páginas reutilizando clases existentes; redacción final de textos; orden de los muebles (nuevos primero, luego alfabético).
