// Datos del sistema
let votantes = [];
let candidatos = {};
let votos = {};
let votanteActual = null;
let verificacionBiometrica = {
    facial: false,
    huella: false
};
let stream = null;
let candidatosData = {};
let votosActuales = {
    presidencia: null,
    senado: null,
    camara: null
};

// Departamentos de Colombia
const departamentos = [
    "Amazonas", "Antioquia", "Arauca", "Atlántico", "Bolívar", "Boyacá", "Caldas", "Caquetá",
    "Casanare", "Cauca", "Cesar", "Chocó", "Córdoba", "Cundinamarca", "Guainía", "Guaviare",
    "Huila", "La Guajira", "Magdalena", "Meta", "Nariño", "Norte de Santander", "Putumayo",
    "Quindío", "Risaralda", "San Andrés y Providencia", "Santander", "Sucre", "Tolima",
    "Valle del Cauca", "Vaupés", "Vichada"
];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarDepartamentos();
    configurarNavegacion();
    configurarFormularios();
    cargarVotantesEjemplo();
    cargarCandidatos();
});

// Inicializar select de departamentos
function inicializarDepartamentos() {
    const select = document.getElementById('departamento');
    departamentos.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept;
        option.textContent = dept;
        select.appendChild(option);
    });
}

// Configurar navegación
function configurarNavegacion() {
    const botones = document.querySelectorAll('nav button');
    botones.forEach(boton => {
        boton.addEventListener('click', function() {
            mostrarSeccion(this.id.replace('btn-', ''));
        });
    });
}

// Mostrar sección específica
function mostrarSeccion(seccion) {
    const secciones = document.querySelectorAll('.seccion');
    secciones.forEach(s => s.classList.add('oculto'));
    document.getElementById(seccion).classList.remove('oculto');
}

// Configurar formularios
function configurarFormularios() {
    // Formulario de registro de votantes
    document.getElementById('form-registro').addEventListener('submit', function(e) {
        e.preventDefault();
        registrarVotante();
    });

    // Formulario de candidatos
    document.getElementById('form-candidato').addEventListener('submit', function(e) {
        e.preventDefault();
        agregarCandidato();
    });

    // Formulario de votación
    document.getElementById('form-voto').addEventListener('submit', function(e) {
        e.preventDefault();
        registrarVoto();
    });

    // Botón de verificar cédula
    document.getElementById('btn-verificar-cedula').addEventListener('click', verificarCedula);

    // Botón de leer documento
    document.getElementById('btn-leer-documento').addEventListener('click', simularLecturaDocumento);

    // Botones de verificación biométrica
    document.getElementById('btn-capturar-foto').addEventListener('click', capturarFotoFacial);
    document.getElementById('btn-verificar-huella').addEventListener('click', verificarHuella);
}

// Registrar votante
function registrarVotante() {
    const cedula = document.getElementById('cedula').value;
    const nombre = document.getElementById('nombre').value;
    const departamento = document.getElementById('departamento').value;

    if (votantes.some(v => v.cedula === cedula)) {
        alert('Esta cédula ya está registrada.');
        return;
    }

    votantes.push({ cedula, nombre, departamento });
    actualizarListaVotantes();
    document.getElementById('form-registro').reset();
    alert('Votante registrado exitosamente.');
}

// Actualizar lista de votantes
function actualizarListaVotantes() {
    const lista = document.getElementById('lista-votantes');
    lista.innerHTML = '<h3>Votantes Registrados:</h3>';
    votantes.forEach(votante => {
        const div = document.createElement('div');
        div.className = 'votante';
        div.textContent = `${votante.nombre} - Cédula: ${votante.cedula} - ${votante.departamento}`;
        lista.appendChild(div);
    });
}

// Agregar candidato
function agregarCandidato() {
    const nombre = document.getElementById('nombre-candidato').value;
    const partido = document.getElementById('partido').value;

    candidatos.push({ nombre, partido });
    actualizarListaCandidatos();
    actualizarSelectCandidatos();
    document.getElementById('form-candidato').reset();
    alert('Candidato agregado exitosamente.');
}

// Actualizar lista de candidatos
function actualizarListaCandidatos() {
    const lista = document.getElementById('lista-candidatos');
    lista.innerHTML = '<h3>Candidatos Registrados:</h3>';
    candidatos.forEach(candidato => {
        const div = document.createElement('div');
        div.className = 'candidato';
        div.textContent = `${candidato.nombre} - ${candidato.partido}`;
        lista.appendChild(div);
    });
}

