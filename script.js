// URLs de MockAPI
const URL_API = 'https://691ce2ded58e64bf0d344924.mockapi.io/api/Hotel';
const URL_USUARIOS = `${URL_API}/Usuarios`;
const URL_HABITACIONES = `${URL_API}/Habitaciones`;

// Variables globales
let usuarioActual = null;
let usuarios = [];
let habitaciones = [];
let habitacionSeleccionada = null;

// Funciones auxiliares para localStorage (solo para usuario actual)
const guardarUsuarioActual = (usuario) => {
  usuarioActual = usuario;
  localStorage.setItem('usuarioActual', JSON.stringify(usuario));
};

const cargarUsuarioActual = () => {
  const almacenado = localStorage.getItem('usuarioActual');
  if (almacenado) {
    usuarioActual = JSON.parse(almacenado);
  }
};

const limpiarUsuarioActual = () => {
  usuarioActual = null;
  localStorage.removeItem('usuarioActual');
};

// Funciones API
async function obtenerUsuarios() {
  try {
    const respuesta = await fetch(URL_USUARIOS);
    usuarios = await respuesta.json();
    return usuarios;
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    mostrarMensaje('Error al cargar usuarios', 'error');
    return [];
  }
}

async function obtenerHabitaciones() {
  try {
    const respuesta = await fetch(URL_HABITACIONES);
    habitaciones = await respuesta.json();
    return habitaciones;
  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    mostrarMensaje('Error al cargar habitaciones', 'error');
    return [];
  }
}

async function crearUsuario(datosUsuario) {
  try {
    const respuesta = await fetch(URL_USUARIOS, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosUsuario)
    });
    const nuevoUsuario = await respuesta.json();
    usuarios.push(nuevoUsuario);
    return nuevoUsuario;
  } catch (error) {
    console.error('Error al crear usuario:', error);
    mostrarMensaje('Error al registrar usuario', 'error');
    return null;
  }
}

