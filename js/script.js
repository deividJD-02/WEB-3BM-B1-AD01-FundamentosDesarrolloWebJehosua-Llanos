// --- BASE DE DATOS LOCAL EN MEMORIA Y LOCALSTORAGE ---

// Usuarios del sistema (3 usuarios requeridos por la rúbrica)
const usuarios = [
    { id: 1, email: "cliente@correo.com", pass: "123456", nombre: "David Sanchez", rol: "Cliente" },
    { id: 2, email: "cliente2@correo.com", pass: "123456", nombre: "Jandri Bumbilaz", rol: "Cliente" },
    { id: 3, email: "admin@correo.com", pass: "admin123", nombre: "Jehosua Administrador", rol: "Administrador" }
];

let usuarioActual = JSON.parse(sessionStorage.getItem("usuarioActual")) || null;

let solicitudes = JSON.parse(localStorage.getItem("solicitudes_taller")) || [
    {
        id: 101,
        cliente: "David Sanchez",
        email: "cliente@correo.com",
        telefono: "0991234567",
        placa: "PBX-1234",
        marca: "Chevrolet",
        modelo: "Sail",
        anio: 2018,
        kilometraje: 45000,
        servicio: "Cambio de Aceite y Filtros",
        fecha: "2026-11-15",
        hora: "10:00 AM",
        combustible: "Gasolina",
        adicionales: ["Lavado General"],
        observaciones: "Cambio de filtro de aire también.",
        estado: "Pendiente"
    }
];

function guardarEnStorage() {
    localStorage.setItem("solicitudes_taller", JSON.stringify(solicitudes));
}

// --- CONTROL DE NAVEGACIÓN ENTRE SECCIONES ---
function navegar(idSeccion) {
    const secciones = document.querySelectorAll('.seccion-pagina');
    secciones.forEach(sec => sec.classList.add('d-none'));

    // Control de permisos según el estado de inicio de sesión
    if (idSeccion === 'solicitud' || idSeccion === 'mis-mantenimientos') {
        if (!usuarioActual) {
            Swal.fire("Acceso Denegado", "Debe iniciar sesión para ingresar a esta sección.", "warning");
            document.getElementById('sec-login').classList.remove('d-none');
            return;
        }
    }

    if (idSeccion === 'admin') {
        if (!usuarioActual || usuarioActual.rol !== 'Administrador') {
            Swal.fire("Acceso Restringido", "Solo el Administrador puede ingresar a este panel.", "error");
            document.getElementById('sec-inicio').classList.remove('d-none');
            return;
        }
        cargarTablaAdmin();
    }

    if (idSeccion === 'mis-mantenimientos') {
        cargarPerfilYTablaCliente();
    }

    const seccionActiva = document.getElementById(`sec-${idSeccion}`);
    if (seccionActiva) {
        seccionActiva.classList.remove('d-none');
    }
}

// --- SESIÓN Y USUARIOS ---
function iniciarSesion(event) {
    event.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const pass = document.getElementById('login-password').value.trim();

    const usuarioEncontrado = usuarios.find(user => user.email === email && user.pass === pass);

    if (usuarioEncontrado) {
        usuarioActual = usuarioEncontrado;
        sessionStorage.setItem("usuarioActual", JSON.stringify(usuarioActual));
        
        actualizarInterfazLogin();
        Swal.fire("¡Bienvenido!", `Sesión iniciada como ${usuarioActual.nombre}`, "success");

        if (usuarioActual.rol === 'Administrador') {
            navegar('admin');
        } else {
            navegar('mis-mantenimientos');
        }
    } else {
        Swal.fire("Error de acceso", "Credenciales incorrectas o cuenta no registrada.", "error");
    }
}

function cerrarSesion() {
    usuarioActual = null;
    sessionStorage.removeItem("usuarioActual");
    actualizarInterfazLogin();
    Swal.fire("Sesión cerrada", "Has salido del sistema.", "info");
    navegar('inicio');
}

