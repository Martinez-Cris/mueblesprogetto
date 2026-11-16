/* Progetto Mobiliario · catálogo (JavaScript sin dependencias) */
(() => {
  "use strict";

  const C = window.PROGETTO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  /* ---------- Tipos de mueble (orden de los filtros) ---------- */
  const TIPOS = [
    { id: "juegos", etiqueta: "Mesa + 4 sillas", cuota: 3 },
    { id: "juegos-sofas", etiqueta: "Mesa + sofás o puff", cuota: 2 },
    { id: "mesas", etiqueta: "Mesas", cuota: 2 },
    { id: "sillas", etiqueta: "Sillas", cuota: 2 },
    { id: "butacos", etiqueta: "Butacos", cuota: 2 },
    { id: "sofas-puff", etiqueta: "Sofás y puff sueltos", cuota: 1 },
    { id: "barras-recepciones", etiqueta: "Barras y recepciones", cuota: 1 },
    { id: "wimpy", etiqueta: "Wimpy", cuota: 1 },
    { id: "escolar", etiqueta: "Escolar", cuota: 1 },
    { id: "gondolas", etiqueta: "Góndolas", cuota: 1 }
  ];

  /* Subfiltros: según el tipo elegido se puede afinar por material o combinación */
  const SUBFILTROS = {
    "juegos": { titulo: "Material de las sillas", campo: "material", opciones: [
      ["acero", "Acero"], ["tapiz", "Tapizadas"], ["plastico", "Plástico"], ["madera", "Madera"], ["otros", "Otros"]] },
    "juegos-sofas": { titulo: "Combinación", campo: "composicion", opciones: [
      ["2-sofas", "Mesa + 2 sofás"], ["2-sillas-1-sofa", "Mesa + 2 sillas + 1 sofá"],
      ["4-puff", "Mesa + 4 puff"], ["2-puff-1-sofa", "Mesa + 2 puff + 1 sofá"]] }
  };

  /* ---------- Visitas (GoatCounter, sin cookies) ---------- */
  if (C.goatcounter) {
    const s = document.createElement("script");
    s.async = true; s.src = "https://gc.zgo.at/count.js";
    s.dataset.goatcounter = `https://${C.goatcounter}.goatcounter.com/count`;
    document.head.appendChild(s);
  }
  function medir(evento, detalle) {
    try {
      if (window.goatcounter && window.goatcounter.count) {
        window.goatcounter.count({ path: detalle ? `${evento}/${detalle}` : evento, title: evento, event: true });
      }
    } catch (e) { /* medir nunca debe romper la página */ }
  }

  /* ---------- Utilidades ---------- */
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const sinAcentos = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const wa = (texto) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(texto)}`;
  const moneda = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

  const PALABRAS = { 20: "veinte", 21: "veintiún", 22: "veintidós", 23: "veintitrés", 24: "veinticuatro", 25: "veinticinco",
    26: "veintiséis", 27: "veintisiete", 28: "veintiocho", 29: "veintinueve", 30: "treinta" };
  const mayus = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- Estado ---------- */
  let productos = [];
  let filtrados = [];
  const estado = { tipo: "todos", sub: "todos", q: "", orden: "destacados", visibles: C.porPagina };
  let visorLista = [];
  let visorPos = 0;

  /* ---------- Cotización (guardada en el navegador) ---------- */
  const CLAVE = "progetto-cotizacion";
  let cot = {};
  try { cot = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { cot = {}; }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cot)); } catch (e) { /* sin almacenamiento */ } };

  /* ---------- Datos del negocio en la página ---------- */
  function aplicarConfig() {
    $$("[data-wa]").forEach((a) => {
      const texto = a.dataset.wa === "negocio"
        ? C.mensajes.negocio.replace("{negocio}", a.dataset.negocio)
        : C.mensajes.general;
      a.href = wa(texto);
    });

    const tel = $("[data-telefonos]");
    if (tel) tel.innerHTML = C.telefonos.map((t) =>
      `<a href="tel:${esc(t.tel)}">${esc(t.texto)}</a> <span class="tel-etiqueta">${esc(t.etiqueta)}</span>`).join("<br>");

    const horario = $("[data-horario]"); if (horario) horario.textContent = C.horario;
    const dir = $("[data-direccion]"); if (dir) dir.textContent = C.direccion;
    const mapa = $("[data-mapa]");
    if (mapa) mapa.href = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(C.direccion);

    const redes = $("[data-redes]");
    if (redes) {
      const nombres = { instagram: "Instagram", facebook: "Facebook", tiktok: "TikTok" };
      redes.innerHTML = Object.entries(C.redes).map(([k, r]) =>
        `<li><a href="${esc(r.url)}" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-${k}"/></svg>` +
        `<span>${nombres[k]}<small>${esc(r.usuario)}</small></span></a></li>`).join("");
    }

    const anio = new Date().getFullYear();
    const años = anio - C.fundacion;
    $$("[data-año]").forEach((e) => { e.textContent = anio; });
    $$("[data-años]").forEach((e) => { e.textContent = anio; });
    // Años de trayectoria en palabras (se actualiza solo cada año)
    if (PALABRAS[años]) {
      $$("[data-anios-txt]").forEach((e) => { e.textContent = mayus(PALABRAS[años]); });
      const d = $$(".razon dt").find((x) => /experiencia/i.test(x.textContent));
      if (d) d.textContent = `${mayus(PALABRAS[años])} años de experiencia`;
    }
  }

  /* ---------- Orden y filtros ---------- */
  function etiquetasDe(p) {
    const t = TIPOS.find((x) => x.id === (p.tipo || [])[0]);
    const sf = SUBFILTROS[(p.tipo || [])[0]];
    const et = sf ? sf.opciones.filter((o) => (p[sf.campo] || []).includes(o[0])).map((o) => o[1]) : [];
    return sinAcentos([t ? t.etiqueta : "", ...et].join(" "));
  }
  const tipoPrincipal = (p) => (p.tipo && p.tipo[0]) || "otros";

  function ordenDestacados(lista, mezclar) {
    const base = [...lista].sort((a, b) =>
      (b.destacado | 0) - (a.destacado | 0) || (b.nuevo | 0) - (a.nuevo | 0) || a.nombre.localeCompare(b.nombre, "es"));
    const fijos = base.filter((p) => p.destacado || p.nuevo);
    const resto = base.filter((p) => !(p.destacado || p.nuevo));
    if (!mezclar) return fijos.concat(resto);

    // Con "Todos": mezcla los tipos para que la primera pantalla muestre variedad.
    const grupos = new Map();
    resto.forEach((p) => { const k = tipoPrincipal(p); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(p); });
    const cuotas = Object.fromEntries(TIPOS.map((t) => [t.id, t.cuota]));
    const orden = [...TIPOS.map((t) => t.id).filter((k) => grupos.has(k)), ...[...grupos.keys()].filter((k) => !cuotas[k])];
    const salida = [];
    while (orden.some((k) => grupos.get(k).length)) {
      orden.forEach((k) => { const g = grupos.get(k); for (let i = 0; i < (cuotas[k] || 1) && g.length; i++) salida.push(g.shift()); });
    }
    return fijos.concat(salida);
  }

  function filtrar() {
    const q = sinAcentos(estado.q.trim());
    const palabras = q ? q.split(/\s+/) : [];
    let lista = productos.filter((p) =>
      (estado.tipo === "todos" || p.tipo.includes(estado.tipo)) &&
      (estado.sub === "todos" || (SUBFILTROS[estado.tipo] && p[SUBFILTROS[estado.tipo].campo].includes(estado.sub))) &&
      palabras.every((w) => p.busqueda.includes(w)));

    if (estado.orden === "nombre") lista.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
    else if (estado.orden === "precio-menor" || estado.orden === "precio-mayor") {
      const m = estado.orden === "precio-menor" ? 1 : -1;
      lista.sort((a, b) => (a.precio == null) - (b.precio == null) || m * ((a.precio || 0) - (b.precio || 0)));
    } else lista = ordenDestacados(lista, estado.tipo === "todos" && !q);
    filtrados = lista;
  }

  /* ---------- Pintar el catálogo ---------- */
  function tarjeta(p) {
    const en = !!cot[p.id];
    const precio = p.precio
      ? `<p class="mueble__precio">${moneda.format(p.precio)}</p>`
      : `<p class="mueble__precio mueble__precio--consulta">Consulta el precio</p>`;
    const medidas = p.medidas ? `<p class="mueble__medidas">${esc(p.medidas)}</p>` : "";
    const msg = C.mensajes.mueble.replace("{nombre}", p.nombre);
    return `<li class="mueble" data-id="${esc(p.id)}">
      <button class="mueble__foto" type="button" data-abrir aria-label="Ver ${esc(p.nombre)} en grande">
        ${p.nuevo ? '<span class="mueble__nuevo">Nuevo</span>' : ""}
        <img src="${esc(p.imagen)}" alt="${esc(p.nombre)}" width="800" height="800" loading="lazy" decoding="async">
      </button>
      <h3 class="mueble__nombre">${esc(p.nombre)}</h3>
      ${medidas}${precio}
      <div class="mueble__acciones">
        <a class="btn btn--wa btn--sm" href="${wa(msg)}" target="_blank" rel="noopener" aria-label="Cotizar ${esc(p.nombre)} por WhatsApp">
          <svg class="ico" aria-hidden="true"><use href="#i-whatsapp"/></svg>Cotizar</a>
        <button class="btn btn--linea btn--sm" type="button" data-agregar aria-pressed="${en}" aria-label="Agregar ${esc(p.nombre)} a mi cotización">${en ? "Agregado" : "Agregar"}</button>
      </div>
    </li>`;
  }

  const lista = $("#muebles");
  let pintados = 0;

  function pintar(reiniciar) {
    if (reiniciar) { lista.innerHTML = ""; pintados = 0; }
    const hasta = Math.min(estado.visibles, filtrados.length);
    lista.insertAdjacentHTML("beforeend", filtrados.slice(pintados, hasta).map(tarjeta).join(""));
    pintados = hasta;

    const tipo = TIPOS.find((t) => t.id === estado.tipo);
    const sf = SUBFILTROS[estado.tipo];
    const subEt = sf && estado.sub !== "todos" ? sf.opciones.find((o) => o[0] === estado.sub) : null;
    $("#estado").textContent = filtrados.length
      ? `Mostrando ${pintados} de ${filtrados.length} muebles${tipo ? " en " + tipo.etiqueta : ""}${subEt ? " · " + subEt[1] : ""}`
      : "";
    $("#vacio").hidden = filtrados.length > 0;
    const quedan = filtrados.length - pintados;
    $("#mas").hidden = quedan <= 0;
    $("#mas-estado").textContent = `Viste ${pintados} de ${filtrados.length} muebles`;
  }

  function actualizarURL() {
    const p = new URLSearchParams();
    if (estado.tipo !== "todos") p.set("tipo", estado.tipo);
    if (estado.sub !== "todos") p.set("sub", estado.sub);
    if (estado.q.trim()) p.set("q", estado.q.trim());
    const url = location.pathname + (p.toString() ? "?" + p : "") + location.hash;
    try { history.replaceState(null, "", url); } catch (e) { /* ignorar */ }
  }

  function aplicarFiltros() {
    estado.visibles = C.porPagina;
    filtrar(); pintar(true); marcarFiltros(); pintarSubfiltros(); actualizarURL();
  }

  /* ---------- Filtros por tipo ---------- */
  function construirFiltros() {
    const cuenta = (id) => productos.filter((p) => p.tipo.includes(id)).length;
    const items = [{ id: "todos", etiqueta: "Todos", n: productos.length }]
      .concat(TIPOS.map((t) => ({ id: t.id, etiqueta: t.etiqueta, n: cuenta(t.id) })).filter((t) => t.n));
    $("#filtros").innerHTML = items.map((t, i) =>
      `<li><button class="filtro" type="button" data-tipo="${t.id}" aria-pressed="false">
        <span>${esc(t.etiqueta)}</span><span class="filtro__n">${t.n}</span></button></li>`).join("");
  }
  function pintarSubfiltros() {
    const caja = $("#subfiltros"); const sf = SUBFILTROS[estado.tipo];
    if (!sf) { caja.hidden = true; caja.innerHTML = ""; return; }
    const base = productos.filter((p) => p.tipo.includes(estado.tipo));
    const op = [["todos", "Todos", base.length]].concat(sf.opciones.map(([id, et]) =>
      [id, et, base.filter((p) => p[sf.campo].includes(id)).length]).filter((o) => o[2]));
    caja.innerHTML = `<p class="subfiltros__titulo" id="t-sub">${esc(sf.titulo)}</p><div class="subfiltros__lista" role="group" aria-labelledby="t-sub">` +
      op.map(([id, et, n]) => `<button class="subfiltro" type="button" data-sub="${id}" aria-pressed="${id === estado.sub}">${esc(et)}<span>${n}</span></button>`).join("") + "</div>";
    caja.hidden = false;
  }
  function marcarFiltros() {
    $$(".filtro").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.tipo === estado.tipo)));
  }

  /* ---------- Cotización ---------- */
  const totalCot = () => Object.values(cot).reduce((a, n) => a + n, 0);
  const porId = (id) => productos.find((p) => p.id === id);

  function sincronizarBotones(id) {
    const en = !!cot[id];
    $$(`.mueble[data-id="${CSS.escape(id)}"] [data-agregar]`).forEach((b) => {
      b.setAttribute("aria-pressed", String(en)); b.textContent = en ? "Agregado" : "Agregar";
    });
    const v = $("#visor-agregar");
    if (v && v.dataset.id === id) { v.setAttribute("aria-pressed", String(en)); v.textContent = en ? "Agregado a mi cotización" : "Agregar a mi cotización"; }
  }

  function pintarCotizacion() {
    const n = totalCot();
    $$("[data-cuenta]").forEach((e) => { e.textContent = n; e.dataset.vacia = String(n === 0); });

    const ids = Object.keys(cot).filter((id) => porId(id));
    $("#cotiza-lista").innerHTML = ids.map((id) => {
      const p = porId(id);
      return `<li class="cotiza__item" data-id="${esc(id)}">
        <img src="${esc(p.imagen)}" alt="" width="64" height="64">
        <p class="cotiza__nombre">${esc(p.nombre)}</p>
        <div class="cotiza__ctrl">
          <button type="button" data-menos aria-label="Quitar una unidad de ${esc(p.nombre)}">−</button>
          <output aria-label="Cantidad">${cot[id]}</output>
          <button type="button" data-mas aria-label="Agregar una unidad de ${esc(p.nombre)}">+</button>
          <button type="button" class="quitar" data-quitar aria-label="Quitar ${esc(p.nombre)} de la lista">Quitar</button>
        </div></li>`;
    }).join("");

    const enviar = $("#cotiza-enviar");
    const lineas = ids.map((id) => `• ${cot[id]} × ${porId(id).nombre}`);
    enviar.href = lineas.length ? wa(`${C.mensajes.cotizacion}\n${lineas.join("\n")}`) : "#";
    enviar.setAttribute("aria-disabled", String(!lineas.length));
    $("#cotiza-vaciar").disabled = !lineas.length;
  }

  function cambiarCot(id, delta) {
    const nuevo = (cot[id] || 0) + delta;
    if (nuevo <= 0) delete cot[id]; else cot[id] = Math.min(nuevo, 999);
    guardar(); sincronizarBotones(id); pintarCotizacion();
  }

  /* ---------- Visor de fotos ---------- */
  const visor = $("#visor");
  const cotiza = $("#cotiza");

  function mostrarVisor() {
    const p = visorLista[visorPos];
    $("#visor-img").src = p.imagen; $("#visor-img").alt = p.nombre;
    $("#visor-nombre").textContent = p.nombre;
    medir("mueble-visto", p.id);
    $("#visor-medidas").textContent = p.medidas || "";
    $("#visor-medidas").hidden = !p.medidas;
    $("#visor-precio").textContent = p.precio ? moneda.format(p.precio) : "Consulta el precio con un asesor";
    $("#visor-wa").href = wa(C.mensajes.mueble.replace("{nombre}", p.nombre));
    $("#visor-agregar").dataset.id = p.id;
    sincronizarBotones(p.id);
    const varios = visorLista.length > 1;
    $("#visor-ant").hidden = $("#visor-sig").hidden = !varios;
  }

  function abrirVisor(id, desde) {
    visorLista = desde && desde.length ? desde : filtrados;
    visorPos = Math.max(0, visorLista.findIndex((p) => p.id === id));
    mostrarVisor();
    if (!visor.open) abrirDialogo(visor);
  }

  function abrirDialogo(d) {
    document.documentElement.style.overflow = "hidden";
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }
  [visor, cotiza].forEach((d) => {
    d.addEventListener("close", () => { if (!$("dialog[open]")) document.documentElement.style.overflow = ""; });
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  });

  const escena = $("#escena");
  /* ---------- Portada: collage con movimiento suave ---------- */
  function iniciarEscena() {
    if (!escena || !window.matchMedia("(hover: hover)").matches || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf;
    escena.addEventListener("pointermove", (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = escena.getBoundingClientRect();
        escena.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
        escena.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
      });
    });
    escena.addEventListener("pointerleave", () => { escena.style.setProperty("--px", 0); escena.style.setProperty("--py", 0); });
  }

  /* ---------- Videos de ambientes ----------
     Se reproducen solos cuando se ven. Si el equipo pide menos movimiento, hay ahorro de datos
     o el navegador bloquea el autoplay, queda un botón para reproducir con un toque. */
  function iniciarVideos() {
    const videos = $$("video[data-video]");
    if (!videos.length) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches || (navigator.connection && navigator.connection.saveData);

    const reproducir = (v) => {
      if (!v.getAttribute("src")) v.src = v.dataset.video;
      const p = v.play();
      if (p && p.catch) p.catch(() => marcar(v, true));
    };
    const marcar = (v, pausado) => v.closest(".ambiente").classList.toggle("es-pausado", pausado);

    videos.forEach((v) => {
      v.addEventListener("playing", () => marcar(v, false));
      v.addEventListener("pause", () => marcar(v, true));
      v.addEventListener("error", () => marcar(v, true));
      marcar(v, true);
      v.closest(".ambiente").querySelector(".ambiente__play").addEventListener("click", () => {
        if (v.paused) reproducir(v); else v.pause();
      });
    });

    if (quieto || !("IntersectionObserver" in window)) return;   // solo con botón
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((en) => {
        if (en.isIntersecting) reproducir(en.target); else en.target.pause();
      });
    }, { threshold: 0.25 });
    videos.forEach((v) => obs.observe(v));
  }

  /* ---------- Eventos ---------- */
  function conectar() {
    document.addEventListener("click", (e) => {
      const t = e.target;

      const cerrar = t.closest("[data-cerrar]");
      if (cerrar) { cerrar.closest("dialog").close(); return; }

      const waLink = t.closest('a[href^="https://wa.me/"]');
      if (waLink) {
        const idM = waLink.closest(".mueble")?.dataset.id || (waLink.closest(".visor") ? $("#visor-agregar").dataset.id : "");
        medir(waLink.dataset.medir || (idM ? "wa-mueble" : "wa-otro"), idM);
      }

      const filtro = t.closest(".filtro");
      if (filtro) { estado.tipo = filtro.dataset.tipo; estado.sub = "todos"; aplicarFiltros(); return; }

      const subf = t.closest(".subfiltro");
      if (subf) { estado.sub = subf.dataset.sub; aplicarFiltros(); return; }

      const enlaceFiltro = t.closest("[data-filtrar]");
      if (enlaceFiltro) { estado.tipo = enlaceFiltro.dataset.filtrar; estado.sub = "todos"; estado.q = ""; $("#buscar").value = ""; aplicarFiltros(); return; }

      if (t.closest("[data-abrir-escena]") && productos.length) {
        abrirVisor(t.closest(".pieza").dataset.id, $$("#escena .pieza").map((l) => porId(l.dataset.id)).filter(Boolean)); return;
      }

      const tarj = t.closest(".mueble");
      if (tarj) {
        const id = tarj.dataset.id;
        if (t.closest("[data-abrir]")) { abrirVisor(id); return; }
        if (t.closest("[data-agregar]")) { cambiarCot(id, cot[id] ? -cot[id] : 1); return; }
      }

      if (t.closest("#mas-boton")) {
        estado.visibles += C.porPagina; pintar(false); return;
      }

      if (t.closest("[data-abrir-cotizacion]")) { pintarCotizacion(); abrirDialogo(cotiza); return; }

      const item = t.closest(".cotiza__item");
      if (item) {
        const id = item.dataset.id;
        if (t.closest("[data-mas]")) cambiarCot(id, 1);
        else if (t.closest("[data-menos]")) cambiarCot(id, -1);
        else if (t.closest("[data-quitar]")) cambiarCot(id, -cot[id]);
        return;
      }
      if (t.closest("#cotiza-vaciar")) {
        const ids = Object.keys(cot); cot = {}; guardar(); ids.forEach(sincronizarBotones); pintarCotizacion(); return;
      }
      if (t.closest("#cotiza-enviar") && t.closest("#cotiza-enviar").getAttribute("aria-disabled") === "true") { e.preventDefault(); return; }

      if (t.closest("#visor-agregar")) {
        const id = $("#visor-agregar").dataset.id; cambiarCot(id, cot[id] ? -cot[id] : 1); return;
      }
      if (t.closest("#visor-ant")) { visorPos = (visorPos - 1 + visorLista.length) % visorLista.length; mostrarVisor(); return; }
      if (t.closest("#visor-sig")) { visorPos = (visorPos + 1) % visorLista.length; mostrarVisor(); return; }

      // Menú móvil
      const menuBtn = t.closest(".cab__menu");
      if (menuBtn) {
        const abierto = $("#menu").classList.toggle("es-abierto");
        menuBtn.setAttribute("aria-expanded", String(abierto)); return;
      }
      if (t.closest("#menu a")) { $("#menu").classList.remove("es-abierto"); $(".cab__menu").setAttribute("aria-expanded", "false"); }
    });

    visor.addEventListener("keydown", (e) => {
      if (visorLista.length < 2) return;
      if (e.key === "ArrowLeft") { visorPos = (visorPos - 1 + visorLista.length) % visorLista.length; mostrarVisor(); }
      if (e.key === "ArrowRight") { visorPos = (visorPos + 1) % visorLista.length; mostrarVisor(); }
    });

    let espera;
    $("#buscar").addEventListener("input", (e) => {
      clearTimeout(espera);
      espera = setTimeout(() => { estado.q = e.target.value; aplicarFiltros(); }, 140);
    });
    $("#orden").addEventListener("change", (e) => { estado.orden = e.target.value; aplicarFiltros(); });
  }

  /* ---------- Arranque ---------- */
  async function iniciar() {
    aplicarConfig();
    iniciarEscena();
    iniciarVideos();
    conectar();
    try {
      const r = await fetch("productos.json", { cache: "no-cache" });
      if (!r.ok) throw new Error(r.status);
      const datos = await r.json();
      productos = datos.map((p) => ({
        ...p,
        tipo: p.tipo || [], material: p.material || [], composicion: p.composicion || [],
        busqueda: sinAcentos([p.nombre, ...(p.tipo || []), ...(p.material || []), ...(p.composicion || []), ...(p.negocio || []), p.medidas || ""].join(" ").replace(/-/g, " ") + " " + etiquetasDe(p))
      }));
    } catch (err) {
      $("#estado").textContent = "No pudimos cargar el catálogo. Recarga la página o escríbenos por WhatsApp.";
      return;
    }

    $$("[data-total]").forEach((e) => { e.textContent = productos.length; });
    $$("[data-total-aprox]").forEach((e) => { e.textContent = Math.floor(productos.length / 50) * 50; });

    if (productos.some((p) => p.precio)) {
      $("#orden").insertAdjacentHTML("beforeend",
        '<option value="precio-menor">Menor precio</option><option value="precio-mayor">Mayor precio</option>');
    }

    construirFiltros();
    const url = new URLSearchParams(location.search);
    const tipo = url.get("tipo");
    if (tipo && (tipo === "todos" || TIPOS.some((t) => t.id === tipo))) estado.tipo = tipo;
    const sub = url.get("sub");
    if (sub && SUBFILTROS[estado.tipo] && SUBFILTROS[estado.tipo].opciones.some((o) => o[0] === sub)) estado.sub = sub;
    estado.q = url.get("q") || "";
    $("#buscar").value = estado.q;

    filtrar(); pintar(true); marcarFiltros(); pintarSubfiltros();
    pintarCotizacion();
    $$("[data-cuenta]").forEach((e) => { e.textContent = totalCot(); e.dataset.vacia = String(totalCot() === 0); });
  }

  iniciar();
})();
