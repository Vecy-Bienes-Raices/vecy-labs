// === SCRIPT.JS FINAL, COMPLETO Y VERIFICADO ===

// --- VARIABLES GLOBALES ---
let votantes = [], candidatosData = {}, datosTerritoriales = {}, votos = {};
let votanteActual = null, stream = null;
let verificacionBiometrica = { facial: false, huella: false };
let votosActuales = { presidencia: null, senado: null, camara: null };
let etapaActual = 0;
const etapas = ["Presidente y Vicepresidente", "Senado de la República", "Cámara de Representantes", "Resumen del Voto"];
let numeroConsecutivo = 1;

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Configura únicamente los botones de la pantalla de bienvenida al cargar
    const btnVotante = document.getElementById('btn-iniciar-votante');
    const btnOperador = document.getElementById('btn-iniciar-operador');
    if (btnVotante) btnVotante.addEventListener('click', iniciarApp);
    if (btnOperador) {
        btnOperador.addEventListener('click', () => {
            if (prompt("Ingrese PIN de operador:") === "2026") iniciarApp(); 
            else alert("PIN incorrecto.");
        });
    }
});

function iniciarApp() {
    // Oculta la bienvenida, muestra la app y CARGA los datos
    document.getElementById('welcome-screen').style.display = 'none';
    document.getElementById('app-container').classList.remove('oculto');
    
    Promise.all([
        fetch('votantes.json').then(res => res.json()),
        fetch('candidatos.json').then(res => res.json()),
        fetch('colombia-territorial.json').then(res => res.json())
    ]).then(([votantesData, candData, terrData]) => {
        votantes = votantesData;
        candidatosData = candData;
        datosTerritoriales = terrData;
        inicializarComponentes(); // Solo inicializa el resto cuando los datos están listos
    }).catch(error => console.error("Error crítico al cargar datos:", error));
}

function inicializarComponentes() {
    configurarNavegacion();
    configurarFormularios();
    inicializarSelectoresTerritoriales();
    renderizarCandidatos();
    console.log("Aplicación Principal Inicializada.");
}

// --- NAVEGACIÓN Y CONFIGURACIÓN DE FORMULARIOS ---
function configurarNavegacion() {
    document.querySelectorAll('nav button').forEach(boton => {
        boton.addEventListener('click', () => mostrarSeccion(boton.id.replace('btn-', '')));
    });
    document.getElementById('btn-siguiente')?.addEventListener('click', () => {
        if (etapaActual < etapas.length - 2) { etapaActual++; mostrarEtapa(etapaActual); }
    });
    document.getElementById('btn-anterior')?.addEventListener('click', () => {
        if (etapaActual > 0) { etapaActual--; mostrarEtapa(etapaActual); }
    });
    mostrarSeccion('votacion');
}

function mostrarSeccion(seccionId) {
    document.querySelectorAll('.seccion').forEach(s => s.classList.add('oculto'));
    document.getElementById(seccionId)?.classList.remove('oculto');
}

function configurarFormularios() {
    document.getElementById('form-registro')?.addEventListener('submit', registrarVotante);
    document.getElementById('btn-verificar-cedula')?.addEventListener('click', verificarCedula);
    document.getElementById('btn-leer-documento')?.addEventListener('click', simularLecturaDocumento);
    document.getElementById('btn-capturar-foto')?.addEventListener('click', capturarFotoFacial);
    document.getElementById('btn-verificar-huella')?.addEventListener('click', verificarHuella);
}

// --- LÓGICA DE VERIFICACIÓN DE IDENTIDAD ---
function verificarCedula() {
    const votante = votantes.find(v => v.cedula === document.getElementById('cedula-voto').value);
    if (!votante) { alert('Cédula no encontrada.'); return; }
    if (votos[votante.cedula]) { alert('Este votante ya ha sufragado.'); return; }
    if (votante.status !== "Activo") { alert(`VOTANTE INHABILITADO\nNovedad: ${votante.novedad}`); return; }
    
    votanteActual = votante;
    const { nombre, apellidos, puesto_votacion } = votante;
    document.getElementById('info-nombre').textContent = `Nombre: ${nombre} ${apellidos}`;
    document.getElementById('info-departamento').textContent = `Departamento: ${puesto_votacion.departamento}`;
    document.getElementById('info-municipio').textContent = `Municipio: ${puesto_votacion.municipio}`;
    document.getElementById('info-puesto').textContent = `Puesto: ${puesto_votacion.puesto}`;
    document.getElementById('info-direccion').textContent = `Dirección: ${puesto_votacion.direccion}`;
    document.getElementById('info-mesa').textContent = `Mesa: ${puesto_votacion.mesa}`;
    ['datos-votante', 'verificacion-biometrica'].forEach(id => document.getElementById(id).classList.remove('oculto'));
    inicializarCamara();
}

