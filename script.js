// === SCRIPT.JS FINAL, COMPLETO Y CON FLUJO MODULAR ===

function mostrarAlerta(titulo, mensaje, tipo = "info") {
  const modal = document.getElementById("custom-alert-modal");
  const icon = document.getElementById("alert-icon");
  document.getElementById("alert-title").textContent = titulo;
  document.getElementById("alert-message").textContent = mensaje;

  icon.className = "";
  if (tipo === "success") {
    icon.innerHTML = "✅";
    icon.classList.add("icon-success");
  } else if (tipo === "error") {
    icon.innerHTML = "❌";
    icon.classList.add("icon-error");
  } else {
    icon.innerHTML = "ℹ️";
    icon.classList.add("icon-info");
  }

  modal.classList.remove("oculto");
}

// --- VARIABLES GLOBALES ---
let votantes = [],
  candidatosData = {},
  datosTerritoriales = {},
  votos = {};
let votanteActual = null,
  stream = null;
let verificacionBiometrica = { facial: false, huella: false };
let votosActuales = { presidencia: null, senado: null, camara: null };
let etapaActual = 0;
const etapas = [
  "Presidente y Vicepresidente",
  "Senado de la República",
  "Cámara de Representantes",
  "Resumen del Voto",
];
let numeroConsecutivo = 1;

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-iniciar-votante")
    ?.addEventListener("click", iniciarApp);
  document
    .getElementById("btn-iniciar-operador")
    ?.addEventListener("click", () => {
      if (prompt("Ingrese PIN de operador:") === "2026") iniciarApp();
      else alert("PIN incorrecto.");
    });
});

function iniciarApp() {
  document.getElementById("welcome-screen").style.display = "none";
  document.getElementById("app-container").classList.remove("oculto");
  Promise.all([
    fetch("votantes.json").then((res) => res.json()),
    fetch("candidatos.json").then((res) => res.json()),
    fetch("colombia-territorial.json").then((res) => res.json()),
  ])
    .then(([votantesData, candData, terrData]) => {
      votantes = votantesData;
      candidatosData = candData;
      datosTerritoriales = terrData;
      inicializarComponentes();
    })
    .catch((error) => console.error("Error crítico al cargar datos:", error));
}

function inicializarComponentes() {
  configurarNavegacion();
  configurarFormularios();
  renderizarCandidatos();
  console.log("Aplicación Principal Inicializada.");
}

// --- NAVEGACIÓN Y CONFIGURACIÓN ---
function configurarNavegacion() {
  document.querySelectorAll("nav button").forEach((boton) => {
    boton.addEventListener("click", () =>
      mostrarSeccion(boton.id.replace("btn-", ""))
    );
  });

  document.getElementById("btn-siguiente")?.addEventListener("click", () => {
    if (etapaActual < etapas.length - 1) {
      etapaActual++;
      mostrarEtapa(etapaActual);
    }
  });

  document.getElementById("btn-anterior")?.addEventListener("click", () => {
    if (etapaActual > 0) {
      etapaActual--;
      mostrarEtapa(etapaActual);
    }
  });

  mostrarSeccion("votacion");
}

function mostrarSeccion(seccionId) {
  document
    .querySelectorAll(".seccion")
    .forEach((s) => s.classList.add("oculto"));
  const seccionActiva = document.getElementById(seccionId);
  if (seccionActiva) {
    seccionActiva.classList.remove("oculto");
    if (seccionId === "resultados") {
      actualizarResultados();
    }
  }
}

function configurarFormularios() {
  document
    .getElementById("btn-verificar-cedula")
    ?.addEventListener("click", verificarCedula);
  document
    .getElementById("btn-leer-documento")
    ?.addEventListener("click", simularLecturaDocumento);
  document
    .getElementById("btn-confirmar-rostro")
    ?.addEventListener("click", capturarFotoFacial);
  document
    .getElementById("btn-confirmar-huella")
    ?.addEventListener("click", verificarHuella);
  document.getElementById("alert-close-btn")?.addEventListener("click", () => {
    document.getElementById("custom-alert-modal").classList.add("oculto");
  });
  document
    .getElementById("bypass-huella-checkbox")
    ?.addEventListener("change", (e) => {
      if (e.target.checked) {
        verificacionBiometrica.huella = true;
        abrirTarjetonSiCompleto();
      } else {
        verificacionBiometrica.huella = false;
      }
    });
}

