// Carga datos de prueba en los emuladores locales de Firebase (Auth + Firestore).
// `npm run emulators` ya importa datos-ejemplo/; este script sirve para empezar desde cero
// (con los emuladores corriendo, ejecutar `npm run seed`).
// Solo apunta a los emuladores: nunca toca un proyecto real.

process.env.FIRESTORE_EMULATOR_HOST ??= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ??= "127.0.0.1:9099";

import { readFileSync, existsSync } from "node:fs";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Credenciales de prueba (solo existen en el emulador local)
export const DEMO_USER = {
  email: "admin@demo.local",
  password: "demo-asamblea-2026",
  displayName: "Admin Demo",
};

const app = initializeApp({ projectId: "demo-asamblea" });
const auth = getAuth(app);
const db = getFirestore(app);

const EDIFICIO_ID = "edificio-demo";

// ---------- Grafo de navegación ----------
const nivel0 = {
  nodes: [
    { node: "n0_entrada", x: 400, y: 700 },
    { node: "n0_a", x: 400, y: 560 },
    { node: "n0_b", x: 200, y: 560 },
    { node: "n0_banos", x: 200, y: 440 },
    { node: "n0_informes", x: 400, y: 440 },
    { node: "n0_c", x: 650, y: 560 },
    { node: "n0_escalera", x: 650, y: 200 },
  ],
  connections: [
    ["n0_entrada", "n0_a"],
    ["n0_a", "n0_b"],
    ["n0_b", "n0_banos"],
    ["n0_a", "n0_informes"],
    ["n0_a", "n0_c"],
    ["n0_c", "n0_escalera"],
    // Conexión entre pisos (como la crea "Conectar escaleras" en el editor)
    ["n0_escalera", "n1_escalera"],
  ],
  pois: {
    n0_entrada: "Entrada Principal",
    n0_banos: "Baños",
    n0_informes: "Mesa de Informes",
    n0_escalera: "Escalera",
  },
};

const nivel1 = {
  nodes: [
    { node: "n1_escalera", x: 650, y: 200 },
    { node: "n1_d", x: 650, y: 300 },
    { node: "n1_e", x: 500, y: 300 },
    { node: "n1_auditorio", x: 400, y: 300 },
    { node: "n1_f", x: 500, y: 580 },
    { node: "n1_cafeteria", x: 400, y: 580 },
    { node: "n1_g", x: 680, y: 580 },
    { node: "n1_auxilios", x: 680, y: 660 },
  ],
  connections: [
    ["n1_escalera", "n1_d"],
    ["n1_d", "n1_e"],
    ["n1_e", "n1_auditorio"],
    ["n1_e", "n1_f"],
    ["n1_f", "n1_cafeteria"],
    ["n1_f", "n1_g"],
    ["n1_g", "n1_auxilios"],
  ],
  pois: {
    n1_escalera: "Escalera",
    n1_auditorio: "Auditorio",
    n1_cafeteria: "Cafetería",
    n1_auxilios: "Primeros Auxilios",
  },
};

const ICONO_POR_NODO = {
  n0_entrada: "acceso",
  n0_banos: "sanitarios",
  n0_informes: "informacion",
  n0_escalera: "escaleras",
  n1_escalera: "escaleras",
  n1_auditorio: "plataforma",
  n1_cafeteria: "bebederos",
  n1_auxilios: "primeros-auxilios",
};

function toLayer(nivel, numero) {
  return {
    nodes: nivel.nodes,
    // Igual que el editor: largo real del tramo, o costo fijo si cambia de nivel
    connections: nivel.connections.map(([origen, destino]) => {
      const a = nivel.nodes.find((n) => n.node === origen);
      const b = nivel.nodes.find((n) => n.node === destino);
      const distancia = a && b ? Math.max(1, Math.round(Math.hypot(a.x - b.x, a.y - b.y))) : 60;
      return { origen, destino, distancia };
    }),
    pois: Object.entries(nivel.pois).map(([nodeId, name]) => {
      const n = nivel.nodes.find((x) => x.node === nodeId);
      return { ...n, name, nivel: numero, icon: ICONO_POR_NODO[nodeId] };
    }),
  };
}

