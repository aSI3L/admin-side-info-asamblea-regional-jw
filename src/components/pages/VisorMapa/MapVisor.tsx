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
  onInstructionsChange?: (instructions: string[]) => void;
  onActiveNivelChange?: (nivel: string) => void;
}

import { Compass, ZoomIn, ZoomOut, Maximize } from "lucide-react";

export function MapVisor({ edificioId, nivel: propsNivel, capa, from, to, onInstructionsChange, onActiveNivelChange }: MapVisorProps) {
  const [allLevels, setAllLevels] = useState<string[]>([]);
  const [levelData, setLevelData] = useState<Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }>>({});
  const [planos, setPlanos] = useState<Record<string, string>>({});
  const [path, setPath] = useState<string[]>([]);
  const [animPos, setAnimPos] = useState(0); // 0 a 1, posición a lo largo del path
  const animRef = useRef<NodeJS.Timeout | null>(null);

  // Estados de navegación táctil (Zoom & Pan)
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseZoom, setBaseZoom] = useState(1); // Zoom inicial calculado para ajustar al contenedor
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calcular el zoom inicial para que el mapa (800x800) quepa en el contenedor
  useEffect(() => {
    const calculateBaseZoom = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        const calculated = Math.min(width, height) / 800;
        setBaseZoom(calculated);
        setZoom(calculated);
      }
    };
    calculateBaseZoom();
    window.addEventListener("resize", calculateBaseZoom);
    return () => window.removeEventListener("resize", calculateBaseZoom);
  }, []);
  const [touchStartDist, setTouchStartDist] = useState<number | null>(null);

  // Nivel activo que se muestra actualmente
  const [activeNivel, setActiveNivel] = useState<string>("");

  // Cargar todos los niveles y sus datos de la capa 1
  useEffect(() => {
    async function fetchAllLevels() {
      const ed = await import("@/services/index.generic.service").then(m => m.edificiosService.getById(edificioId));
      if (!ed) return;
      const niveles = Object.keys(ed.planos || {});
      setAllLevels(niveles);
      if (niveles.length > 0 && !activeNivel) {
        setActiveNivel(niveles[0]);
      }
      setPlanos(ed.planos || {});
      const dataByLevel: Record<string, { nodes: Node[]; connections: Vector[]; pois: PointOfInterest[] }> = {};
      for (const n of niveles) {
        const capasObj = await loadMapLayers({ edificioId, nivel: n });
        const data = capasObj["Capa 1"];
        if (data) {
          dataByLevel[n] = {
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

  // Propagar nivel activo al padre
  useEffect(() => {
    if (activeNivel && onActiveNivelChange) {
      onActiveNivelChange(activeNivel);
    }
  }, [activeNivel, onActiveNivelChange]);

  // Calcular el camino entre from y to usando todos los nodos/conexiones de todos los niveles
  useEffect(() => {
    const allNodes = Object.values(levelData).flatMap(l => l.nodes);
    const allConns = Object.values(levelData).flatMap(l => l.connections);
    if (from && to && allNodes.length && allConns.length) {
      const p = dijkstra(allNodes, allConns, from, to);
      setPath(p);

      // Determinar el nivel de inicio y establecerlo como activo
      let startLvl = activeNivel;
      for (const [nivelK, dataK] of Object.entries(levelData)) {
        if (dataK.nodes.some(n => n.node === p[0])) {
          startLvl = nivelK;
          break;
        }
      }
      if (startLvl) {
        setActiveNivel(startLvl);
      }

      // Resetear zoom/pan al recalcular
      setZoom(baseZoom);
      setPan({ x: 0, y: 0 });

      // Generar instrucciones descriptivas
      if (onInstructionsChange) {
        const steps: string[] = [];
        const poisList = Object.values(levelData).flatMap(l => l.pois);
        const startPoi = poisList.find(poi => poi.node === from);
        const endPoi = poisList.find(poi => poi.node === to);

        steps.push(`Partida desde: ${startPoi?.name || "Punto de inicio"}`);

        // Identificar cambios de nivel en la ruta
        let currentLvl = startLvl;
        p.forEach((nodeId, idx) => {
          if (idx === 0) return;
          // Buscar si hay un cambio de nivel
          let nodeLvl = currentLvl;
          for (const [nivelK, dataK] of Object.entries(levelData)) {
            if (dataK.nodes.some(n => n.node === nodeId)) {
              nodeLvl = nivelK;
              break;
            }
          }
          if (nodeLvl !== currentLvl) {
            steps.push(`Sube/baja al Nivel ${nodeLvl}`);
            currentLvl = nodeLvl;
          }
          // Si pasa por un POI nombrado, mencionarlo
          const intermediatePoi = poisList.find(poi => poi.node === nodeId && poi.node !== from && poi.node !== to);
          if (intermediatePoi) {
            steps.push(`Pasa por: ${intermediatePoi.name}`);
          }
        });

        steps.push(`Llegada a: ${endPoi?.name || "Destino"}`);
        onInstructionsChange(steps);
      }
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
      const segLengths: number[] = [];
      for (let i = 0; i < points.length - 1; i++) {
        const len = Math.hypot(points[i + 1].x - points[i].x, points[i + 1].y - points[i].y);
        segLengths.push(len);
        total += len;
      }
      if (total === 0) return;
      
      // Avance en píxeles
      const elapsed = (ts - start) / 1000;
      const distTotal = elapsed * speed;
      const cycle = Math.floor(distTotal / total);
      if (cycle > lastCycle) {
        start = ts;
        lastCycle = cycle;
        setAnimPos(0);
        requestAnimationFrame(step);
        return;
      }
      const dist = distTotal - (cycle * total);
      const pos = dist / total;
      setAnimPos(pos);

      // --- CAMBIO AUTOMÁTICO DE PISO ---
      // Detectar en qué nivel está el punto actual de la animación
      let curDist = pos * total;
      let segIdx = 0;
      while (segIdx < segLengths.length && curDist > segLengths[segIdx]) {
        curDist -= segLengths[segIdx];
        segIdx++;
      }
      if (segIdx >= segLengths.length) segIdx = segLengths.length - 1;
      const activeNode = points[segIdx];
      if (activeNode) {
        for (const [nivelK, dataK] of Object.entries(levelData)) {
          if (dataK.nodes.some(n => n.node === activeNode.node)) {
            if (nivelK !== activeNivel) {
              setActiveNivel(nivelK);
            }
            break;
          }
        }
      }
      // ---------------------------------

      requestAnimationFrame(step);
    }
    const raf = requestAnimationFrame(step);
    const currentAnimRef = animRef.current; 
    return () => {
      running = false;
      if (currentAnimRef) clearInterval(currentAnimRef);
      cancelAnimationFrame(raf);
    };
  }, [path, levelData, activeNivel]);

  // Controles de zoom manual y restablecer
  const zoomIn = () => setZoom(prev => Math.min(5, prev * 1.25));
  const zoomOut = () => setZoom(prev => Math.max(0.5, prev / 1.25));
  const resetZoom = () => {
    setZoom(baseZoom);
    setPan({ x: 0, y: 0 });
  };

  // Eventos de ratón para arrastre
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Evento de rueda para zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    setZoom(prev => Math.max(0.5, Math.min(5, prev * factor)));
  };

  // Eventos táctiles para arrastre y pellizco en dispositivos móviles
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX - pan.x, y: e.touches[0].clientY - pan.y });
    } else if (e.touches.length === 2) {
      setIsDragging(false);
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      setTouchStartDist(dist);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && isDragging) {
      setPan({
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      });
    } else if (e.touches.length === 2 && touchStartDist !== null) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist;
      setZoom(prev => Math.max(0.5, Math.min(5, prev * factor)));
      setTouchStartDist(dist);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartDist(null);
  };

  // Renderizar plano del nivel activo
  const data = levelData[activeNivel];
  const planoUrl = planos[activeNivel] || null;
  const pathSegments = [] as { from: Node; to: Node }[];
  if (data) {
    for (let i = 0; i < path.length - 1; i++) {
      const n1 = data.nodes.find(n => n.node === path[i]);
      const n2 = data.nodes.find(n => n.node === path[i + 1]);
      if (n1 && n2) pathSegments.push({ from: n1, to: n2 });
    }
  }

  return (
    <div className="relative w-full h-full overflow-hidden bg-zinc-950 flex items-center justify-center select-none touch-none">
      {/* Controles de Zoom Flotantes */}
      <div className="absolute left-4 top-4 flex flex-col gap-2 z-10">
        <button
          onClick={zoomIn}
          className="w-10 h-10 rounded-full bg-zinc-800/80 backdrop-blur-md text-zinc-100 flex items-center justify-center border border-zinc-700 active:scale-95 transition-transform"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={zoomOut}
          className="w-10 h-10 rounded-full bg-zinc-800/80 backdrop-blur-md text-zinc-100 flex items-center justify-center border border-zinc-700 active:scale-95 transition-transform"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          onClick={resetZoom}
          className="w-10 h-10 rounded-full bg-zinc-800/80 backdrop-blur-md text-zinc-100 flex items-center justify-center border border-zinc-700 active:scale-95 transition-transform"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* Selector de Pisos Flotante a la Derecha */}
      <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
        {allLevels.map(lvl => (
          <button
            key={lvl}
            onClick={() => setActiveNivel(lvl)}
            className={`w-12 h-12 rounded-full border shadow-lg font-bold flex items-center justify-center active:scale-95 transition-all ${
              activeNivel === lvl
                ? "bg-blue-600 text-white border-blue-500 scale-105"
                : "bg-zinc-800/90 backdrop-blur-md text-zinc-300 border-zinc-700"
            }`}
          >
            N{lvl}
          </button>
        ))}
      </div>

      {/* Contenedor del Mapa con Zoom y Pan */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing flex items-center justify-center"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUpOrLeave}
        onMouseLeave={handleMouseUpOrLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "center center",
            transition: isDragging ? "none" : "transform 0.15s ease-out",
          }}
          className="w-[800px] h-[800px] shrink-0"
        >
          {data ? (
            <svg
              viewBox="0 0 800 800"
              width="100%"
              height="100%"
              style={{ background: "#18181b", borderRadius: 12, display: "block" }}
            >
              <defs>
                <linearGradient id="gmaps-blue" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#4285F4" />
                  <stop offset="100%" stopColor="#0a58ca" />
                </linearGradient>
                <filter id="gmaps-glow" x="-50%" y="-50%" width="200%" height="200%">
                  <feGaussianBlur stdDeviation="7" result="coloredBlur" />
                  <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <filter id="gmaps-arrow-shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
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
                <image href={planoUrl} x={0} y={0} width={800} height={800} style={{ pointerEvents: "none" }} />
              )}
              {pathSegments.map((seg, idx) => (
                <g key={idx}>
                  <line
                    x1={seg.from.x}
                    y1={seg.from.y}
                    x2={seg.to.x}
                    y2={seg.to.y}
                    stroke="#4285F4"
                    strokeWidth={12}
                    opacity={0.5}
                    filter="url(#gmaps-glow)"
                  />
                  <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y} stroke="url(#gmaps-blue)" strokeWidth={7} />
                  <line x1={seg.from.x} y1={seg.from.y} x2={seg.to.x} y2={seg.to.y} stroke="#fff" strokeWidth={3.5} />
                  <line
                    x1={seg.from.x}
                    y1={seg.from.y}
                    x2={seg.to.x}
                    y2={seg.to.y}
                    stroke="#fff"
                    strokeWidth={2.5}
                    className="gmaps-dash"
                    opacity={0.7}
                  />
                </g>
              ))}
              {/* Flecha animada de la ruta */}
              {(() => {
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
                if (nivelA !== activeNivel || nivelB !== activeNivel) return null;

                let t = segLengths[segIdx] === 0 ? 0 : dist / segLengths[segIdx];
                t = Math.max(0, Math.min(1, t));
                const x = a.x + (b.x - a.x) * t;
                const y = a.y + (b.y - a.y) * t;
                const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;

                return (
                  <g filter="url(#gmaps-arrow-shadow)">
                    <polygon
                      points="0,-18 32,0 0,18"
                      fill="#4285F4"
                      stroke="#fff"
                      strokeWidth={3}
                      opacity={0.98}
                      transform={`translate(${x},${y}) rotate(${angle})`}
                    />
                  </g>
                );
              })()}
            </svg>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              Cargando mapa...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
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