// --- LÓGICA DE VERIFICACIÓN (CORREGIDA) ---
function verificarCedula() {
  const votante = votantes.find(
    (v) => v.cedula === document.getElementById("cedula-voto").value
  );
  if (!votante) {
    mostrarAlerta(
      "Error de Verificación",
      "El número de cédula no fue encontrado.",
      "error"
    );
    return;
  }
  if (votos[votante.cedula]) {
    mostrarAlerta(
      "Información",
      "Esta persona ya ha ejercido su derecho al voto.",
      "info"
    );
    return;
  }
  if (votante.status !== "Activo") {
    mostrarAlerta(
      "Votante Inhabilitado",
      `Novedad: ${votante.novedad || "Sin especificar"}`,
      "error"
    );
    return;
  }

  votanteActual = votante;
  const { nombre, apellidos, status } = votante;
  document.getElementById(
    "info-nombre"
  ).textContent = `Nombre: ${nombre} ${apellidos}`;
  document.getElementById("info-status").textContent = `Estado: ${status}`;
  document.getElementById("datos-votante").classList.remove("oculto");

  mostrarAlerta(
    "Verificación Exitosa",
    "Cédula encontrada. Procediendo a la verificación facial.",
    "success"
  );
  setTimeout(() => {
    document.getElementById("custom-alert-modal").classList.add("oculto");
    abrirModuloFacial();
  }, 1500);
}

function simularLecturaDocumento() {
  const votanteHabilitado = votantes.find(
    (v) => v.status === "Activo" && !votos[v.cedula]
  );
  if (votanteHabilitado) {
    document.getElementById("cedula-voto").value = votanteHabilitado.cedula;
    // No llama a verificarCedula() directamente para simular que el usuario debe hacer clic
    mostrarAlerta(
      "Simulación de Escaneo",
      "Se ha leído un documento. Por favor, haga clic en 'Verificar Cédula' para continuar.",
      "info"
    );
  } else {
    mostrarAlerta(
      "Información",
      "No hay más votantes habilitados para simular.",
      "info"
    );
  }
}

async function abrirModuloFacial() {
  document.getElementById("face-scan-modal").classList.remove("oculto");
  const animationContainer = document.getElementById("face-scan-animation");
  animationContainer.innerHTML = `<video autoplay muted></video><div class="scan-overlay"></div>`;

  try {
    const video = animationContainer.querySelector("video");
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    video.srcObject = stream;
  } catch (e) {
    console.error("Error de cámara:", e);
    document.getElementById("face-scan-animation").innerHTML =
      "<p>Cámara no detectada. Por favor, permita el acceso.</p>";
  }
}

function detenerCamara() {
  stream?.getTracks().forEach((track) => track.stop());
}

// --- MÓDULOS BIOMÉTRICOS (RESTAURADOS Y MEJORADOS) ---
function capturarFotoFacial() {
  const btn = document.getElementById("btn-confirmar-rostro");
  const overlay = document.querySelector("#face-scan-modal .scan-overlay");
  btn.textContent = "Escaneando...";
  btn.disabled = true;
  if (overlay) overlay.style.opacity = 1;

  // Simulación de prueba y error
  setTimeout(() => {
    const exito = Math.random() > 0.3; // 70% de probabilidad de éxito
    if (exito) {
      verificacionBiometrica.facial = true;
      btn.textContent = "Escanear Rostro";
      btn.disabled = false;
      document.getElementById("face-scan-modal").classList.add("oculto");
      detenerCamara();
      mostrarAlerta(
        "Éxito",
        "Verificación facial completada. Procediendo a la huella.",
        "success"
      );
      setTimeout(() => {
        document.getElementById("custom-alert-modal").classList.add("oculto");
        document.getElementById("fingerprint-modal").classList.remove("oculto");
      }, 1500);
    } else {
      btn.textContent = "Reintentar Escaneo";
      btn.disabled = false;
      if (overlay) overlay.style.opacity = 0;
      document.getElementById("face-scan-title").textContent =
        "Error de Escaneo";
      document.getElementById("face-scan-message").textContent =
        "No se pudo verificar el rostro. Por favor, asegúrese de tener buena iluminación y vuelva a intentarlo.";
    }
  }, 2500);
}

