/*
 * Datos del negocio. Edita aquí lo que cambie (teléfonos, redes, dirección).
 * No hace falta tocar index.html ni app.js para estos datos.
 */
window.PROGETTO = {
  nombre: "Progetto Mobiliario",
  fundacion: 2006,

  // WhatsApp: código de país (57) + número, sin espacios ni signos.
  whatsapp: "573023584445",

  telefonos: [
    { etiqueta: "WhatsApp y llamadas", texto: "302 358 4445", tel: "+573023584445" },
    { etiqueta: "Llamadas", texto: "319 728 8039", tel: "+573197288039" }
  ],

  direccion: "Calle 35b sur #26-45, barrio Bravo Páez, Bogotá",
  horario: "Lunes a viernes, de 9:30 a. m. a 6:30 p. m.",

  redes: {
    instagram: { url: "https://www.instagram.com/progetto7mobiliario/", usuario: "@progetto7mobiliario" },
    facebook: { url: "https://www.facebook.com/mobiliarioprogetto/", usuario: "Progetto Mobiliario" },
    tiktok: { url: "https://www.tiktok.com/@progetto.mobiliar", usuario: "@progetto.mobiliar" }
  },

  // Contador de visitas GoatCounter (sin cookies). Pon aquí solo tu código, por ejemplo "progetto"
  // si tu panel es https://progetto.goatcounter.com. Déjalo vacío ("") para no medir nada.
  goatcounter: "",

  // Cuántos muebles se muestran cada vez en el catálogo.
  porPagina: 24,

  // Mensajes de WhatsApp. {nombre} se reemplaza por el nombre del mueble.
  mensajes: {
    general: "Hola, quiero información sobre muebles para mi negocio.",
    mueble: "Hola, me interesa el mueble «{nombre}». ¿Me das el precio y más información?",
    cotizacion: "Hola, quiero cotizar estos muebles:",
    negocio: "Hola, tengo {negocio} y quiero cotizar muebles."
  }
};