// Actualizar select de candidatos para votación
function actualizarSelectCandidatos() {
    const select = document.getElementById('candidato-voto');
    select.innerHTML = '<option value="">Seleccione...</option>';
    candidatos.forEach(candidato => {
        const option = document.createElement('option');
        option.value = candidato.nombre;
        option.textContent = candidato.nombre;
        select.appendChild(option);
    });
}

// Cargar votantes de ejemplo
function cargarVotantesEjemplo() {
    fetch('votantes.json')
        .then(response => response.json())
        .then(data => {
            votantes = data;
            actualizarListaVotantes();
        })
        .catch(error => console.error('Error cargando votantes:', error));
}

// Cargar candidatos
function cargarCandidatos() {
    fetch('candidatos.json')
        .then(response => response.json())
        .then(data => {
            candidatosData = data;
            renderizarCandidatos();
        })
        .catch(error => console.error('Error cargando candidatos:', error));
}

// Verificar cédula
function verificarCedula() {
    const cedula = document.getElementById('cedula-voto').value;
    const votante = votantes.find(v => v.cedula === cedula);

    if (!votante) {
        alert('Cédula no encontrada en el registro electoral.');
        ocultarDatosVotante();
        return;
    }

    votanteActual = votante;
    mostrarDatosVotante(votante);
    mostrarVerificacionBiometrica();
    inicializarCamara();
    resetearVerificacionBiometrica();
}

// Mostrar datos del votante
function mostrarDatosVotante(votante) {
    document.getElementById('info-nombre').textContent = `Nombre: ${votante.nombre}`;
    document.getElementById('info-departamento').textContent = `Departamento: ${votante.departamento}`;
    document.getElementById('info-municipio').textContent = `Municipio: ${votante.municipio}`;
    document.getElementById('info-localidad').textContent = `Localidad: ${votante.localidad}`;
    document.getElementById('info-barrio').textContent = `Barrio/Vereda: ${votante.barrio}`;
    document.getElementById('datos-votante').style.display = 'block';
}

// Ocultar datos del votante
function ocultarDatosVotante() {
    document.getElementById('datos-votante').style.display = 'none';
    document.getElementById('verificacion-biometrica').style.display = 'none';
    document.getElementById('btn-votar').disabled = true;
    votanteActual = null;
    detenerCamara();
    resetearVerificacionBiometrica();
}

// Mostrar verificación biométrica
function mostrarVerificacionBiometrica() {
    document.getElementById('verificacion-biometrica').style.display = 'block';
}

// Inicializar cámara
async function inicializarCamara() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        const video = document.getElementById('video-camara');
        video.srcObject = stream;
    } catch (error) {
        console.error('Error al acceder a la cámara:', error);
        alert('No se pudo acceder a la cámara. Verificación facial no disponible.');
    }
}

// Detener cámara
function detenerCamara() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
}

// Capturar foto facial
function capturarFotoFacial() {
    const video = document.getElementById('video-camara');
    const canvas = document.getElementById('canvas-captura');
    const estadoFacial = document.getElementById('estado-facial');

    if (!video.srcObject) {
        alert('Cámara no disponible');
        return;
    }

    estadoFacial.textContent = 'Procesando...';
    estadoFacial.setAttribute('data-estado', 'procesando');

    // Simular procesamiento
    setTimeout(() => {
        const context = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Simular verificación exitosa (90% de probabilidad)
        const exito = Math.random() > 0.1;
        if (exito) {
            estadoFacial.textContent = 'Verificado ✓';
            estadoFacial.setAttribute('data-estado', 'verificado');
            verificacionBiometrica.facial = true;
        } else {
            estadoFacial.textContent = 'Error - Reintente';
            estadoFacial.setAttribute('data-estado', 'error');
            verificacionBiometrica.facial = false;
        }
        actualizarEstadoGeneral();
    }, 2000);
}

