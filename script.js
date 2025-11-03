// Datos del sistema
let votantes = [];
let candidatos = [];
let votos = {};
let votanteActual = null;

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
    document.getElementById('btn-votar').disabled = false;
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
    document.getElementById('btn-votar').disabled = true;
    votanteActual = null;
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

    const candidato = document.getElementById('candidato-voto').value;

    if (votos[votanteActual.cedula]) {
        alert('Este votante ya ha votado.');
        return;
    }

    votos[votanteActual.cedula] = candidato;
    document.getElementById('form-voto').reset();
    ocultarDatosVotante();
    alert('Voto registrado exitosamente.');
    actualizarResultados();
}

// Actualizar resultados
function actualizarResultados() {
    const resultados = {};
    Object.values(votos).forEach(candidato => {
        resultados[candidato] = (resultados[candidato] || 0) + 1;
    });

    const divResultados = document.getElementById('resultados-votos');
    divResultados.innerHTML = '<h3>Resultados:</h3>';
    for (const [candidato, votosCount] of Object.entries(resultados)) {
        const div = document.createElement('div');
        div.className = 'resultado';
        div.textContent = `${candidato}: ${votosCount} votos`;
        divResultados.appendChild(div);
    }
}