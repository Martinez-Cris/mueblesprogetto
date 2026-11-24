/* Progetto Mobiliario · páginas por mueble y por negocio (generadas).
   Ver en grande, Agregar a mi cotización y menú móvil.
   La cotización se guarda con la misma clave que el catálogo de la portada, así que es una sola lista. */
(() => {
  "use strict";

  const C = window.PROGETTO;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const wa = (texto) => `https://wa.me/${C.whatsapp}?text=${encodeURIComponent(texto)}`;

  /* ---------- Cotización (misma clave que js/app.js) ---------- */
  const CLAVE = "progetto-cotizacion";
  let cot = {};
  try { cot = JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch (e) { cot = {}; }
  const guardar = () => { try { localStorage.setItem(CLAVE, JSON.stringify(cot)); } catch (e) { /* sin almacenamiento */ } };
  const total = () => Object.values(cot).reduce((a, n) => a + n, 0);

  /* Datos de los muebles: primero los de esta página; el resto (agregados en otras páginas) se cargan de productos.json */
  const datos = {};
  const tarjetas = $$(".mueble[data-id]");
  tarjetas.forEach((t) => {
    datos[t.dataset.id] = { id: t.dataset.id, nombre: $(".mueble__nombre", t).textContent, imagen: $("img", t).getAttribute("src") };
  });
  let cargado = null;
  function cargarTodos() {
    if (!cargado) {
      cargado = fetch("/productos.json").then((r) => r.json()).then((lista) => {
        lista.forEach((p) => { if (!datos[p.id]) datos[p.id] = { id: p.id, nombre: p.nombre, imagen: "/" + p.imagen }; });
      }).catch(() => { /* sin conexión: se muestran solo los de esta página */ });
    }
    return cargado;
  }

  function sincronizar(id) {
    const en = !!cot[id];
    $$(`.mueble[data-id="${CSS.escape(id)}"] [data-agregar]`).forEach((b) => {
      b.setAttribute("aria-pressed", String(en)); b.textContent = en ? "Agregado" : "Agregar";
    });
    const v = $("#visor-agregar");
    if (v && v.dataset.id === id) { v.setAttribute("aria-pressed", String(en)); v.textContent = en ? "Agregado a mi cotización" : "Agregar a mi cotización"; }
  }

  function pintarCuenta() {
    const n = total();
    $$("[data-cuenta]").forEach((e) => { e.textContent = n; e.dataset.vacia = String(n === 0); });
  }

  function pintarCotizacion() {
    pintarCuenta();
    const ids = Object.keys(cot).filter((id) => datos[id]);
    $("#cotiza-lista").innerHTML = ids.map((id) => {
      const p = datos[id];
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
    const lineas = ids.map((id) => `• ${cot[id]} × ${datos[id].nombre}`);
    const enviar = $("#cotiza-enviar");
    enviar.href = lineas.length ? wa(`${C.mensajes.cotizacion}\n${lineas.join("\n")}`) : "#";
    enviar.setAttribute("aria-disabled", String(!lineas.length));
    $("#cotiza-vaciar").disabled = !lineas.length;
  }

  function cambiar(id, delta) {
    const nuevo = (cot[id] || 0) + delta;
    if (nuevo <= 0) delete cot[id]; else cot[id] = Math.min(nuevo, 999);
    guardar(); sincronizar(id); pintarCotizacion();
  }

  /* ---------- Visor de fotos: recorre los muebles de esta página ---------- */
  const visor = $("#visor");
  const cotiza = $("#cotiza");
  let pos = 0;

  function mostrar() {
    const t = tarjetas[pos]; const p = datos[t.dataset.id];
    const img = $("#visor-img"); img.src = p.imagen; img.alt = p.nombre;
    $("#visor-nombre").textContent = p.nombre;
    $("#visor-medidas").hidden = true;
    $("#visor-precio").textContent = "Consulta el precio con un asesor";
    $("#visor-wa").href = $(".btn--wa", t).href;
    $("#visor-agregar").dataset.id = p.id;
    sincronizar(p.id);
    $("#visor-ant").hidden = $("#visor-sig").hidden = tarjetas.length < 2;
  }
  const mover = (d) => { pos = (pos + d + tarjetas.length) % tarjetas.length; mostrar(); };

  function abrir(d) {
    document.documentElement.style.overflow = "hidden";
    if (typeof d.showModal === "function") d.showModal(); else d.setAttribute("open", "");
  }
  [visor, cotiza].forEach((d) => {
    d.addEventListener("close", () => { if (!$("dialog[open]")) document.documentElement.style.overflow = ""; });
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
  });

  /* ---------- Eventos ---------- */
  document.addEventListener("click", (e) => {
    const t = e.target;

    const cerrar = t.closest("[data-cerrar]");
    if (cerrar) { cerrar.closest("dialog").close(); return; }

    const tarj = t.closest(".mueble[data-id]");
    if (tarj) {
      if (t.closest("[data-abrir]")) { pos = tarjetas.indexOf(tarj); mostrar(); if (!visor.open) abrir(visor); return; }
      if (t.closest("[data-agregar]")) { const id = tarj.dataset.id; cambiar(id, cot[id] ? -cot[id] : 1); return; }
    }

    if (t.closest("[data-abrir-cotizacion]")) {
      pintarCotizacion(); abrir(cotiza);
      cargarTodos().then(pintarCotizacion);   // completa los agregados en otras páginas
      return;
    }

    const item = t.closest(".cotiza__item");
    if (item) {
      const id = item.dataset.id;
      if (t.closest("[data-mas]")) cambiar(id, 1);
      else if (t.closest("[data-menos]")) cambiar(id, -1);
      else if (t.closest("[data-quitar]")) cambiar(id, -cot[id]);
      return;
    }
    if (t.closest("#cotiza-vaciar")) { const ids = Object.keys(cot); cot = {}; guardar(); ids.forEach(sincronizar); pintarCotizacion(); return; }
    const enviar = t.closest("#cotiza-enviar");
    if (enviar && enviar.getAttribute("aria-disabled") === "true") { e.preventDefault(); return; }

    if (t.closest("#visor-agregar")) { const id = $("#visor-agregar").dataset.id; cambiar(id, cot[id] ? -cot[id] : 1); return; }
    if (t.closest("#visor-ant")) { mover(-1); return; }
    if (t.closest("#visor-sig")) { mover(1); return; }

    const menuBtn = t.closest(".cab__menu");
    if (menuBtn) {
      const abierto = $("#menu").classList.toggle("es-abierto");
      menuBtn.setAttribute("aria-expanded", String(abierto)); return;
    }
    if (t.closest("#menu a")) { $("#menu").classList.remove("es-abierto"); $(".cab__menu").setAttribute("aria-expanded", "false"); }
  });

  visor.addEventListener("keydown", (e) => {
    if (tarjetas.length < 2) return;
    if (e.key === "ArrowLeft") mover(-1);
    if (e.key === "ArrowRight") mover(1);
  });

  /* ---------- Arranque ---------- */
  Object.keys(cot).forEach(sincronizar);
  pintarCuenta();
})();
