
import { db } from "@/config/firebase";
import { doc, setDoc, getDoc, collection, getDocs } from "firebase/firestore";
import type { Node, Vector, PointOfInterest } from "@/types/mapas.type";


// Guarda una capa específica como subcolección
export async function saveMapLayer({ edificioId, nivel, capa, nodes, connections, pois }: {
  edificioId: string;
  nivel: string;
  capa: string;
  nodes: Node[];
  connections: Vector[];
  pois: PointOfInterest[];
}) {
  const capaRef = doc(db, "mapas", `${edificioId}_${nivel}`, "capas", capa);
  await setDoc(capaRef, { nodes, connections, pois });
}


// Carga todas las capas de un mapa como un objeto { [nombreCapa]: { nodes, connections, pois } }
export async function loadMapLayers({ edificioId, nivel }: {
  edificioId: string;
  nivel: string;
}) {
  const capasCol = collection(db, "mapas", `${edificioId}_${nivel}`, "capas");
  const snapshot = await getDocs(capasCol);
  const capas: Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }> = {};
  snapshot.forEach(docSnap => {
    capas[docSnap.id] = docSnap.data() as { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] };
  });
  return capas;
}