// Verificar huella dactilar
function verificarHuella() {
    const estadoHuella = document.getElementById('estado-huella');

    estadoHuella.textContent = 'Procesando...';
    estadoHuella.setAttribute('data-estado', 'procesando');

    // Simular procesamiento de huella
    setTimeout(() => {
        // Simular verificación exitosa (85% de probabilidad)
        const exito = Math.random() > 0.15;
        if (exito) {
            estadoHuella.textContent = 'Verificado ✓';
            estadoHuella.setAttribute('data-estado', 'verificado');
            verificacionBiometrica.huella = true;
        } else {
            estadoHuella.textContent = 'Error - Reintente';
            estadoHuella.setAttribute('data-estado', 'error');
            verificacionBiometrica.huella = false;
        }
        actualizarEstadoGeneral();
    }, 1500);
}

// Resetear verificación biométrica
function resetearVerificacionBiometrica() {
    verificacionBiometrica.facial = false;
    verificacionBiometrica.huella = false;

    document.getElementById('estado-facial').textContent = 'Pendiente';
    document.getElementById('estado-facial').setAttribute('data-estado', 'pendiente');
    document.getElementById('estado-huella').textContent = 'Pendiente';
    document.getElementById('estado-huella').setAttribute('data-estado', 'pendiente');

    actualizarEstadoGeneral();
}

// Renderizar candidatos
function renderizarCandidatos() {
    renderizarSeccion('presidencia');
    renderizarSeccion('senado');
    renderizarSeccion('camara');
}

// Renderizar sección específica
function renderizarSeccion(seccion) {
    const contenedor = document.getElementById(`candidatos-${seccion}`);
    contenedor.innerHTML = '';

    candidatosData[seccion].forEach(candidato => {
        const card = crearTarjetaCandidato(candidato, seccion);
        contenedor.appendChild(card);
    });
}

// Crear tarjeta de candidato
function crearTarjetaCandidato(candidato, seccion) {
    const card = document.createElement('div');
    card.className = 'candidato-card';
    card.dataset.id = candidato.id;
    card.dataset.seccion = seccion;

    const seleccionado = votosActuales[seccion] === candidato.id;
    if (seleccionado) {
        card.classList.add('seleccionado');
    }

    card.innerHTML = `
        <div class="candidato-header">
            <img src="${candidato.foto}" alt="${candidato.nombre}" class="candidato-foto" onerror="this.src='https://via.placeholder.com/80x80?text=${candidato.nombre.charAt(0)}'">
            <div class="candidato-info">
                <h4>${candidato.nombre}</h4>
                <span class="candidato-partido" style="background-color: ${candidato.color}">${candidato.partido}</span>
            </div>
        </div>
        <p class="candidato-biografia">${candidato.biografia}</p>
        <div class="candidato-propuestas">
            <h5>Propuestas principales:</h5>
            <ul>
                ${candidato.propuestas.map(prop => `<li>${prop}</li>`).join('')}
            </ul>
        </div>
        <button class="btn-seleccionar" onclick="seleccionarCandidato('${candidato.id}', '${seccion}')">
            ${seleccionado ? 'Seleccionado' : 'Seleccionar'}
        </button>
    `;

    return card;
}

// Seleccionar candidato
function seleccionarCandidato(candidatoId, seccion) {
    // Si ya está seleccionado, deseleccionar
    if (votosActuales[seccion] === candidatoId) {
        votosActuales[seccion] = null;
    } else {
        votosActuales[seccion] = candidatoId;
    }

    // Actualizar visualización
    actualizarSeleccionSeccion(seccion);
    verificarVotacionCompleta();
}

// Actualizar selección en sección
function actualizarSeleccionSeccion(seccion) {
    const cards = document.querySelectorAll(`#candidatos-${seccion} .candidato-card`);

    cards.forEach(card => {
        const candidatoId = card.dataset.id;
        const seleccionado = votosActuales[seccion] === candidatoId;

        card.classList.remove('seleccionado', 'deshabilitado');
        const btn = card.querySelector('.btn-seleccionar');

        if (seleccionado) {
            card.classList.add('seleccionado');
            btn.textContent = 'Seleccionado';
        } else if (votosActuales[seccion] !== null) {
            card.classList.add('deshabilitado');
            btn.textContent = 'Seleccionar';
        } else {
            btn.textContent = 'Seleccionar';
        }
    });
}

// Verificar si la votación está completa
function verificarVotacionCompleta() {
    const completa = votosActuales.presidencia && votosActuales.senado && votosActuales.camara;
    document.getElementById('btn-votar').disabled = !completa;
}