async function actualizarHabitacion(id, datos) {
  try {
    const respuesta = await fetch(`${URL_HABITACIONES}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const actualizada = await respuesta.json();
    const indice = habitaciones.findIndex(h => h.id === id);
    if (indice !== -1) habitaciones[indice] = actualizada;
    return actualizada;
  } catch (error) {
    console.error('Error al actualizar habitación:', error);
    mostrarMensaje('Error al actualizar habitación', 'error');
    return null;
  }
}

// Inicialización con datos de prueba
async function inicializarDatos() {
  console.log('Iniciando inicialización de datos...');
  await obtenerUsuarios();
  await obtenerHabitaciones();
  
  console.log('Usuarios encontrados:', usuarios.length);
  console.log('Habitaciones encontradas:', habitaciones.length);

  // Crear admin si no existe
  if (!usuarios.some(u => u.role === "ADMIN")) {
    console.log('Creando admin...');
    await crearUsuario({
      nombre: "admin",
      email: "admin@hotel.com",
      password: "admin123",
      role: "ADMIN"
    });
  }

  // Si no hay habitaciones, crearlas UNA POR UNA con await
  if (habitaciones.length === 0) {
    console.log('No hay habitaciones. Creando...');
    
    const hab1 = await fetch(URL_HABITACIONES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: "Standard",
        precio: 10000,
        disponible: true,
        reservas: []
      })
    });
    console.log('Habitación 1 creada:', await hab1.json());

    const hab2 = await fetch(URL_HABITACIONES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: "Single",
        precio: 5000,
        disponible: true,
        reservas: []
      })
    });
    console.log('Habitación 2 creada:', await hab2.json());

    const hab3 = await fetch(URL_HABITACIONES, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tipo: "Suite",
        precio: 50000,
        disponible: true,
        reservas: []
      })
    });
    console.log('Habitación 3 creada:', await hab3.json());

    await obtenerHabitaciones();
    console.log('Habitaciones totales después de crear:', habitaciones.length);
  }
}

// Mensajes
function mostrarMensaje(texto, tipo = "ok") {
  let caja = document.querySelector(".msg-box");
  if (!caja) {
    caja = document.createElement("div");
    caja.className = "msg-box";
    caja.style.cssText = "margin-top: 10px; padding: 10px; border-radius: 8px; text-align: center; font-weight: 600;";
    document.querySelector(".auth-card").appendChild(caja);
  }
  caja.textContent = texto;
  caja.style.color = tipo === "error" ? "red" : "green";
  setTimeout(() => caja.textContent = "", 3000);
}

// Tabs
function activarPestanas() {
  const pestanas = document.querySelectorAll(".auth-tabs .tab");
  const formularios = document.querySelectorAll(".auth-forms .form");

  pestanas.forEach(pestana => {
    pestana.addEventListener("click", () => {
      pestanas.forEach(p => p.classList.remove("active"));
      pestana.classList.add("active");

      formularios.forEach(f => {
        f.classList.toggle("active", f.id.startsWith(pestana.dataset.tab));
      });
    });
  });
}

// Registro
function configurarRegistro() {
  const formulario = document.getElementById("register-form");
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();

    if (!nombre || !email || !password) {
      mostrarMensaje("Completá todos los campos", "error");
      return;
    }

    await obtenerUsuarios();
    if (usuarios.some(u => u.email === email)) {
      mostrarMensaje("Email ya registrado", "error");
      return;
    }

    const nuevoUsuario = await crearUsuario({
      nombre,
      email,
      password,
      role: "USUARIO"
    });

    if (nuevoUsuario) {
      mostrarMensaje("Registro exitoso");
      formulario.reset();
    }
  });
}

// Login
function configurarLogin() {
  const formulario = document.getElementById("login-form");
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    await obtenerUsuarios();
    const usuario = usuarios.find(u => u.email === email && u.password === password);

    if (!usuario) {
      mostrarMensaje("Credenciales incorrectas", "error");
      return;
    }

    guardarUsuarioActual(usuario);
    mostrarMensaje("Bienvenido " + usuario.nombre);
    
    // OCULTAR la tarjeta de login después de iniciar sesión
    setTimeout(() => {
      document.querySelector(".auth-card").style.display = "none";
    }, 1000);
    
    renderizarDespuesDeLogin();
  });
}

// Logout
function cerrarSesion() {
  limpiarUsuarioActual();
  habitacionSeleccionada = null;
  
  // MOSTRAR la tarjeta de login al cerrar sesión
  document.querySelector(".auth-card").style.display = "block";
  
  renderizarDespuesDeLogin();
}

// Header
function renderizarEncabezado() {
  const botonCerrarSesion = document.getElementById("logoutBtn");

  if (usuarioActual) {
    botonCerrarSesion.style.display = "inline-block";
    botonCerrarSesion.onclick = cerrarSesion;
  } else {
    botonCerrarSesion.style.display = "none";
  }
}

// Formato moneda
function formatearPrecio(numero) {
  return "$" + numero.toLocaleString();
}

// Render habitaciones
async function renderizarHabitaciones() {
  await obtenerHabitaciones();
  
  const grilla = document.querySelector(".cards-grid");
  grilla.innerHTML = "";

  const hoy = new Date().toISOString().split("T")[0];

  habitaciones.forEach((habitacion, indice) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "card room-card";
    tarjeta.dataset.roomId = habitacion.id;

    // Verificar si hay reservas activas
    const reservasActivas = habitacion.reservas || [];
    const ocupada = reservasActivas.some(r => 
      hoy >= r.checkIn && hoy <= r.checkOut
    );

    // Agregar clase de selección si es la habitación seleccionada
    if (habitacionSeleccionada === habitacion.id) {
      tarjeta.classList.add("seleccionada");
    }

    tarjeta.innerHTML = `
      <img src="habitacion${indice + 1}.jpg" alt="${habitacion.tipo}">
      <div class="card-body">
        <h3 class="card-title">${habitacion.tipo}</h3>
        <p class="card-sub">Capacidad: estándar</p>
        <div class="card-footer">
          <span class="price">${ocupada ? "OCUPADA" : formatearPrecio(habitacion.precio)}</span>
          ${usuarioActual && usuarioActual.role === "ADMIN" ? 
            `<button class="btn btn-small btn-edit-price">Editar</button>` : 
            ''}
        </div>
      </div>
    `;

    if (ocupada) tarjeta.classList.add("ocupada");

    grilla.appendChild(tarjeta);
  });

  // Eventos solo si es admin
  if (usuarioActual && usuarioActual.role === "ADMIN") {
    document.querySelectorAll(".btn-edit-price").forEach(boton => {
      boton.addEventListener("click", (e) => {
        e.stopPropagation();
        solicitarEditarPrecio(boton.closest(".room-card").dataset.roomId);
      });
    });
  }

  // Eventos para SELECCIONAR habitación (no reservar directamente)
  document.querySelectorAll(".room-card").forEach(tarjeta => {
    tarjeta.addEventListener("click", () => seleccionarHabitacion(tarjeta));
  });
}

// NUEVA FUNCIÓN: Seleccionar habitación
function seleccionarHabitacion(tarjeta) {
  if (!usuarioActual) {
    mostrarMensaje("Iniciá sesión para reservar", "error");
    return;
  }

  if (tarjeta.classList.contains("ocupada")) {
    mostrarMensaje("Habitación ocupada", "error");
    return;
  }

  // Quitar selección anterior
  document.querySelectorAll(".room-card").forEach(t => t.classList.remove("seleccionada"));
  
  // Marcar nueva selección
  tarjeta.classList.add("seleccionada");
  habitacionSeleccionada = tarjeta.dataset.roomId;
  
  const habitacion = habitaciones.find(h => h.id === habitacionSeleccionada);
  console.log('Habitación seleccionada:', habitacion);
  mostrarMensaje(`Habitación ${habitacion.tipo} seleccionada - Elegí fechas y presioná RESERVAR`);
}

// MODIFICAR: Reservar ahora usa la habitación seleccionada
async function reservarHabitacion() {
  console.log('=== INICIANDO RESERVA ===');
  console.log('Usuario actual:', usuarioActual);
  console.log('Habitación seleccionada ID:', habitacionSeleccionada);
  
  if (!usuarioActual) {
    mostrarMensaje("Iniciá sesión", "error");
    return;
  }

  if (!habitacionSeleccionada) {
    mostrarMensaje("Primero seleccioná una habitación", "error");
    return;
  }

  const fechaEntrada = document.getElementById("checkin").value;
  const fechaSalida = document.getElementById("checkout").value;

  console.log('Check-in:', fechaEntrada);
  console.log('Check-out:', fechaSalida);

  if (!fechaEntrada || !fechaSalida) {
    mostrarMensaje("Elegí fechas de check-in y check-out", "error");
    return;
  }

  if (fechaSalida <= fechaEntrada) {
    mostrarMensaje("La fecha de salida debe ser posterior a la entrada", "error");
    return;
  }

  await obtenerHabitaciones();
  
  const habitacion = habitaciones.find(h => h.id === habitacionSeleccionada);
  console.log('Habitación encontrada:', habitacion);
  
  if (!habitacion) {
    mostrarMensaje("Habitación no encontrada", "error");
    return;
  }

  const reservasActuales = habitacion.reservas || [];
  console.log('Reservas actuales de esta habitación:', reservasActuales);

  // Verificar superposición de fechas
  const haySuperposicion = reservasActuales.some(r => 
    !(fechaSalida <= r.checkIn || fechaEntrada >= r.checkOut)
  );

  if (haySuperposicion) {
    mostrarMensaje("Las fechas seleccionadas están ocupadas", "error");
    return;
  }

  // Agregar nueva reserva
  const nuevaReserva = {
    userId: usuarioActual.id,
    userName: usuarioActual.nombre,
    checkIn: fechaEntrada,
    checkOut: fechaSalida,
    estado: "pendiente",
    fecha: new Date().toISOString()
  };

  console.log('Nueva reserva a crear:', nuevaReserva);
  
  reservasActuales.push(nuevaReserva);

  // Actualizar habitación en MockAPI
  console.log('Actualizando habitación con reservas:', reservasActuales);
  
  const actualizada = await actualizarHabitacion(habitacionSeleccionada, {
    tipo: habitacion.tipo,
    precio: habitacion.precio,
    disponible: habitacion.disponible,
    reservas: reservasActuales
  });

  console.log('Resultado de actualización:', actualizada);

  if (actualizada) {
    mostrarMensaje("¡Reserva creada exitosamente!");
    habitacionSeleccionada = null;
    
    // Limpiar fechas
    document.getElementById("checkin").value = "";
    document.getElementById("checkout").value = "";
    
    renderizarHabitaciones();
    renderizarMisReservas();
    renderizarPanelAdmin();
  } else {
    mostrarMensaje("Error al crear la reserva", "error");
  }
}

// Editar precio
async function solicitarEditarPrecio(idHabitacion) {
  const habitacion = habitaciones.find(h => h.id === idHabitacion);
  if (!habitacion) return;

  const nuevoPrecio = prompt("Nuevo precio para " + habitacion.tipo, habitacion.precio);
  if (!nuevoPrecio) return;

  const precio = parseInt(nuevoPrecio);
  if (isNaN(precio) || precio <= 0) {
    mostrarMensaje("Precio inválido", "error");
    return;
  }

  const actualizada = await actualizarHabitacion(idHabitacion, {
    ...habitacion,
    precio: precio
  });

  if (actualizada) {
    mostrarMensaje("Precio actualizado");
    renderizarHabitaciones();
    renderizarPanelAdmin();
  }
}

// Mis reservas
async function renderizarMisReservas() {
  const panel = document.getElementById("mis-reservas");
  const lista = document.getElementById("reservations-list");

  if (!usuarioActual) {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  await obtenerHabitaciones();

  // Recopilar todas las reservas del usuario
  let misReservas = [];
  habitaciones.forEach(hab => {
    const reservasHab = (hab.reservas || []).filter(r => r.userId === usuarioActual.id);
    reservasHab.forEach(r => {
      misReservas.push({
        ...r,
        roomId: hab.id,
        roomTipo: hab.tipo
      });
    });
  });

  if (misReservas.length === 0) {
    lista.innerHTML = "<p>No tenés reservas</p>";
    return;
  }

  lista.innerHTML = "";
  misReservas.forEach(r => {
    const fila = document.createElement("div");
    fila.className = "reservation-row";
    fila.innerHTML = `
      <div>
        <strong>${r.roomTipo}</strong><br>
        ${r.checkIn} → ${r.checkOut} • ${r.estado}
      </div>
      <button class="btn-small btn-cancel" data-room="${r.roomId}" data-fecha="${r.fecha}">Cancelar</button>
    `;
    lista.appendChild(fila);
  });

  lista.querySelectorAll(".btn-cancel").forEach(boton => {
    boton.addEventListener("click", () => 
      cancelarReserva(boton.dataset.room, boton.dataset.fecha)
    );
  });
}

// Cancelar reserva
async function cancelarReserva(idHabitacion, fecha) {
  const habitacion = habitaciones.find(h => h.id === idHabitacion);
  if (!habitacion) return;

  const reservasActualizadas = (habitacion.reservas || []).filter(r => 
    r.fecha !== fecha
  );

  const actualizada = await actualizarHabitacion(idHabitacion, {
    ...habitacion,
    reservas: reservasActualizadas
  });

  if (actualizada) {
    mostrarMensaje("Reserva cancelada");
    renderizarHabitaciones();
    renderizarMisReservas();
    renderizarPanelAdmin();
  }
}

// Panel admin
async function renderizarPanelAdmin() {
  const panel = document.getElementById("admin-panel");

  if (!usuarioActual || usuarioActual.role !== "ADMIN") {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  await obtenerHabitaciones();
  await obtenerUsuarios();

  // SECCIÓN GESTIÓN DE USUARIOS
  const divUsuarios = document.getElementById("admin-users");
  divUsuarios.innerHTML = `
    <h3>Gestión de Usuarios</h3>
    <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
      <h4>Crear Nuevo Usuario</h4>
      <form id="admin-create-user-form" style="display: grid; gap: 10px; max-width: 400px;">
        <input type="text" id="admin-user-nombre" placeholder="Nombre" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <input type="email" id="admin-user-email" placeholder="Email" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <input type="password" id="admin-user-password" placeholder="Contraseña" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <select id="admin-user-role" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="USUARIO">USUARIO</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button type="submit" class="btn btn-primary" style="width: auto;">Crear Usuario</button>
      </form>
      <div id="admin-user-msg" style="margin-top: 10px; font-weight: 600;"></div>
    </div>
    
    <h4>Lista de Usuarios</h4>
  `;

  usuarios.forEach(u => {
    const filaUsuario = document.createElement("div");
    filaUsuario.className = "reservation-row";
    filaUsuario.innerHTML = `
      <div>
        <strong>${u.nombre}</strong> • ${u.email} • <span style="color: ${u.role === 'ADMIN' ? '#dc3545' : '#0b63c6'}">${u.role}</span>
      </div>
      <div style="display: flex; gap: 10px;">
        <button class="btn-small btn-change-password" data-id="${u.id}" data-nombre="${u.nombre}">Cambiar Password</button>
        ${u.id !== usuarioActual.id ? `<button class="btn-small btn-delete-user" data-id="${u.id}" data-nombre="${u.nombre}" style="background: #ef4444; color: white;">Eliminar</button>` : ''}
      </div>
    `;
    divUsuarios.appendChild(filaUsuario);
  });

  // Evento para crear usuario
  document.getElementById("admin-create-user-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await crearUsuarioDesdeAdmin();
  });

  // Eventos para cambiar password
  document.querySelectorAll(".btn-change-password").forEach(boton => {
    boton.addEventListener("click", () => cambiarPasswordDesdeAdmin(boton.dataset.id, boton.dataset.nombre));
  });

  // Eventos para eliminar usuario
  document.querySelectorAll(".btn-delete-user").forEach(boton => {
    boton.addEventListener("click", () => eliminarUsuario(boton.dataset.id, boton.dataset.nombre));
  });

  // Habitaciones
  const divHabitaciones = document.getElementById("admin-rooms");
  divHabitaciones.innerHTML = "<h3>Habitaciones</h3>";

  habitaciones.forEach(h => {
    const fila = document.createElement("div");
    fila.className = "reservation-row";
    fila.innerHTML = `
      <div>${h.tipo} • ${formatearPrecio(h.precio)}</div>
      <button class="btn-small btn-edit" data-id="${h.id}">Editar</button>
    `;
    divHabitaciones.appendChild(fila);
  });

  divHabitaciones.querySelectorAll(".btn-edit").forEach(boton => {
    boton.addEventListener("click", () => solicitarEditarPrecio(boton.dataset.id));
  });

  // Reservas
  const divReservas = document.getElementById("admin-reservations");
  divReservas.innerHTML = "<h3>Reservas</h3>";

  let todasLasReservas = [];
  habitaciones.forEach(hab => {
    (hab.reservas || []).forEach(r => {
      todasLasReservas.push({
        ...r,
        roomId: hab.id,
        roomTipo: hab.tipo
      });
    });
  });

  if (todasLasReservas.length === 0) {
    divReservas.innerHTML += "<p>No hay reservas</p>";
  } else {
    todasLasReservas.forEach(r => {
      const fila = document.createElement("div");
      fila.className = "reservation-row";
      fila.innerHTML = `
        <div>
          <strong>${r.roomTipo}</strong> • ${r.checkIn} → ${r.checkOut} • ${r.userName}
        </div>
        <select class="sel-status" data-room="${r.roomId}" data-fecha="${r.fecha}">
          <option ${r.estado === "pendiente" ? "selected" : ""}>pendiente</option>
          <option ${r.estado === "confirmada" ? "selected" : ""}>confirmada</option>
          <option ${r.estado === "cancelada" ? "selected" : ""}>cancelada</option>
        </select>
      `;
      divReservas.appendChild(fila);
    });

    divReservas.querySelectorAll(".sel-status").forEach(select => {
      select.addEventListener("change", async () => {
        await cambiarEstadoReserva(select.dataset.room, select.dataset.fecha, select.value);
      });
    });
  }

  dibujarGrafico(todasLasReservas);
}

// Cambiar estado de reserva
async function cambiarEstadoReserva(idHabitacion, fecha, nuevoEstado) {
  const habitacion = habitaciones.find(h => h.id === idHabitacion);
  if (!habitacion) return;

  const reservasActualizadas = (habitacion.reservas || []).map(r => {
    if (r.fecha === fecha) {
      return { ...r, estado: nuevoEstado };
    }
    return r;
  });

  await actualizarHabitacion(idHabitacion, {
    ...habitacion,
    reservas: reservasActualizadas
  });

  renderizarPanelAdmin();
}

// NUEVAS FUNCIONES ADMIN

// Crear usuario desde panel admin
async function crearUsuarioDesdeAdmin() {
  const nombre = document.getElementById("admin-user-nombre").value.trim();
  const email = document.getElementById("admin-user-email").value.trim();
  const password = document.getElementById("admin-user-password").value.trim();
  const rol = document.getElementById("admin-user-role").value;
  
  const divMensaje = document.getElementById("admin-user-msg");
  
  if (!nombre || !email || !password) {
    divMensaje.textContent = "Completá todos los campos";
    divMensaje.style.color = "red";
    setTimeout(() => divMensaje.textContent = "", 3000);
    return;
  }

  await obtenerUsuarios();
  if (usuarios.some(u => u.email === email)) {
    divMensaje.textContent = "El email ya está registrado";
    divMensaje.style.color = "red";
    setTimeout(() => divMensaje.textContent = "", 3000);
    return;
  }

  const nuevoUsuario = await crearUsuario({
    nombre,
    email,
    password,
    role: rol
  });

  if (nuevoUsuario) {
    divMensaje.textContent = `Usuario ${rol} creado exitosamente`;
    divMensaje.style.color = "green";
    setTimeout(() => divMensaje.textContent = "", 3000);
    
    document.getElementById("admin-create-user-form").reset();
    renderizarPanelAdmin();
  }
}

// Cambiar password de usuario
async function cambiarPasswordDesdeAdmin(idUsuario, nombreUsuario) {
  const usuario = usuarios.find(u => u.id === idUsuario);
  if (!usuario) {
    alert("Usuario no encontrado");
    return;
  }

  const nuevaPassword = prompt(`Nueva contraseña para ${nombreUsuario}:`);
  if (!nuevaPassword) return;

  if (nuevaPassword.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres");
    return;
  }

  try {
    const respuesta = await fetch(`${URL_USUARIOS}/${idUsuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...usuario,
        password: nuevaPassword
      })
    });
    
    if (respuesta.ok) {
      alert("Contraseña actualizada exitosamente");
      await obtenerUsuarios();
      renderizarPanelAdmin();
    } else {
      alert("Error al cambiar la contraseña");
    }
  } catch (error) {
    console.error('Error al cambiar password:', error);
    alert("Error al cambiar la contraseña");
  }
}