function actualizarInterfazLogin() {
    const btnLoginNav = document.getElementById('btn-login-nav');
    const btnLogoutNav = document.getElementById('btn-logout-nav');
    const labelUsuario = document.getElementById('usuario-logged');
    const itemsCliente = document.querySelectorAll('.item-cliente');
    const itemsAdmin = document.querySelectorAll('.item-admin');

    if (usuarioActual) {
        btnLoginNav.classList.add('d-none');
        btnLogoutNav.classList.remove('d-none');
        labelUsuario.classList.remove('d-none');
        labelUsuario.textContent = `${usuarioActual.nombre} (${usuarioActual.rol})`;

        if (usuarioActual.rol === 'Cliente') {
            itemsCliente.forEach(item => item.classList.remove('d-none'));
            itemsAdmin.forEach(item => item.classList.add('d-none'));
        } else if (usuarioActual.rol === 'Administrador') {
            itemsCliente.forEach(item => item.classList.add('d-none'));
            itemsAdmin.forEach(item => item.classList.remove('d-none'));
        }
    } else {
        btnLoginNav.classList.remove('d-none');
        btnLogoutNav.classList.add('d-none');
        labelUsuario.classList.add('d-none');
        itemsCliente.forEach(item => item.classList.add('d-none'));
        itemsAdmin.forEach(item => item.classList.add('d-none'));
    }
}

function solicitarCitaDirecta() {
    if (!usuarioActual) {
        navegar('login');
    } else if (usuarioActual.rol === 'Administrador') {
        navegar('admin');
    } else {
        navegar('solicitud');
    }
}

// --- CREACIÓN Y VALIDACIÓN DE SOLICITUD ---
function guardarSolicitud(event) {
    event.preventDefault();

    const nombre = document.getElementById('sol-nombre').value.trim();
    const email = document.getElementById('sol-email').value.trim();
    const telefono = document.getElementById('sol-telefono').value.trim();
    const placa = document.getElementById('sol-placa').value.trim().toUpperCase();
    const marca = document.getElementById('sol-marca').value.trim();
    const modelo = document.getElementById('sol-modelo').value.trim();
    const anio = parseInt(document.getElementById('sol-anio').value);
    const kilometraje = parseInt(document.getElementById('sol-kilometraje').value);
    const servicio = document.getElementById('sol-servicio').value;
    const fecha = document.getElementById('sol-fecha').value;
    const hora = document.getElementById('sol-hora').value;
    const observaciones = document.getElementById('sol-observaciones').value.trim();

    const hoy = new Date().toISOString().split('T')[0];
    if (fecha < hoy) {
        Swal.fire("Fecha Inválida", "La fecha de mantenimiento no puede ser anterior al día de hoy.", "warning");
        return;
    }

    const regexPlaca = /^[A-Z]{3}-\d{3,4}$/;
    if (!regexPlaca.test(placa)) {
        Swal.fire("Placa Inválida", "Formato correcto: 3 letras, guion y 3 o 4 números (Ej: PBX-1234).", "warning");
        return;
    }

    const regexTel = /^\d{7,10}$/;
    if (!regexTel.test(telefono)) {
        Swal.fire("Teléfono Inválido", "Ingrese un número de teléfono válido (7 a 10 dígitos).", "warning");
        return;
    }

    if (anio < 1990 || anio > 2026) {
        Swal.fire("Año Inválido", "El año debe estar comprendido entre 1990 y 2026.", "warning");
        return;
    }

    if (kilometraje < 0) {
        Swal.fire("Kilometraje Inválido", "El kilometraje no puede ser un valor negativo.", "warning");
        return;
    }

    const combustible = document.querySelector('input[name="combustible"]:checked').value;

    const adicionales = [];
    if (document.getElementById('chk-lavado').checked) adicionales.push("Lavado General");
    if (document.getElementById('chk-escaneo').checked) adicionales.push("Escaneo por Computadora");

    const nuevaSolicitud = {
        id: Date.now(),
        cliente: nombre,
        email: email,
        telefono: telefono,
        placa: placa,
        marca: marca,
        modelo: modelo,
        anio: anio,
        kilometraje: kilometraje,
        servicio: servicio,
        fecha: fecha,
        hora: hora,
        combustible: combustible,
        adicionales: adicionales,
        observaciones: observaciones,
        estado: "Pendiente"
    };

    solicitudes.push(nuevaSolicitud);
    guardarEnStorage();

    Swal.fire("¡Éxito!", "La solicitud de mantenimiento ha sido registrada.", "success");
    document.getElementById('form-solicitud').reset();

    navegar('mis-mantenimientos');
}