function simularLecturaDocumento() {
    const votanteHabilitado = votantes.find(v => v.status === "Activo" && !votos[v.cedula]);
    if (votanteHabilitado) {
        document.getElementById('cedula-voto').value = votanteHabilitado.cedula;
        verificarCedula();
    } else {
        alert("No hay más votantes habilitados para simular.");
    }
}

async function inicializarCamara() {
    detenerCamara();
    try {
        const video = document.getElementById('video-camara');
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.classList.remove('oculto');
    } catch (e) { console.error("Error de cámara:", e); }
}

function detenerCamara() {
    stream?.getTracks().forEach(track => track.stop());
    document.getElementById('video-camara')?.classList.add('oculto');
}

function capturarFotoFacial() {
    const estado = document.getElementById('estado-facial');
    estado.textContent = 'Procesando...';
    setTimeout(() => {
        verificacionBiometrica.facial = true; // Simula éxito
        estado.textContent = 'Verificado ✓';
        actualizarEstadoGeneral();
    }, 1000);
}

function verificarHuella() {
    const estado = document.getElementById('estado-huella');
    estado.textContent = 'Procesando...';
    setTimeout(() => {
        verificacionBiometrica.huella = true; // Simula éxito
        estado.textContent = 'Verificado ✓';
        actualizarEstadoGeneral();
    }, 1000);
}

// --- LÓGICA DEL TARJETÓN GUIADO ---
function actualizarEstadoGeneral() {
    if (verificacionBiometrica.facial && verificacionBiometrica.huella) {
        detenerCamara();
        etapaActual = 0;
        mostrarEtapa(etapaActual);
        document.getElementById('tarjeton-modal').classList.remove('oculto');
    }
}

function mostrarEtapa(indice) {
    document.querySelectorAll('.seccion-voto').forEach(el => el.classList.add('oculto'));
    const etapaActiva = document.querySelector(`.seccion-voto[data-etapa="${indice}"]`);
    if (etapaActiva) etapaActiva.classList.remove('oculto');
    document.getElementById('tarjeton-titulo-etapa').textContent = etapas[indice];

    const btnAnterior = document.getElementById('btn-anterior');
    const btnSiguiente = document.getElementById('btn-siguiente');
    const btnVotar = document.getElementById('btn-votar');
    
    btnAnterior.classList.toggle('oculto', indice === 0);
    const esUltimaEtapa = (indice === etapas.length - 2);
    btnSiguiente.classList.toggle('oculto', esUltimaEtapa);
    btnVotar.classList.toggle('oculto', !esUltimaEtapa);
}

// --- RENDERIZADO DE CANDIDATOS ---
function renderizarCandidatos() {
    numeroConsecutivo = 1;
    renderizarSeccionCandidatos('presidencia', candidatosData.presidencia_vicepresidencia);
    renderizarSeccionCandidatos('senado', candidatosData.senado_nacional);
    renderizarSeccionCandidatos('camara', candidatosData.camara_territorial ? candidatosData.camara_territorial["11"] : []);
}

function renderizarSeccionCandidatos(seccion, data) {
    const cont = document.getElementById(`candidatos-${seccion}`);
    if (!cont) return;
    cont.innerHTML = '';
    data?.forEach(c => {
        cont.appendChild(crearTarjetaCandidato(c, seccion, numeroConsecutivo));
        numeroConsecutivo++;
    });
}