// Eliminar usuario
async function eliminarUsuario(idUsuario, nombreUsuario) {
  const usuario = usuarios.find(u => u.id === idUsuario);
  if (!usuario) {
    alert("Usuario no encontrado");
    return;
  }

  const confirmar = confirm(`¿Estás seguro de eliminar al usuario ${nombreUsuario}?\n\nEsta acción no se puede deshacer.`);
  if (!confirmar) return;

  console.log('Eliminando usuario con ID:', idUsuario);

  try {
    const respuesta = await fetch(`${URL_USUARIOS}/${idUsuario}`, {
      method: 'DELETE'
    });
    
    console.log('Respuesta de eliminación:', respuesta.status);
    
    if (respuesta.ok) {
      alert("Usuario eliminado exitosamente");
      await obtenerUsuarios();
      renderizarPanelAdmin();
    } else {
      alert("Error al eliminar el usuario");
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    alert("Error al eliminar el usuario: " + error.message);
  }
}

// Gráfico
function dibujarGrafico(todasLasReservas) {
  const contadores = { pendiente: 0, confirmada: 0, cancelada: 0 };

  todasLasReservas.forEach(r => contadores[r.estado]++);

  const contexto = document.getElementById("reservas-chart");
  if (!contexto) return;

  if (window._instanciaGrafico) window._instanciaGrafico.destroy();

  window._instanciaGrafico = new Chart(contexto, {
    type: 'doughnut',
    data: {
      labels: ['Pendiente', 'Confirmada', 'Cancelada'],
      datasets: [{
        data: [contadores.pendiente, contadores.confirmada, contadores.cancelada],
        backgroundColor: ['#ffc107', '#28a745', '#dc3545']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 15,
            padding: 10,
            font: {
              size: 12
            }
          }
        }
      }
    }
  });
}

// Render general
async function renderizarDespuesDeLogin() {
  renderizarEncabezado();
  await renderizarHabitaciones();
  await renderizarMisReservas();
  await renderizarPanelAdmin();
  
  // Si hay usuario logueado, ocultar auth-card
  if (usuarioActual) {
    document.querySelector(".auth-card").style.display = "none";
  }
}

// Inicialización
async function inicializar() {
  cargarUsuarioActual();
  await inicializarDatos();
  
  activarPestanas();
  configurarRegistro();
  configurarLogin();
  renderizarDespuesDeLogin();

  // MODIFICAR: El botón RESERVAR ahora llama a la función de reservar
  document.getElementById("btn-search").addEventListener("click", reservarHabitacion);
}

inicializar();