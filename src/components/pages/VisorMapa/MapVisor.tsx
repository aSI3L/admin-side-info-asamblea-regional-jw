"use client"
import { useEffect, useRef, useState } from "react";
import { loadMapLayers } from "@/services/map-graph.service";
import { Button } from "@/components/ui/button";
import type { Node, Vector, PointOfInterest } from "@/types/mapas.type";

// Dijkstra implementation
function dijkstra(
  nodes: Node[],
  connections: Vector[],
  start: string,
  end: string
): string[] {
  const distances: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const queue = new Set<string>();
  nodes.forEach((n) => {
    distances[n.node] = Infinity;
    prev[n.node] = null;
    queue.add(n.node);
  });
  distances[start] = 0;
  while (queue.size > 0) {
    const u = Array.from(queue).reduce((min, n) =>
      distances[n] < distances[min] ? n : min, Array.from(queue)[0]);
    queue.delete(u);
    if (u === end) break;
    connections.filter((c) => c.origen === u || c.destino === u).forEach((c) => {
      const v = c.origen === u ? c.destino : c.origen;
      if (!queue.has(v)) return;
      const alt = distances[u] + (c.distancia || 1);
      if (alt < distances[v]) {
        distances[v] = alt;
        prev[v] = u;
      }
    });
  }
  // Build path
  const path: string[] = [];
  let u: string | null = end;
  while (u && prev[u]) {
    path.unshift(u);
    u = prev[u];
  }
  if (u === start) path.unshift(start);
  return path;
}



interface MapVisorProps {
  edificioId: string;
  nivel: string;
  capa: string;
  from: string;
  to: string;
}