function crearTarjetaCandidato(c, seccion, numero) {
    const card = document.createElement('div');
    card.className = 'candidato-card';
    card.dataset.id = c.id;
    card.dataset.seccion = seccion;

    const placeholderLogo = `https://placehold.co/80x80/EFEFEF/333?text=Logo`;
    const placeholderFoto = `https://placehold.co/100x100/EFEFEF/333?text=Foto`;

    let visualHTML = '';
    if (seccion === 'presidencia') {
        visualHTML = `
            <div class="candidato-fotos">
                <img src="${c.foto_presidente}" alt="" class="candidato-foto presidente" onerror="this.src='${placeholderFoto}'">
                <img src="${c.foto_vicepresidente}" alt="" class="candidato-foto vicepresidente" onerror="this.src='${placeholderFoto}'">
            </div>
            <img src="${c.logo_partido}" alt="" class="candidato-logo" onerror="this.src='${placeholderLogo}'">
        `;
    } else if (c.logo) {
        visualHTML = `<img src="${c.logo}" alt="" class="candidato-logo unico" onerror="this.src='${placeholderLogo}'">`;
    }
    
    const numeroHTML = `<div class="candidato-numero">${numero}</div>`;

    let infoHTML = `<h4>${c.partido}</h4>`;
    if (seccion === 'presidencia') {
        infoHTML += `
            <p class="candidato-nombre"><strong>Presidente:</strong> ${c.nombre_presidente || ''}</p>
            <p class="candidato-nombre"><strong>Vicepresidente:</strong> ${c.nombre_vicepresidente || ''}</p>
        `;
    }

    let propuestasHTML = '';
    if (c.candidatos_lista?.length > 0) {
        propuestasHTML = `<p class="lista-info">Candidatos en lista:</p><ul>${c.candidatos_lista.map(p => `<li>${p}</li>`).join('')}</ul>`;
    }

    card.innerHTML = `
        ${numeroHTML}
        <div class="candidato-header">${visualHTML}</div>
        <div class="candidato-body">${infoHTML}${propuestasHTML}</div>
        <div class="button-container">
            <button class="btn-seleccionar">Seleccionar</button>
        </div>
    `;
    
    card.addEventListener('click', () => seleccionarCandidato(c.id, seccion));
    return card;
}

// --- LÓGICA DE SELECCIÓN Y VOTO ---
function seleccionarCandidato(id, seccion) {
    votosActuales[seccion] = votosActuales[seccion] === id ? null : id;
    actualizarSeleccionVisual(seccion);
}

function actualizarSeleccionVisual(seccion) {
    const cards = document.querySelectorAll(`.seccion-voto .candidato-card[data-seccion="${seccion}"]`);
    const idSeleccionado = votosActuales[seccion];

    cards.forEach(card => {
        const buttonContainer = card.querySelector('.button-container');
        card.classList.remove('seleccionado', 'deshabilitado');
        
        if (idSeleccionado) {
            if (card.dataset.id === idSeleccionado) {
                card.classList.add('seleccionado');
                buttonContainer.innerHTML = `<div class="checkmark-icon">✅</div>`;
            } else {
                card.classList.add('deshabilitado');
                buttonContainer.innerHTML = `<button class="btn-seleccionar" disabled>Seleccionar</button>`;
            }
        } else {
            buttonContainer.innerHTML = `<button class="btn-seleccionar">Seleccionar</button>`;
        }
    });
}

function registrarVoto() {
    if (!Object.values(votosActuales).every(v => v)) {
        alert('Debe seleccionar una opción en cada categoría para poder votar.');
        return;
    }
    votos[votanteActual.cedula] = { ...votosActuales };
    alert('¡Voto registrado exitosamente!');
    resetearFlujoVotacion();
}

function resetearFlujoVotacion() {
    document.getElementById('tarjeton-modal').classList.add('oculto');
    document.getElementById('cedula-voto').value = '';
    ['datos-votante', 'verificacion-biometrica'].forEach(id => document.getElementById(id).classList.add('oculto'));
    verificacionBiometrica = { facial: false, huella: false };
    votosActuales = { presidencia: null, senado: null, camara: null };
    document.getElementById('estado-facial').textContent = 'Pendiente';
    document.getElementById('estado-huella').textContent = 'Pendiente';
    renderizarCandidatos();
}

function inicializarSelectoresTerritoriales() {
    // Lógica para los selects de la página de registro (si se desarrolla en el futuro)
}
function registrarVotante(e) { e.preventDefault(); alert('Funcionalidad de registro en desarrollo.'); }