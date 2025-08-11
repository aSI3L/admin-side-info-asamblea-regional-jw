import { db } from "@/config/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import type { Node, Vector, PointOfInterest } from "@/types/mapas.type";

export async function saveMapGraph({ edificioId, nivel, nodes, connections, pois }: {
  edificioId: string;
  nivel: string;
  nodes: Node[];
  connections: Vector[];
  pois: PointOfInterest[];
}) {
  const ref = doc(db, "mapas", `${edificioId}_${nivel}`);
  await setDoc(ref, { nodes, connections, pois });
}

export async function loadMapGraph({ edificioId, nivel }: {
  edificioId: string;
  nivel: string;
}) {
  const ref = doc(db, "mapas", `${edificioId}_${nivel}`);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data() as { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] };
  }
  return { nodes: [], connections: [], pois: [] };
}