function verificarHuella() {
  const btn = document.getElementById("btn-confirmar-huella");
  const pad = document.getElementById("fingerprint-pad");
  const scanLine = pad.querySelector(".fingerprint-scan-line");
  const svgPath = pad.querySelector("#fingerprint-svg path");

  btn.textContent = "Verificando...";
  btn.disabled = true;

  // Inicia la animación de escaneo
  pad.classList.add("scanning");
  scanLine.classList.add("scanning");
  if (svgPath) svgPath.style.strokeDashoffset = "0";

  setTimeout(() => {
    verificacionBiometrica.huella = true;
    btn.textContent = "Escanear Huella";
    btn.disabled = false;

    // Cambia a estado de éxito
    pad.classList.remove("scanning");
    pad.classList.add("success");
    if (svgPath) svgPath.style.stroke = "#28a745";

    abrirTarjetonSiCompleto();
  }, 2200); // Duración de la animación
}

function abrirTarjetonSiCompleto() {
  if (verificacionBiometrica.facial && verificacionBiometrica.huella) {
    mostrarAlerta(
      "Verificación Completa",
      "Identidad confirmada. Presentando tarjetón electoral.",
      "success"
    );
    setTimeout(() => {
      document
        .querySelectorAll(".verification-modal")
        .forEach((modal) => modal.classList.add("oculto"));
      etapaActual = 0;
      mostrarEtapa(etapaActual);
      document.getElementById("tarjeton-modal").classList.remove("oculto");
    }, 1500);
  }
}

// --- LÓGICA DEL TARJETÓN Y VOTO (SIN CAMBIOS) ---
function mostrarEtapa(indice) {
  // Oculta todas las etapas y luego muestra la correcta
  document
    .querySelectorAll(".seccion-voto")
    .forEach((el) => el.classList.add("oculto"));
  const etapaActiva = document.querySelector(
    `.seccion-voto[data-etapa="${indice}"]`
  );
  if (etapaActiva) etapaActiva.classList.remove("oculto");

  // Actualiza el título
  document.getElementById("tarjeton-titulo-etapa").textContent = etapas[indice];

  // --- LÓGICA DE BOTONES CORREGIDA Y A PRUEBA DE ERRORES ---
  const btnAnterior = document.getElementById("btn-anterior");
  const btnSiguiente = document.getElementById("btn-siguiente");
  const btnVotar = document.getElementById("btn-votar");

  if (indice === etapas.length - 1) {
    // Estás en la pantalla de RESUMEN FINAL (índice 3)
    generarResumen();
    btnAnterior.textContent = "Corregir";
    btnAnterior.classList.remove("oculto");
    btnSiguiente.classList.add("oculto"); // OCULTA el botón "Siguiente"
    btnVotar.classList.remove("oculto"); // MUESTRA el botón "Votar"
  } else {
    // Estás en cualquiera de las pantallas de SELECCIÓN (índices 0, 1, 2)
    btnAnterior.textContent = "Anterior";
    btnAnterior.classList.toggle("oculto", indice === 0); // Oculta "Anterior" SOLO en la primera página

    btnSiguiente.classList.remove("oculto"); // "Siguiente" SIEMPRE es visible en las páginas de selección
    btnVotar.classList.add("oculto"); // "Votar" SIEMPRE está oculto en las páginas de selección
  }
}

function generarResumen() {
  const contenedor = document.getElementById("resumen-votacion");
  if (!contenedor) return;
  const p = candidatosData.presidencia_vicepresidencia.find(
    (c) => c.id === votosActuales.presidencia
  );
  const s = candidatosData.senado_nacional.find(
    (c) => c.id === votosActuales.senado
  );
  const m = candidatosData.camara_territorial["11"].find(
    (c) => c.id === votosActuales.camara
  );
  contenedor.innerHTML = `
        <div class="resumen-item"><h4>Presidente y Vicepresidente</h4><p>${
          p ? p.partido : "No seleccionado"
        }</p></div>
        <div class="resumen-item"><h4>Senado de la República</h4><p>${
          s ? s.partido : "No seleccionado"
        }</p></div>
        <div class="resumen-item"><h4>Cámara de Representantes</h4><p>${
          m ? m.partido : "No seleccionado"
        }</p></div>
    `;
}

