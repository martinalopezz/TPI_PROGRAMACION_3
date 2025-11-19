// URLs de MockAPI
const API_URL = 'https://691ce2ded58e64bf0d344924.mockapi.io/api/Hotel';
const USUARIOS_URL = `${API_URL}/Usuarios`;
const HABITACIONES_URL = `${API_URL}/Habitaciones`;

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
    const response = await fetch(USUARIOS_URL);
    usuarios = await response.json();
    return usuarios;
  } catch (error) {
    console.error('Error al cargar usuarios:', error);
    mostrarMensaje('Error al cargar usuarios', 'error');
    return [];
  }
}

async function obtenerHabitaciones() {
  try {
    const response = await fetch(HABITACIONES_URL);
    habitaciones = await response.json();
    return habitaciones;
  } catch (error) {
    console.error('Error al cargar habitaciones:', error);
    mostrarMensaje('Error al cargar habitaciones', 'error');
    return [];
  }
}

async function crearUsuario(datosUsuario) {
  try {
    const response = await fetch(USUARIOS_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datosUsuario)
    });
    const nuevoUsuario = await response.json();
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
    const response = await fetch(`${HABITACIONES_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(datos)
    });
    const actualizada = await response.json();
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
  console.log('Iniciando inicializarDatos...');
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
    
    const hab1 = await fetch(HABITACIONES_URL, {
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

    const hab2 = await fetch(HABITACIONES_URL, {
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

    const hab3 = await fetch(HABITACIONES_URL, {
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
function activarTabs() {
  const pestañas = document.querySelectorAll(".auth-tabs .tab");
  const formularios = document.querySelectorAll(".auth-forms .form");

  pestañas.forEach(pestaña => {
    pestaña.addEventListener("click", () => {
      pestañas.forEach(p => p.classList.remove("activo"));
      pestaña.classList.add("activo");

      formularios.forEach(f => {
        f.classList.toggle("activo", f.id.startsWith("form-" + pestaña.dataset.tab));
      });
    });
  });
}

// Registro
function registrar() {
  const formulario = document.getElementById("form-registro");
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nombre = document.getElementById("registro-nombre").value.trim();
    const email = document.getElementById("registro-email").value.trim();
    const password = document.getElementById("registro-clave").value.trim();

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
function ingresar() {
  const formulario = document.getElementById("form-ingreso");
  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("ingreso-email").value.trim();
    const password = document.getElementById("ingreso-clave").value.trim();

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
    
    renderizarDespuesDeIngresar();
  });
}

// Logout
function cerrarSesion() {
  limpiarUsuarioActual();
  habitacionSeleccionada = null;
  
  // MOSTRAR la tarjeta de login al cerrar sesión
  document.querySelector(".auth-card").style.display = "block";
  
  renderizarDespuesDeIngresar();
}

// Header
function renderizarEncabezado() {
  const botonCerrarSesion = document.getElementById("CerrarSesionBtn");

  if (usuarioActual) {
    botonCerrarSesion.style.display = "inline-block";
    botonCerrarSesion.onclick = cerrarSesion;
  } else {
    botonCerrarSesion.style.display = "none";
  }
}

// Formato moneda
function formatearPrecio(n) {
  return "$" + n.toLocaleString();
}

// Render habitaciones
async function renderizarHabitaciones() {
  await obtenerHabitaciones();
  
  const grilla = document.querySelector(".cards-grids");
  grilla.innerHTML = "";

  const hoy = new Date().toISOString().split("T")[0];

  habitaciones.forEach((habitacion, i) => {
    const tarjeta = document.createElement("article");
    tarjeta.className = "card card-habitacion";
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
      <img src="habitacion${i + 1}.jpg" alt="${habitacion.tipo}">
      <div class="cuerpo-card">
        <h3 class="titulo-card">${habitacion.tipo}</h3>
        <p class="subtitulo-card">Capacidad: estándar</p>
        <div class="pie-card">
          <span class="precio">${ocupada ? "OCUPADA" : formatearPrecio(habitacion.precio)}</span>
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
        solicitarEditarPrecio(boton.closest(".card-habitacion").dataset.roomId);
      });
    });
  }

  // Eventos para SELECCIONAR habitación (no reservar directamente)
  document.querySelectorAll(".card-habitacion").forEach(tarjeta => {
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
  document.querySelectorAll(".card-habitacion").forEach(c => c.classList.remove("seleccionada"));
  
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

  const fechaIngreso = document.getElementById("fechaIngreso").value;
  const fechaSalida = document.getElementById("fechaSalida").value;

  console.log('Fecha de ingreso:', fechaIngreso);
  console.log('Fecha de salida:', fechaSalida);

  if (!fechaIngreso || !fechaSalida) {
    mostrarMensaje("Elegí fechas de ingreso y salida", "error");
    return;
  }

  if (fechaSalida <= fechaIngreso) {
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
  const solapamiento = reservasActuales.some(r => 
    !(fechaSalida <= r.checkIn || fechaIngreso >= r.checkOut)
  );

  if (solapamiento) {
    mostrarMensaje("Las fechas seleccionadas están ocupadas", "error");
    return;
  }

  // Agregar nueva reserva
  const nuevaReserva = {
    userId: usuarioActual.id,
    userName: usuarioActual.nombre,
    checkIn: fechaIngreso,
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
    document.getElementById("fechaIngreso").value = "";
    document.getElementById("fechaSalida").value = "";
    
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

  const nuevo = prompt("Nuevo precio para " + habitacion.tipo, habitacion.precio);
  if (!nuevo) return;

  const n = parseInt(nuevo);
  if (isNaN(n) || n <= 0) {
    mostrarMensaje("Precio inválido", "error");
    return;
  }

  const actualizada = await actualizarHabitacion(idHabitacion, {
    ...habitacion,
    precio: n
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
  const lista = document.getElementById("lista-reservas");

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
    const div = document.createElement("div");
    div.className = "reservation-row";
    div.innerHTML = `
      <div>
        <strong>${r.roomTipo}</strong><br>
        ${r.checkIn} → ${r.checkOut} • ${r.estado}
      </div>
      <button class="btn-small btn-cancel" data-room="${r.roomId}" data-fecha="${r.fecha}">Cancelar</button>
    `;
    lista.appendChild(div);
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
  const panel = document.getElementById("panel-admin");

  if (!usuarioActual || usuarioActual.role !== "ADMIN") {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";
  await obtenerHabitaciones();
  await obtenerUsuarios();

  // SECCIÓN GESTIÓN DE USUARIOS
  const divUsuarios = document.getElementById("admin-usuarios");
  divUsuarios.innerHTML = `
    <h3>Gestión de Usuarios</h3>
    <div style="background: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
      <h4>Crear Nuevo Usuario</h4>
      <form id="admin-crear-usuario-form" style="display: grid; gap: 10px; max-width: 400px;">
        <input type="text" id="admin-usuario-nombre" placeholder="Nombre" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <input type="email" id="admin-usuario-email" placeholder="Email" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <input type="password" id="admin-usuario-clave" placeholder="Contraseña" required style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
        <select id="admin-usuario-rol" style="padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
          <option value="USUARIO">USUARIO</option>
          <option value="ADMIN">ADMIN</option>
        </select>
        <button type="submit" class="btn btn-primary" style="width: auto;">Crear Usuario</button>
      </form>
      <div id="admin-usuario-msg" style="margin-top: 10px; font-weight: 600;"></div>
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
        <button class="btn-small btn-cambiar-clave" data-id="${u.id}" data-nombre="${u.nombre}">Cambiar Password</button>
        ${u.id !== usuarioActual.id ? `<button class="btn-small btn-eliminar-usuario" data-id="${u.id}" data-nombre="${u.nombre}" style="background: #ef4444; color: white;">Eliminar</button>` : ''}
      </div>
    `;
    divUsuarios.appendChild(filaUsuario);
  });

  // Evento para crear usuario
  document.getElementById("admin-crear-usuario-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    await crearUsuarioAdmin();
  });

  // Eventos para cambiar password
  document.querySelectorAll(".btn-cambiar-clave").forEach(boton => {
    boton.addEventListener("click", () => cambiarClaveAdmin(boton.dataset.id, boton.dataset.nombre));
  });

  // Eventos para eliminar usuario
  document.querySelectorAll(".btn-eliminar-usuario").forEach(boton => {
    boton.addEventListener("click", () => eliminarUsuario(boton.dataset.id, boton.dataset.nombre));
  });

  // Habitaciones
  const divHabitaciones = document.getElementById("admin-habitaciones");
  divHabitaciones.innerHTML = "<h3>Habitaciones</h3>";

  habitaciones.forEach(r => {
    const d = document.createElement("div");
    d.className = "reservation-row";
    d.innerHTML = `
      <div>${r.tipo} • ${formatearPrecio(r.precio)}</div>
      <button class="btn-small btn-edit" data-id="${r.id}">Editar</button>
    `;
    divHabitaciones.appendChild(d);
  });

  divHabitaciones.querySelectorAll(".btn-edit").forEach(boton => {
    boton.addEventListener("click", () => solicitarEditarPrecio(boton.dataset.id));
  });

  // Reservas
  const divReservas = document.getElementById("admin-reservas");
  divReservas.innerHTML = "<h3>Reservas</h3>";

  let todasReservas = [];
  habitaciones.forEach(hab => {
    (hab.reservas || []).forEach(r => {
      todasReservas.push({
        ...r,
        roomId: hab.id,
        roomTipo: hab.tipo
      });
    });
  });

  if (todasReservas.length === 0) {
    divReservas.innerHTML += "<p>No hay reservas</p>";
  } else {
    todasReservas.forEach(r => {
      const fila = document.createElement("div");
      fila.className = "reservation-row";
      fila.innerHTML = `
        <div>
          <strong>${r.roomTipo}</strong> • ${r.checkIn} → ${r.checkOut} • ${r.userName}
        </div>
        <select class="sel-estado" data-room="${r.roomId}" data-fecha="${r.fecha}">
          <option ${r.estado === "pendiente" ? "selected" : ""}>pendiente</option>
          <option ${r.estado === "confirmada" ? "selected" : ""}>confirmada</option>
          <option ${r.estado === "cancelada" ? "selected" : ""}>cancelada</option>
        </select>
      `;
      divReservas.appendChild(fila);
    });

    divReservas.querySelectorAll(".sel-estado").forEach(s => {
      s.addEventListener("change", async () => {
        await cambiarEstadoReserva(s.dataset.room, s.dataset.fecha, s.value);
      });
    });
  }

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


// Crear usuario desde panel admin
async function crearUsuarioAdmin() {
  const nombre = document.getElementById("admin-usuario-nombre").value.trim();
  const email = document.getElementById("admin-usuario-email").value.trim();
  const password = document.getElementById("admin-usuario-clave").value.trim();
  const role = document.getElementById("admin-usuario-rol").value;
  
  const divMsg = document.getElementById("admin-usuario-msg");
  
  if (!nombre || !email || !password) {
    divMsg.textContent = "Completá todos los campos";
    divMsg.style.color = "red";
    setTimeout(() => divMsg.textContent = "", 3000);
    return;
  }

  await obtenerUsuarios();
  if (usuarios.some(u => u.email === email)) {
    divMsg.textContent = "El email ya está registrado";
    divMsg.style.color = "red";
    setTimeout(() => divMsg.textContent = "", 3000);
    return;
  }

  const nuevoUsuario = await crearUsuario({
    nombre,
    email,
    password,
    role
  });

  if (nuevoUsuario) {
    divMsg.textContent = `Usuario ${role} creado exitosamente`;
    divMsg.style.color = "green";
    setTimeout(() => divMsg.textContent = "", 3000);
    
    document.getElementById("admin-crear-usuario-form").reset();
    renderizarPanelAdmin();
  }
}

// Cambiar password de usuario
async function cambiarClaveAdmin(idUsuario) {
  const usuario = usuarios.find(u => u.id === idUsuario);
  if (!usuario) return;

  const nuevaClave = prompt(`Nueva contraseña para ${usuario.nombre}:`);
  if (!nuevaClave) return;

  if (nuevaClave.length < 6) {
    alert("La contraseña debe tener al menos 6 caracteres");
    return;
  }

  try {
    const response = await fetch(`${USUARIOS_URL}/${idUsuario}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...usuario,
        password: nuevaClave
      })
    });
    
    if (response.ok) {
      alert("Contraseña actualizada exitosamente");
      await obtenerUsuarios();
      renderizarPanelAdmin();
    }
  } catch (error) {
    console.error('Error al cambiar password:', error);
    alert("Error al cambiar la contraseña");
  }
}

// Eliminar usuario
async function eliminarUsuario(idUsuario) {
  const usuario = usuarios.find(u => u.id === idUsuario);
  if (!usuario) return;

  const confirmar = confirm(`¿Estás seguro de eliminar al usuario ${usuario.nombre}?`);
  if (!confirmar) return;

  try {
    const response = await fetch(`${USUARIOS_URL}/${idUsuario}`, {
      method: 'DELETE'
    });
    
    if (response.ok) {
      alert("Usuario eliminado exitosamente");
      await obtenerUsuarios();
      renderizarPanelAdmin();
    }
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    alert("Error al eliminar el usuario");
  }
}


// Render general
async function renderizarDespuesDeIngresar() {
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
  
  activarTabs();
  registrar();
  ingresar();
  renderizarDespuesDeIngresar();

  // MODIFICAR: El botón RESERVAR ahora llama a la función de reservar
  document.getElementById("btnBuscar").addEventListener("click", reservarHabitacion);
}

inicializar();