// Actualizar estado general de verificación
function actualizarEstadoGeneral() {
    const estadoGeneral = document.getElementById('estado-verificacion');
    const contenedorEstado = document.getElementById('estado-general');

    if (verificacionBiometrica.facial && verificacionBiometrica.huella) {
        estadoGeneral.textContent = 'Completo';
        contenedorEstado.setAttribute('data-estado', 'completo');
        verificarVotacionCompleta();
    } else {
        estadoGeneral.textContent = 'Incompleto';
        contenedorEstado.setAttribute('data-estado', 'incompleto');
        document.getElementById('btn-votar').disabled = true;
    }
}

// Simular lectura de documento
function simularLecturaDocumento() {
    // Simular selección aleatoria de un votante registrado
    const votanteAleatorio = votantes[Math.floor(Math.random() * votantes.length)];
    document.getElementById('cedula-voto').value = votanteAleatorio.cedula;
    verificarCedula();
}

// Registrar voto
function registrarVoto() {
    if (!votanteActual) {
        alert('Debe verificar la cédula primero.');
        return;
    }

    if (!verificacionBiometrica.facial || !verificacionBiometrica.huella) {
        alert('Debe completar la verificación biométrica antes de votar.');
        return;
    }

    if (!votosActuales.presidencia || !votosActuales.senado || !votosActuales.camara) {
        alert('Debe seleccionar candidatos para todas las posiciones antes de votar.');
        return;
    }

    if (votos[votanteActual.cedula]) {
        alert('Este votante ya ha votado.');
        return;
    }

    // Registrar votos
    votos[votanteActual.cedula] = {
        presidencia: votosActuales.presidencia,
        senado: votosActuales.senado,
        camara: votosActuales.camara,
        timestamp: new Date().toISOString()
    };

    // Resetear formulario
    document.getElementById('form-voto').reset();
    ocultarDatosVotante();
    detenerCamara();
    resetearVotosActuales();

    alert('Voto registrado exitosamente. Verificación biométrica completada.');
    actualizarResultados();
}

// Resetear votos actuales
function resetearVotosActuales() {
    votosActuales = {
        presidencia: null,
        senado: null,
        camara: null
    };
    renderizarCandidatos();
}

// Actualizar resultados
function actualizarResultados() {
    const resultados = {
        presidencia: {},
        senado: {},
        camara: {}
    };

    // Contar votos por sección
    Object.values(votos).forEach(voto => {
        if (voto.presidencia) resultados.presidencia[voto.presidencia] = (resultados.presidencia[voto.presidencia] || 0) + 1;
        if (voto.senado) resultados.senado[voto.senado] = (resultados.senado[voto.senado] || 0) + 1;
        if (voto.camara) resultados.camara[voto.camara] = (resultados.camara[voto.camara] || 0) + 1;
    });

    const divResultados = document.getElementById('resultados-votos');
    divResultados.innerHTML = '<h3>Resultados Electorales:</h3>';

    // Mostrar resultados por sección
    ['presidencia', 'senado', 'camara'].forEach(seccion => {
        const tituloSeccion = seccion.charAt(0).toUpperCase() + seccion.slice(1);
        divResultados.innerHTML += `<h4>${tituloSeccion}:</h4>`;

        const votosSeccion = Object.entries(resultados[seccion])
            .sort(([,a], [,b]) => b - a); // Ordenar por votos descendentes

        if (votosSeccion.length === 0) {
            divResultados.innerHTML += '<p>No hay votos registrados aún.</p>';
        } else {
            votosSeccion.forEach(([candidatoId, votosCount]) => {
                const candidato = candidatosData[seccion].find(c => c.id === candidatoId);
                const nombreCandidato = candidato ? candidato.nombre : candidatoId;
                const div = document.createElement('div');
                div.className = 'resultado';
                div.innerHTML = `<strong>${nombreCandidato}</strong>: ${votosCount} voto${votosCount !== 1 ? 's' : ''}`;
                divResultados.appendChild(div);
            });
        }
    });

    // Mostrar estadísticas generales
    const totalVotos = Object.keys(votos).length;
    divResultados.innerHTML += `<div class="estadisticas-generales">
        <h4>Estadísticas Generales:</h4>
        <p>Total de votantes: ${totalVotos}</p>
        <p>Participación: ${((totalVotos / votantes.length) * 100).toFixed(1)}%</p>
    </div>`;
}