const tablero = document.getElementById("tablero");
const piensosContainer = document.getElementById("piensos-container");
const colocarBtn = document.getElementById("colocarGotin");
const estado = document.getElementById("estadoJuego");

let gotin = null;
let direccionActual = null;
let intervaloFlechas = null;
let movimientoInterval = null;
let posicionGotin = null;
let recolectados = 0;
let flechasActivas = [];

const direcciones = ['left', 'down', 'right', 'down-left', 'down-right'];
const delta = {
    'left': [0, -1],
    'right': [0, 1],
    'down': [1, 0],
    'down-left': [1, -1],
    'down-right': [1, 1]
};

const flechaImagenes = {
    'left': 'assets/flechas/flecha_left.png',
    'right': 'assets/flechas/flecha_right.png',
    'down': 'assets/flechas/flecha_down.png',
    'down-left': 'assets/flechas/flecha_down_left.png',
    'down-right': 'assets/flechas/flecha_down_right.png'
};

// Crear tablero
for (let i = 0; i < 100; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.dataset.index = i;
    cell.addEventListener('dragover', (e) => e.preventDefault());
    cell.addEventListener('drop', onDrop);
    tablero.appendChild(cell);
}

// Generar piensos
document.getElementById("generarPiensos").addEventListener("click", () => {
    piensosContainer.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        const img = document.createElement('img');
        img.src = 'assets/pienso.png';
        img.draggable = true;
        img.className = 'pienso';
        img.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData("text/plain", "pienso");
        });
        piensosContainer.appendChild(img);
    }
    colocarBtn.disabled = false;
});

function onDrop(e) {
    const index = parseInt(this.dataset.index);
    const row = Math.floor(index / 10);
    if (row < 2) return;

    const data = e.dataTransfer.getData("text/plain");
    if (data === "pienso") {
        const img = document.createElement('img');
        img.src = 'assets/pienso.png';
        img.style.width = "40px";
        img.className = "pienso-en-tablero";
        this.appendChild(img);
        guardarEstado();
    }
}

// Colocar a Gotín
colocarBtn.addEventListener("click", () => {
    const celda = prompt("Ingresa el número de celda (20-99) para colocar a Gotín:");
    const index = parseInt(celda);
    if (index < 20 || index > 99) {
        alert("Posición inválida. Debe estar fuera de las 2 primeras filas.");
        return;
    }

    const cell = tablero.children[index];
    gotin = document.createElement('img');
    gotin.src = 'assets/gotin.png';
    gotin.className = 'gotin';
    cell.appendChild(gotin);
    posicionGotin = index;

    iniciarFlechas();
    guardarEstado();

    gotin.addEventListener("click", lanzarGotin);
    colocarBtn.disabled = true;
});

// Flechas mágicas visuales
function iniciarFlechas() {
    intervaloFlechas = setInterval(() => {
        direccionActual = direcciones[Math.floor(Math.random() * direcciones.length)];
        mostrarFlechasGraficas(direccionActual);
    }, 1000);
}

function mostrarFlechasGraficas(dir) {
    limpiarFlechas();
    const [dx, dy] = delta[dir];
    const fila = Math.floor(posicionGotin / 10);
    const col = posicionGotin % 10;
    const f2 = fila + dx;
    const c2 = col + dy;
    if (f2 < 0 || f2 > 9 || c2 < 0 || c2 > 9) return;
    const index = f2 * 10 + c2;
    const celda = tablero.children[index];
    const img = document.createElement('img');
    img.src = flechaImagenes[dir] || flechaImagenes['left'];
    img.className = "flecha-img";
    celda.appendChild(img);
    flechasActivas.push(img);
}

function limpiarFlechas() {
    flechasActivas.forEach(img => img.remove());
    flechasActivas = [];
}

// Lanzar a Gotín
function lanzarGotin() {
    clearInterval(intervaloFlechas);
    limpiarFlechas();
    gotin.removeEventListener("click", lanzarGotin);

    movimientoInterval = setInterval(() => {
        let [dx, dy] = delta[direccionActual];
        let fila = Math.floor(posicionGotin / 10);
        let col = posicionGotin % 10;
        let newFila = fila + dx;
        let newCol = col + dy;

        // Rebote automático
        if (newFila < 0 || newFila > 9) {
            dx *= -1;
            newFila = fila + dx;
        }
        if (newCol < 0 || newCol > 9) {
            dy *= -1;
            newCol = col + dy;
        }

        // Si aún fuera de límites después de rebote → fin
        if (newFila < 0 || newFila > 9 || newCol < 0 || newCol > 9) {
            terminarLanzamiento("¡Gotín salió del río!");
            return;
        }

        direccionActual = Object.entries(delta).find(([, v]) => v[0] === dx && v[1] === dy)[0];

        const nuevaPos = newFila * 10 + newCol;
        const nuevaCelda = tablero.children[nuevaPos];
        tablero.children[posicionGotin].removeChild(gotin);
        nuevaCelda.appendChild(gotin);
        posicionGotin = nuevaPos;

        // Recolectar pienso
        const pienso = nuevaCelda.querySelector(".pienso-en-tablero");
        if (pienso) {
            nuevaCelda.removeChild(pienso);
            recolectados++;
            estado.textContent = `Recolectados: ${recolectados}/5`;
            guardarEstado();
            if (recolectados === 5) {
                terminarLanzamiento("🎉 ¡Ganaste! Gotín recolectó los 5 piensos.");
            }
        }
    }, 500);
}

function terminarLanzamiento(mensaje) {
    clearInterval(movimientoInterval);
    estado.textContent = mensaje;
    localStorage.clear();
}

// Guardar y cargar progreso
function guardarEstado() {
    const piensos = [];
    document.querySelectorAll(".pienso-en-tablero").forEach(p => {
        const index = Array.from(tablero.children).indexOf(p.parentElement);
        piensos.push(index);
    });
    localStorage.setItem("gotin", posicionGotin);
    localStorage.setItem("piensos", JSON.stringify(piensos));
    localStorage.setItem("recolectados", recolectados);
}

function cargarEstado() {
    const pos = localStorage.getItem("gotin");
    const piensos = JSON.parse(localStorage.getItem("piensos") || "[]");
    const rec = parseInt(localStorage.getItem("recolectados") || "0");

    if (pos !== null) {
        const cell = tablero.children[parseInt(pos)];
        gotin = document.createElement('img');
        gotin.src = 'assets/gotin.png';
        gotin.className = 'gotin';
        cell.appendChild(gotin);
        posicionGotin = parseInt(pos);
        gotin.addEventListener("click", lanzarGotin);
    }

    piensos.forEach(index => {
        const celda = tablero.children[index];
        const img = document.createElement('img');
        img.src = 'assets/pienso.png';
        img.className = 'pienso-en-tablero';
        img.style.width = "40px";
        celda.appendChild(img);
    });

    recolectados = rec;
    estado.textContent = `Recolectados: ${recolectados}/5`;
}
window.onload = cargarEstado;