function renderizarCandidatos() {
  numeroConsecutivo = 1;
  renderizarSeccionCandidatos(
    "presidencia",
    candidatosData.presidencia_vicepresidencia
  );
  renderizarSeccionCandidatos("senado", candidatosData.senado_nacional);
  renderizarSeccionCandidatos(
    "camara",
    candidatosData.camara_territorial
      ? candidatosData.camara_territorial["11"]
      : []
  );
}

function renderizarSeccionCandidatos(seccion, data) {
  const cont = document.getElementById(`candidatos-${seccion}`);
  if (!cont) return;
  cont.innerHTML = "";
  data?.forEach((c) => {
    cont.appendChild(crearTarjetaCandidato(c, seccion, numeroConsecutivo));
    if (seccion !== "presidencia") numeroConsecutivo++;
  });
  if (seccion === "presidencia") numeroConsecutivo = 1; // Reset for next category
}

function crearTarjetaCandidato(c, seccion, numero) {
  const card = document.createElement("div");
  card.className = "candidato-card";
  card.dataset.id = c.id;
  card.dataset.seccion = seccion;

  const placeholderLogo = `https://placehold.co/80x80/EFEFEF/333?text=Logo`;
  const placeholderFoto = `https://placehold.co/100x100/EFEFEF/333?text=Foto`;

  let visualHTML = "";
  if (seccion === "presidencia") {
    visualHTML = `
                <div class="candidato-fotos">
                    <img src="${c.foto_presidente}" alt="" class="candidato-foto presidente" onerror="this.src='${placeholderFoto}'">
                    <img src="${c.foto_vicepresidente}" alt="" class="candidato-foto vicepresidente" onerror="this.src='${placeholderFoto}'">
                </div>
                <img src="${c.logo_partido}" alt="" class="candidato-logo" onerror="this.src='${placeholderLogo}'">
            `;
  } else {
    visualHTML = `
                <div class="candidato-fotos">
                    <img src="${c.foto_candidato}" alt="" class="candidato-foto" onerror="this.src='${placeholderFoto}'">
                </div>
                <img src="${c.logo}" alt="" class="candidato-logo" onerror="this.src='${placeholderLogo}'">
            `;
  }

  const numeroHTML = `<div class="candidato-numero">${numero}</div>`;

  let infoHTML = `<h4>${c.partido}</h4>`;
  if (seccion === "presidencia") {
    infoHTML += `
                <p class="candidato-nombre"><strong>Presidente:</strong> ${c.nombre_presidente}</p>
                <p class="candidato-nombre"><strong>Vicepresidente:</strong> ${c.nombre_vicepresidente}</p>
            `;
  }

  let propuestasHTML = "";
  if (c.candidatos_lista?.length > 0) {
    propuestasHTML = `<p class="lista-info">Candidatos en lista:</p><ul>${c.candidatos_lista
      .map((p) => `<li>${p}</li>`)
      .join("")}</ul>`;
  }

  card.innerHTML = `
            ${numeroHTML}
            <div class="candidato-header">${visualHTML}</div>
            <div class="candidato-body">${infoHTML}${propuestasHTML}</div>
            <div class="button-container"><button class="btn-seleccionar">Seleccionar</button></div>
        `;

  card.addEventListener("click", () => seleccionarCandidato(c.id, seccion));
  return card;
}

function seleccionarCandidato(id, seccion) {
  votosActuales[seccion] = votosActuales[seccion] === id ? null : id;
  actualizarSeleccionVisual(seccion);
}

function actualizarSeleccionVisual(seccion) {
  const cards = document.querySelectorAll(
    `.seccion-voto .candidato-card[data-seccion="${seccion}"]`
  );
  const idSeleccionado = votosActuales[seccion];

  cards.forEach((card) => {
    const buttonContainer = card.querySelector(".button-container");
    card.classList.remove("seleccionado", "deshabilitado");

    if (idSeleccionado) {
      if (card.dataset.id === idSeleccionado) {
        card.classList.add("seleccionado");
        buttonContainer.innerHTML = `<div class="checkmark-icon">✅</div>`;
      } else {
        card.classList.add("deshabilitado");
        buttonContainer.innerHTML = `<button class="btn-seleccionar" disabled>Seleccionar</button>`;
      }
    } else {
      buttonContainer.innerHTML = `<button class="btn-seleccionar">Seleccionar</button>`;
    }
  });
}

