// inicio
const save = (k,v) => localStorage.setItem(k, JSON.stringify(v));
const load = k => JSON.parse(localStorage.getItem(k));

function seedData() {
  const users = load("users") || [];
  if (!users.some(u=>u.role==="ADMIN")) {
    users.push({ id: Date.now(), nombre: "admin", email: "admin@hotel.com", password: "admin123", role: "ADMIN" });
    save("users", users);
  }

  const rooms = load("rooms") || [];
  if (rooms.length === 0) {
    save("rooms", [
      { id: 1, tipo: "Standard", precio: 10000 },
      { id: 2, tipo: "Single", precio: 5000 },
      { id: 3, tipo: "Suite", precio: 50000 }
    ]);
  }

  if (!load("reservas")) save("reservas", []);
}

seedData();

// mensajes
function mostrarMensaje(txt, tipo="ok") {
  let caja = document.querySelector(".msg-box");
  if (!caja) {
    caja = document.createElement("div");
    caja.className = "msg-box";
    document.querySelector(".auth-card").appendChild(caja);
  }
  caja.textContent = txt;
  caja.style.color = tipo==="error" ? "red" : "green";
  setTimeout(()=> caja.textContent = "", 3000);
}

// tabs
function activarTabs() {
  const tabs = document.querySelectorAll(".auth-tabs .tab");
  const forms = document.querySelectorAll(".auth-forms .form");

  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t=>t.classList.remove("active"));
      tab.classList.add("active");

      forms.forEach(f => {
        f.classList.toggle("active", f.id.startsWith(tab.dataset.tab));
      });
    });
  });
}

// registro
function registrar() {
  const form = document.getElementById("register-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const nombre = document.getElementById("reg-nombre").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value.trim();

    if (!nombre || !email || !password) { mostrarMensaje("Completá todos los campos","error"); return; }

    const users = load("users") || [];
    if (users.some(u => u.email === email)) { mostrarMensaje("Email ya registrado","error"); return;}

    users.push({ id: Date.now(), nombre, email, password, role: "USUARIO" });
    save("users", users);
    mostrarMensaje("Registro exitoso");
    form.reset();
  });
}

// login
function login() {
  const form = document.getElementById("login-form");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value.trim();

    const users = load("users") || [];
    const user = users.find(u => u.email === email && u.password === password);

    if (!user) { mostrarMensaje("Credenciales incorrectas","error"); return; }

    save("currentUser", user);
    mostrarMensaje("Bienvenido " + user.nombre);
    renderAfterLogin();
  });
}

// logout
function logout() {
  localStorage.removeItem("currentUser");
  renderAfterLogin();
}

// header
function renderHeader() {
  const container = document.querySelector(".header-inner");
  const user = load("currentUser");
  let btn = document.getElementById("logout-btn");

  if (user && !btn) {
    btn = document.createElement("button");
    btn.id = "logout-btn";
    btn.className = "btn";
    btn.textContent = "Cerrar sesión";
    btn.addEventListener("click", logout);
    container.appendChild(btn);
  } else if (!user && btn) {
    btn.remove();
  }
}

// formato moneda
function formatPrice(n) { return "$" + n.toLocaleString(); }

// render habitaciones
function renderRooms() {
  const grid = document.querySelector(".cards-grid");
  grid.innerHTML = "";

  const rooms = load("rooms") || [];
  const reservas = load("reservas") || [];
  const hoy = new Date().toISOString().split("T")[0];

  rooms.forEach((room, i) => {
    const card = document.createElement("article");
    card.className = "card room-card";
    card.dataset.roomId = room.id;

    const ocupada = reservas.some(r => r.roomId === room.id && hoy >= r.checkIn && hoy <= r.checkOut);

    card.innerHTML = `
      <img src="habitacion${i+1}.jpg" alt="${room.tipo}">
      <div class="card-body">
        <h3 class="card-title">${room.tipo}</h3>
        <p class="card-sub">Capacidad: estándar</p>
        <div class="card-footer">
          <span class="price">${ocupada ? "OCUPADA" : formatPrice(room.precio)}</span>
          <button class="btn btn-small btn-edit-price">Editar</button>
        </div>
      </div>
    `;

    if (ocupada) card.classList.add("ocupada");

    grid.appendChild(card);
  });

  document.querySelectorAll(".btn-edit-price").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      promptEditarPrecio(parseInt(btn.closest(".room-card").dataset.roomId));
    });
  });

  document.querySelectorAll(".room-card").forEach(card => {
    card.addEventListener("click", () => reservarDesdeCard(card));
  });
}

// reservar
function reservarDesdeCard(card) {
  const user = load("currentUser");
  if (!user) { mostrarMensaje("Iniciá sesión","error"); return; }
  if (card.classList.contains("ocupada")) { mostrarMensaje("Habitación ocupada","error"); return; }

  const checkIn = document.getElementById("checkin").value;
  const checkOut = document.getElementById("checkout").value;

  if (!checkIn || !checkOut) { mostrarMensaje("Elegí fechas","error"); return; }
  if (checkOut <= checkIn) { mostrarMensaje("Fechas inválidas","error"); return; }

  const roomId = parseInt(card.dataset.roomId);
  let reservas = load("reservas") || [];

  const overlap = reservas.some(r => r.roomId === roomId && !(checkOut <= r.checkIn || checkIn >= r.checkOut));
  if (overlap) { mostrarMensaje("Fechas ocupadas","error"); return; }

  reservas.push({
    id: Date.now(),
    userId: user.id,
    roomId,
    checkIn,
    checkOut,
    estado: "pendiente"
  });

  save("reservas", reservas);
  mostrarMensaje("Reserva creada");

  renderRooms();
  renderMisReservas();
  renderAdminPanel();
}