async function seedUser() {
  try {
    const existing = await auth.getUserByEmail(DEMO_USER.email);
    await auth.updateUser(existing.uid, { password: DEMO_USER.password });
  } catch {
    await auth.createUser({ ...DEMO_USER, emailVerified: true });
  }
  await db.collection("usuarios-autorizados").doc("admin-demo").set({
    email: DEMO_USER.email,
    displayName: DEMO_USER.displayName,
    photoURL: "",
    provider: "email",
  });
}

async function seedData() {
  await db.collection("edificios").doc(EDIFICIO_ID).set({
    nombre: "Salón de Asambleas (Demo)",
    planos: {
      0: "/demo/plano-nivel-0.svg",
      1: "/demo/plano-nivel-1.svg",
    },
  });

  for (const [numero, nivel] of [[0, nivel0], [1, nivel1]]) {
    const ref = db.collection("mapas").doc(`${EDIFICIO_ID}_${numero}`);
    await ref.set({ capaActiva: "Capa 1" });
    await ref.collection("capas").doc("Capa 1").set(toLayer(nivel, numero));
  }

  await db.collection("info-principal").doc("info-demo").set({
    mainTitle: "Asamblea Regional 2026 (Demo)",
    year: 2026,
    color: { primary: "#1e3a8a", secondary: "#f59e0b", accent: "#10b981" },
    buildingId: EDIFICIO_ID,
    imageUrl: "/placeholder.svg",
  });

  const categorias = [
    ["Acomodadores", "Ubicación de asientos y ayuda a los asistentes."],
    ["Primeros Auxilios", "Atención médica básica durante el programa."],
    ["Cafetería", "Horarios y ubicación del servicio de comidas."],
  ];
  for (const [i, [name, description]] of categorias.entries()) {
    await db.collection("categorias").doc(`categoria-${i + 1}`).set({ name, description, imageUrl: "/placeholder.svg" });
  }
}

// Misma lógica que src/lib/croquis.ts (cuadrarSvg): centra el SVG en un lienzo cuadrado
function cuadrarSvg(svg) {
  const limpio = svg.replace(/<\?xml[^>]*\?>/, "").trim();
  const raiz = limpio.match(/<svg\b[^>]*>/i);
  const attr = (n) => raiz[0].match(new RegExp(`\\s${n}\\s*=\\s*"([^"]*)"`, "i"))?.[1];
  const [, , w, h] = attr("viewBox").split(/[\s,]+/).map(Number);
  const lado = Math.max(w, h);
  const raizNueva = raiz[0]
    .replace(/\s(width|height|x|y)\s*=\s*"[^"]*"/gi, "")
    .replace(/>$/, ` x="${(lado - w) / 2}" y="${(lado - h) / 2}" width="${w}" height="${h}">`);
  const out = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" width="${lado}" height="${lado}"><rect width="${lado}" height="${lado}" fill="#fff"/>${limpio.replace(raiz[0], raizNueva)}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(out).toString("base64")}`;
}

// Edificio con los croquis de assets/croquis, sin puntos cargados.
// Si ya existe (p. ej. importado desde datos-ejemplo/), no se toca para no borrar lo dibujado.
async function seedEdificioCroquis() {
  const archivos = [0, 1, 2].map((n) => new URL(`../assets/croquis/croquis_nivel_${n}.svg`, import.meta.url));
  if (!archivos.every((f) => existsSync(f))) return;
  const id = "edificio-croquis";
  if ((await db.collection("edificios").doc(id).get()).exists) return;
  const planos = Object.fromEntries(archivos.map((f, n) => [n, cuadrarSvg(readFileSync(f, "utf8"))]));
  await db.collection("edificios").doc(id).set({
    nombre: "Estadio (croquis nuevos)",
    planos,
    iconos: [
      "acceso", "informacion", "primeros-auxilios", "sanitarios", "sanitarios-varones", "sanitarios-mujeres",
      "lactancia", "acomodadores", "guardarropas", "accesibilidad", "limpieza", "servicio-voluntario",
      "plataforma", "bebederos", "escaleras", "ascensor",
    ],
  });
  for (const nivel of Object.keys(planos)) {
    const ref = db.collection("mapas").doc(`${id}_${nivel}`);
    await ref.set({ capaActiva: "Capa 1" });
    await ref.collection("capas").doc("Capa 1").set({ nodes: [], connections: [], pois: [] });
  }
}

await seedUser();
await seedData();
await seedEdificioCroquis();
console.log(`Datos de prueba cargados. Usuario: ${DEMO_USER.email} (contraseña en scripts/seed-emulators.mjs)`);
process.exit(0);