function registrarVoto() {
  if (etapaActual !== etapas.length - 1) {
    mostrarAlerta(
      "Error",
      "Confirme su selección en la pantalla de resumen para poder votar.",
      "error"
    );
    return;
  }
  if (!Object.values(votosActuales).every((v) => v)) {
    mostrarAlerta(
      "Error",
      "Debe seleccionar una opción en cada categoría para poder votar.",
      "error"
    );
    return;
  }
  votos[votanteActual.cedula] = { ...votosActuales };
  mostrarAlerta(
    "¡Voto Registrado!",
    "Su voto ha sido procesado exitosamente.",
    "success"
  );
  actualizarResultados();
  resetearFlujoVotacion();
}

function resetearFlujoVotacion() {
  document.getElementById("tarjeton-modal").classList.add("oculto");
  document.getElementById("cedula-voto").value = "";
  document.getElementById("datos-votante").classList.add("oculto");
  verificacionBiometrica = { facial: false, huella: false };
  votosActuales = { presidencia: null, senado: null, camara: null };
  renderizarCandidatos();
}

function actualizarResultados() {
  const contenedorResultados = document.getElementById("resultados-votos");
  if (!contenedorResultados) return;

  contenedorResultados.innerHTML = ""; // Limpia los resultados anteriores

  const conteoVotos = { presidencia: {}, senado: {}, camara: {} };

  for (const cedula in votos) {
    const voto = votos[cedula];
    if (voto.presidencia)
      conteoVotos.presidencia[voto.presidencia] =
        (conteoVotos.presidencia[voto.presidencia] || 0) + 1;
    if (voto.senado)
      conteoVotos.senado[voto.senado] =
        (conteoVotos.senado[voto.senado] || 0) + 1;
    if (voto.camara)
      conteoVotos.camara[voto.camara] =
        (conteoVotos.camara[voto.camara] || 0) + 1;
  }

  mostrarResultadosPorCategoria(
    "presidencia",
    "Presidente y Vicepresidente",
    conteoVotos.presidencia,
    candidatosData.presidencia_vicepresidencia
  );
  mostrarResultadosPorCategoria(
    "senado",
    "Senado de la República",
    conteoVotos.senado,
    candidatosData.senado_nacional
  );
  mostrarResultadosPorCategoria(
    "camara",
    "Cámara de Representantes",
    conteoVotos.camara,
    candidatosData.camara_territorial["11"]
  );
}

function mostrarResultadosPorCategoria(key, titulo, conteo, candidatos) {
  const contenedorResultados = document.getElementById("resultados-votos");
  const totalVotosCategoria = Object.values(conteo).reduce(
    (sum, count) => sum + count,
    0
  );

  let html = `<div class="results-category"><h3>${titulo}</h3>`;

  if (totalVotosCategoria === 0) {
    html += "<p>Aún no hay votos registrados para esta categoría.</p>";
  } else {
    const resultadosOrdenados = Object.entries(conteo).sort(
      ([, a], [, b]) => b - a
    );

    for (const [id, numVotos] of resultadosOrdenados) {
      const candidatoInfo = candidatos.find((c) => c.id === id);
      const nombre = candidatoInfo ? candidatoInfo.partido : "Desconocido";
      const porcentaje = ((numVotos / totalVotosCategoria) * 100).toFixed(1);

      html += `
                    <div class="result-item">
                        <div class="result-info">
                            <span class="result-name">${nombre}</span>
                            <span class="result-votes">${numVotos} Votos (${porcentaje}%)</span>
                        </div>
                        <div class="progress-bar-container">
                            <div class="progress-bar" style="width: ${porcentaje}%;"></div>
                        </div>
                    </div>
                `;
    }
  }
  html += "</div>";
  contenedorResultados.innerHTML += html;
}
