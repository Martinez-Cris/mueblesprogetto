# Progetto Mobiliario – catálogo web

Sitio estático (HTML, CSS y JS). Sin instalación. Todo el catálogo sale de `productos.json`.

## Probar en tu computador
En VS Code abre la carpeta y usa la extensión **Live Server** (clic derecho en `index.html` → Open with Live Server).
No abras `index.html` con doble clic: el navegador bloquea la lectura de `productos.json`.

## Cambiar datos del negocio
`js/config.js`: teléfonos, dirección, horario, redes y mensajes de WhatsApp.

## Precios y medidas
1. `python herramientas/precios.py exportar` → crea `precios.csv`.
2. Ábrelo en Excel, llena `precio` (solo números, ej. 350000) y `medidas`. Guarda como CSV UTF-8 (delimitado por punto y coma).
3. `python herramientas/precios.py importar` → actualiza `productos.json`.
Mientras un mueble no tenga precio, la tarjeta muestra "Consulta el precio".

## Agregar muebles nuevos
1. PNG con fondo transparente en una carpeta, ej. `nuevos/`.
2. `python herramientas/agregar_productos.py nuevos juegos` (tipos: juegos, combos, mesas, sillas, butacos, sofas, barras, wimpy, escolar, gondolas; para juegos añade el material de las sillas, ej. `juegos plastico`, y para combos la combinación, ej. `combos 4-puff`).
3. Requiere `pip install pillow numpy`. El mueble queda marcado "Nuevo".
**Nunca subas los PNG originales a GitHub**: solo el WebP con marca de agua en `img/`.

## Páginas para Google
Además del catálogo, el sitio tiene páginas fijas por tipo de mueble (`/butacos-para-bar/`, `/sillas-para-restaurante/`...) y por negocio (`/muebles-para-bares/`, `/muebles-para-restaurantes/`...). Son las que Google puede leer y mostrar en sus resultados.
1. Cada vez que agregues muebles o cambies textos: `python herramientas/generar_paginas.py`. Regenera las páginas, `sitemap.xml` y los enlaces del pie de `index.html`.
2. Los textos, preguntas y el precio de la visita (`visita_precio`) están en `herramientas/paginas.json`. Donde dice `{visita}` se pone ese precio.
3. Revisa con Live Server y sube los cambios. En Search Console → Sitemaps vuelve a enviar `sitemap.xml`.
4. Pruebas del generador: `python -m unittest herramientas/test_generar_paginas.py`.
La carpeta `herramientas/` y este README no se publican en el sitio (`_config.yml`).

## Publicar en GitHub Pages
1. Crea un repositorio en GitHub y sube el contenido de esta carpeta (el archivo `CNAME` ya está incluido).
2. Settings → Pages → Source: *Deploy from a branch* → rama `main`, carpeta `/ (root)`.
3. Settings → Pages → Custom domain: `mueblesprogetto.co`. Cuando el certificado esté listo, activa **Enforce HTTPS**.

## DNS en Hostinger (dominio → DNS / Zona DNS)
Registros A para `@` (apex), uno por cada IP:
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
Registro CNAME: `www` → `TU-USUARIO.github.io`
Borra registros A/AAAA/CNAME anteriores que choquen. La propagación tarda de minutos a unas horas.
Verifica las IPs vigentes en la documentación de GitHub Pages.

## Contador de visitas (GoatCounter, sin cookies)
1. Crea tu cuenta en goatcounter.com y elige un código (ej. `progetto`). Tu panel será `https://progetto.goatcounter.com`.
2. En `js/config.js` escribe `goatcounter: "progetto"` y sube el cambio.
3. En el panel verás visitas, países, dispositivos y de dónde llegan. Los clics en WhatsApp aparecen como eventos (`wa-cabecera`, `wa-flotante`, `wa-mueble/<id>`, `wa-cotizacion`...) y los muebles abiertos como `mueble-visto/<id>`.
GoatCounter no usa cookies, por eso no hace falta aviso de cookies. Su plan gratuito es solo para uso no comercial; para un negocio usa el plan de pago.