export function MapVisor({ edificioId, nivel, capa, from, to }: MapVisorProps) {
  const [allLevels, setAllLevels] = useState<string[]>([]);
  const [levelData, setLevelData] = useState<Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }>>({});
  const [planos, setPlanos] = useState<Record<string, string>>({});
  const [path, setPath] = useState<string[]>([]);
  const [animPos, setAnimPos] = useState(0); // 0 a 1, posición a lo largo del path
  const animRef = useRef<NodeJS.Timeout | null>(null);

  // Cargar todos los niveles y sus datos de la capa 1
  useEffect(() => {
    async function fetchAllLevels() {
      const ed = await import("@/services/index.generic.service").then(m => m.edificiosService.getById(edificioId));
  if (!ed) return;
  const niveles = Object.keys(ed.planos || {});
      setAllLevels(niveles);
      setPlanos(ed.planos || {});
      const dataByLevel: Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }> = {};
      for (const nivel of niveles) {
        const capasObj = await loadMapLayers({ edificioId, nivel });
        const data = capasObj["Capa 1"];
        if (data) {
          dataByLevel[nivel] = {
            nodes: data.nodes || [],
            connections: data.connections || [],
            pois: data.pois || [],
          };
        }
      }
      setLevelData(dataByLevel);
    }
    fetchAllLevels();
    const currentAnimRef = animRef.current;

    return () => {
      if (currentAnimRef) clearInterval(currentAnimRef);
    };
  }, [edificioId, capa]);

  // Calcular el camino entre from y to usando todos los nodos/conexiones de todos los niveles
  useEffect(() => {
    // Unir todos los nodos y conexiones
    const allNodes = Object.values(levelData).flatMap(l => l.nodes);
    const allConns = Object.values(levelData).flatMap(l => l.connections);
    if (from && to && allNodes.length && allConns.length) {
      setPath(dijkstra(allNodes, allConns, from, to));
    } else {
      setPath([]);
    }
  }, [from, to, levelData]);

  // Animación de la flecha: recorre toda la ruta suavemente
  useEffect(() => {
    if (!path.length) return;
    setAnimPos(0);
    let start: number | null = null;
    let running = true;
    const speed = 180; // px por segundo
    let lastCycle = 0;
    function step(ts: number) {
      if (!running) return;
      if (start === null) start = ts;
      // Calcular longitud total de la ruta
      const allNodes = Object.values(levelData).flatMap(l => l.nodes);
      const points = path.map(id => allNodes.find(n => n.node === id)).filter(Boolean) as Node[];
      let total = 0;
      for (let i = 0; i < points.length - 1; i++) {
        total += Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
      }
      if (total === 0) return;
      // Avance en píxeles
      const elapsed = (ts - start) / 1000;
      const distTotal = elapsed * speed;
      const cycle = Math.floor(distTotal / total);
      if (cycle > lastCycle) {
        // Reiniciar el tiempo base para evitar acumulación de error
        start = ts;
        lastCycle = cycle;
        setAnimPos(0);
        requestAnimationFrame(step);
        return;
      }
      const dist = distTotal - (cycle * total);
      const pos = dist / total;
      setAnimPos(pos);
      requestAnimationFrame(step);
    }
    const raf = requestAnimationFrame(step);
    const currentAnimRef = animRef.current; 
    return () => {
      running = false;
      if (currentAnimRef) clearInterval(currentAnimRef);
      cancelAnimationFrame(raf);
    };
  }, [path, levelData]);

  // Renderizar todos los planos (niveles) y dibujar solo el camino
  // Calcular los niveles que forman parte de la ruta
  const nivelesEnRuta = new Set<string>();
  for (let i = 0; i < path.length; i++) {
    for (const [nivelK, dataK] of Object.entries(levelData)) {
      if (dataK.nodes.some(n => n.node === path[i])) {
        nivelesEnRuta.add(nivelK);
      }
    }
  }
  // Determinar el nivel del punto de partida (primer nodo de la ruta)
  let nivelInicio: string | null = null;
  if (path.length > 0) {
    for (const [nivelK, dataK] of Object.entries(levelData)) {
      if (dataK.nodes.some(n => n.node === path[0])) {
        nivelInicio = nivelK;
        break;
      }
    }
  }
  // Ordenar: primero el nivel de inicio, luego los demás en el orden original
  const nivelesRutaOrdenados = Array.from(nivelesEnRuta);
  if (nivelInicio) {
    nivelesRutaOrdenados.sort((a, b) => (a === nivelInicio ? -1 : b === nivelInicio ? 1 : 0));
  }
  return (
    <div className="flex flex-col gap-8">
      {nivelesRutaOrdenados.map(nivel => {
        const data = levelData[nivel];
        if (!data) return null;
        // ...existing code...
        const planoUrl = planos[nivel] || null;
        const pathSegments = [] as { from: Node; to: Node }[];
        for (let i = 0; i < path.length - 1; i++) {
          const n1 = data.nodes.find(n => n.node === path[i]);
          const n2 = data.nodes.find(n => n.node === path[i + 1]);
          if (n1 && n2) pathSegments.push({ from: n1, to: n2 });
        }
        // ...existing code (SVG, flecha, etc)...
        return (
          <div key={nivel} className="mb-6">
            <h3 className="font-bold mb-2 text-zinc-200">Plano nivel {nivel}</h3>
            <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-2 w-full max-w-2xl mx-auto">
              {/* SVG responsivo con viewBox y preserveAspectRatio */}
              <div style={{ width: '100%', aspectRatio: '1 / 1' }}>
                <svg viewBox="0 0 800 800" width="100%" height="100%" style={{ background: '#18181b', borderRadius: 8, display: 'block', width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
                <defs>
                  <linearGradient id="gmaps-blue" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#4285F4" />
                    <stop offset="100%" stopColor="#0a58ca" />
                  </linearGradient>
                  <filter id="gmaps-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="7" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                  <filter id="gmaps-arrow-shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4"/>
                  </filter>
                  <style>{`
                    .gmaps-dash {
                      stroke-dasharray: 16 12;
                      stroke-dashoffset: 0;
                      animation: dashmove 1.2s linear infinite;
                    }
                    @keyframes dashmove {
                      to { stroke-dashoffset: -28; }
                    }
                  `}</style>
                </defs>
                {planoUrl && (
                  <image href={planoUrl} x={0} y={0} width={800} height={800} style={{ pointerEvents: 'none' }} />
                )}
                {pathSegments.map((seg, idx) => (
                  <g key={idx}>
                    <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y} stroke="#4285F4" strokeWidth={12} opacity={0.5} filter="url(#gmaps-glow)" />
                    <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y} stroke="url(#gmaps-blue)" strokeWidth={7} />
                    <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y} stroke="#fff" strokeWidth={3.5} />
                    <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y} stroke="#fff" strokeWidth={2.5} className="gmaps-dash" opacity={0.7} />
                  </g>
                ))}
                {/* Flecha animada: recorre toda la ruta suavemente */}
                {(() => {
                  // ...existing code de la flecha animada...
                  const allNodes = Object.values(levelData).flatMap(l => l.nodes);
                  const points = path.map(id => allNodes.find(n => n.node === id)).filter(Boolean) as Node[];
                  if (points.length < 2) return null;
                  let total = 0;
                  const segLengths: number[] = [];
                  for (let i = 0; i < points.length - 1; i++) {
                    const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
                    segLengths.push(len);
                    total += len;
                  }
                  if (animPos <= 0 || animPos >= 1) return null;
                  let dist = animPos * total;
                  let segIdx = 0;
                  if (dist < 0) dist = 0;
                  if (dist > total) dist = total;
                  while (segIdx < segLengths.length && dist > segLengths[segIdx]) {
                    dist -= segLengths[segIdx];
                    segIdx++;
                  }
                  if (segIdx >= segLengths.length) segIdx = segLengths.length - 1;
                  const a = points[segIdx];
                  const b = points[segIdx + 1];
                  if (!a || !b) return null;
                  let nivelA = null, nivelB = null;
                  for (const [nivelK, dataK] of Object.entries(levelData)) {
                    if (dataK.nodes.some(n => n.node === a.node)) nivelA = nivelK;
                    if (dataK.nodes.some(n => n.node === b.node)) nivelB = nivelK;
                  }
                  if (nivelA !== nivel || nivelB !== nivel) return null;
                  let t = segLengths[segIdx] === 0 ? 0 : dist / segLengths[segIdx];
                  t = Math.max(0, Math.min(1, t));
                  const x = a.x + (b.x - a.x) * t;
                  const y = a.y + (b.y - a.y) * t;
                  const angle = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
                  return (
                    <g filter="url(#gmaps-arrow-shadow)">
                      <polygon
                        points="0,-18 32,0 0,18"
                        fill="#4285F4"
                        stroke="#fff"
                        strokeWidth={3}
                        opacity={0.98}
                        transform={`translate(${x},${y}) rotate(${angle})`}
                        style={{ transition: 'all 0.2s' }}
                      />
                    </g>
                  );
                })()}
                </svg>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
// fin MapVisor


// Utilidad para dibujar la flecha sin transformación
function getArrowPoints(from: Node, to: Node, length: number, width: number) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = Math.atan2(dy, dx);
  const tipX = to.x;
  const tipY = to.y;
  const baseX = tipX - length * Math.cos(angle);
  const baseY = tipY - length * Math.sin(angle);
  const leftX = baseX + (width / 2) * Math.sin(angle);
  const leftY = baseY - (width / 2) * Math.cos(angle);
  const rightX = baseX - (width / 2) * Math.sin(angle);
  const rightY = baseY + (width / 2) * Math.cos(angle);
  return `${tipX},${tipY} ${leftX},${leftY} ${rightX},${rightY}`;
}
}