// editar precio
function promptEditarPrecio(roomId) {
  const rooms = load("rooms") || [];
  const room = rooms.find(r => r.id === roomId);
  const nuevo = prompt("Nuevo precio para " + room.tipo, room.precio);
  if (!nuevo) return;

  const n = parseInt(nuevo);
  if (isNaN(n) || n <= 0) { mostrarMensaje("Precio inválido","error"); return; }

  room.precio = n;
  save("rooms", rooms);
  renderRooms();
  renderAdminPanel();
}

// mis reservas
function renderMisReservas() {
  const panel = document.getElementById("mis-reservas");
  const list = document.getElementById("reservations-list");
  const user = load("currentUser");

  if (!user) { panel.style.display = "none"; return; }

  panel.style.display = "block";
  const reservas = (load("reservas") || []).filter(r => r.userId === user.id);

  if (reservas.length === 0) {
    list.innerHTML = "<p>No tenés reservas</p>";
    return;
  }

  list.innerHTML = "";
  reservas.forEach(r => {
    const room = (load("rooms")||[]).find(x => x.id === r.roomId);

    const div = document.createElement("div");
    div.className = "reservation-row";
    div.innerHTML = `
      <div>
        <strong>${room.tipo}</strong><br>
        ${r.checkIn} → ${r.checkOut}
      </div>
      <button class="btn-small btn-cancel" data-id="${r.id}">Cancelar</button>
    `;

    list.appendChild(div);
  });

  list.querySelectorAll(".btn-cancel").forEach(btn => {
    btn.addEventListener("click", () => cancelarReserva(parseInt(btn.dataset.id)));
  });
}

// cancelar reserva
function cancelarReserva(id) {
  let reservas = load("reservas") || [];
  reservas = reservas.filter(r => r.id !== id);
  save("reservas", reservas);
  mostrarMensaje("Reserva cancelada");

  renderRooms();
  renderMisReservas();
  renderAdminPanel();
}

// panel admin
function renderAdminPanel() {
  const user = load("currentUser");
  const panel = document.getElementById("admin-panel");

  if (!user || user.role !== "ADMIN") {
    panel.style.display = "none";
    return;
  }

  panel.style.display = "block";

  const roomsDiv = document.getElementById("admin-rooms");
  roomsDiv.innerHTML = "<h3>Habitaciones</h3>";

  const rooms = load("rooms") || [];
  rooms.forEach(r => {
    const d = document.createElement("div");
    d.className = "reservation-row";
    d.innerHTML = `
      <div>${r.tipo} • ${formatPrice(r.precio)}</div>
      <button class="btn-small btn-edit" data-id="${r.id}">Editar</button>
    `;
    roomsDiv.appendChild(d);
  });

  roomsDiv.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", () =>
      promptEditarPrecio(parseInt(btn.dataset.id))
    );
  });

  const resDiv = document.getElementById("admin-reservations");
  resDiv.innerHTML = "<h3>Reservas</h3>";

  const reservas = load("reservas") || [];
  if (reservas.length === 0) {
    resDiv.innerHTML += "<p>No hay reservas</p>";
  } else {
    reservas.forEach(r => {
      const room = rooms.find(x => x.id === r.roomId);
      const userData = load("users").find(u => u.id === r.userId);

      const row = document.createElement("div");
      row.className = "reservation-row";
      row.innerHTML = `
        <div>
          <strong>${room.tipo}</strong> • ${r.checkIn} → ${r.checkOut} • ${userData.nombre}
        </div>
        <select class="sel-status" data-id="${r.id}">
          <option ${r.estado==="pendiente"?"selected":""}>pendiente</option>
          <option ${r.estado==="confirmada"?"selected":""}>confirmada</option>
          <option ${r.estado==="cancelada"?"selected":""}>cancelada</option>
        </select>
      `;

      resDiv.appendChild(row);
    });

    resDiv.querySelectorAll(".sel-status").forEach(s => {
      s.addEventListener("change", () => {
        const reservas = load("reservas");
        const r = reservas.find(x => x.id === parseInt(s.dataset.id));
        r.estado = s.value;
        save("reservas", reservas);
        drawChart();
      });
    });
  }

  drawChart();
}

// gráfico
function drawChart() {
  const reservas = load("reservas") || [];
  const counts = { pendiente:0, confirmada:0, cancelada:0 };

  reservas.forEach(r => counts[r.estado]++);

  const ctx = document.getElementById("reservas-chart");
  if (!ctx) return;

  if (window._chartInstance) window._chartInstance.destroy();

  window._chartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['pendiente','confirmada','cancelada'],
      datasets:[{ data: [counts.pendiente, counts.confirmada, counts.cancelada] }]
    }
  });
}

// render general
function renderAfterLogin() {
  renderHeader();
  renderRooms();
  renderMisReservas();
  renderAdminPanel();
}

// inicial
function init() {
  activarTabs();
  registrar();
  login();
  renderAfterLogin();

  document.getElementById("btn-search").addEventListener("click", () => {
    const a = document.getElementById("checkin").value;
    const b = document.getElementById("checkout").value;
    if (!a || !b) { mostrarMensaje("Elegí fechas","error"); return; }
    if (b <= a) { mostrarMensaje("Fechas inválidas","error"); return; }
    mostrarMensaje("Fechas listas");
  });
}

init();