// --- VISTAS CLIENTE Y ADMINISTRADOR ---
function cargarPerfilYTablaCliente() {
    document.getElementById('perfil-nombre').textContent = usuarioActual.nombre;
    document.getElementById('perfil-email').textContent = usuarioActual.email;

    const tbody = document.getElementById('tabla-cliente-body');
    tbody.innerHTML = "";

    const misSolicitudes = solicitudes.filter(sol => sol.email === usuarioActual.email);

    if (misSolicitudes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No registra solicitudes de mantenimiento.</td></tr>`;
        return;
    }

    misSolicitudes.forEach(sol => {
        const estadoVehiculo = sol.estado || 'Pendiente';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${sol.id}</td>
            <td>${sol.marca} ${sol.modelo} (${sol.anio})</td>
            <td><strong>${sol.placa}</strong></td>
            <td>${sol.servicio}</td>
            <td>${sol.fecha} ${sol.hora}</td>
            <td><span class="badge ${obtenerClaseEstado(estadoVehiculo)}">${estadoVehiculo}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

function cargarTablaAdmin() {
    const tbody = document.getElementById('tabla-admin-body');
    tbody.innerHTML = "";

    if (solicitudes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">No existen registros en el sistema.</td></tr>`;
        return;
    }

    solicitudes.forEach(sol => {
        const estadoActual = sol.estado || 'Pendiente';
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>#${sol.id}</td>
            <td>${sol.cliente}<br><small class="text-muted">${sol.email}</small></td>
            <td>${sol.marca} ${sol.modelo}<br><strong>${sol.placa}</strong></td>
            <td>${sol.servicio}</td>
            <td>${sol.fecha}</td>
            <td>
                <select class="form-select form-select-sm" onchange="cambiarEstado(${sol.id}, this.value)">
                    <option value="Pendiente" ${estadoActual === 'Pendiente' ? 'selected' : ''}>Pendiente</option>
                    <option value="En proceso" ${estadoActual === 'En proceso' ? 'selected' : ''}>En proceso</option>
                    <option value="Finalizado" ${estadoActual === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                    <option value="Cancelado" ${estadoActual === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                </select>
            </td>
            <td>
                <button class="btn btn-sm btn-danger fw-bold" onclick="eliminarSolicitud(${sol.id})">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function cambiarEstado(id, nuevoEstado) {
    const solicitud = solicitudes.find(sol => sol.id === id);
    if (solicitud) {
        solicitud.estado = nuevoEstado;
        guardarEnStorage();
        Swal.fire("Estado actualizado", `La solicitud #${id} cambió a ${nuevoEstado}`, "success");
    }
}

function eliminarSolicitud(id) {
    Swal.fire({
        title: "¿Está seguro de eliminar este registro?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#dc3545",
        cancelButtonColor: "#6c757d",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            solicitudes = solicitudes.filter(sol => sol.id !== id);
            guardarEnStorage();
            cargarTablaAdmin();
            Swal.fire("Eliminado", "El registro ha sido borrado.", "success");
        }
    });
}

function obtenerClaseEstado(estado) {
    switch (estado) {
        case 'Pendiente': return 'bg-warning text-dark';
        case 'En proceso': return 'bg-primary text-white';
        case 'Finalizado': return 'bg-success text-white';
        case 'Cancelado': return 'bg-danger text-white';
        default: return 'bg-secondary text-white';
    }
}

// Inicialización de la página
document.addEventListener("DOMContentLoaded", () => {
    actualizarInterfazLogin();

    const inputFecha = document.getElementById('sol-fecha');
    if (inputFecha) {
        const hoy = new Date().toISOString().split('T')[0];
        inputFecha.setAttribute('min', hoy);
    }

    if (usuarioActual) {
        const inputNombre = document.getElementById('sol-nombre');
        const inputEmail = document.getElementById('sol-email');
        if (inputNombre) inputNombre.value = usuarioActual.nombre;
        if (inputEmail) inputEmail.value = usuarioActual.email;
    }
});