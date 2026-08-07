
import { Card, CardContent } from "@/components/ui/card";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { useRef, useEffect, useState, useCallback } from "react";
import { RenamePoiModal } from "./RenamePoiModal";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { loadMapLayers } from "@/services/map-graph.service";
import Image from "next/image";

// ─── Snap helpers ─────────────────────────────────────────────────────────────

/** Aplica snap angular al punto (rawX, rawY) respecto al nodo de referencia.
 *  - Si snapAngleDeg != null → proyecta sobre ese ángulo fijo.
 *  - Si shiftHeld → redondea al múltiplo de snapStep más cercano.
 *  - Si ninguno → devuelve las coordenadas sin modificar.
 */
function applySnap(
    fromX: number,
    fromY: number,
    rawX: number,
    rawY: number,
    shiftHeld: boolean,
    snapAngleDeg: number | null,
    snapStep: number = 45
): { x: number; y: number; angleDeg: number | null } {
    const dx = rawX - fromX;
    const dy = rawY - fromY;
    const dist = Math.hypot(dx, dy);
    const rawAngleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

    if (snapAngleDeg !== null) {
        // Ángulo fijo desde el input
        const rad = (snapAngleDeg * Math.PI) / 180;
        return {
            x: fromX + Math.cos(rad) * dist,
            y: fromY + Math.sin(rad) * dist,
            angleDeg: snapAngleDeg,
        };
    }

    if (shiftHeld) {
        // Snap al múltiplo más cercano de snapStep
        const snapped = Math.round(rawAngleDeg / snapStep) * snapStep;
        const rad = (snapped * Math.PI) / 180;
        return {
            x: fromX + Math.cos(rad) * dist,
            y: fromY + Math.sin(rad) * dist,
            angleDeg: ((snapped % 360) + 360) % 360,
        };
    }

    return { x: rawX, y: rawY, angleDeg: null };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MapEditor() {
    const { edificio, level } = useEditMapEdificio();
    const setAll = useGrafoMapaStore(state => state.setAll);
    const setNivelActivo = useGrafoMapaStore(state => state.setNivelActivo);
    const nivelActivo = useGrafoMapaStore(state => state.nivelActivo);

    // Obtener el índice del nivel seleccionado
    const getLevelIndex = useCallback(() => {
        if (!edificio?.planos || !level) return null;
        const entries = Object.entries(edificio.planos);
        const found = entries.find(([, url]) => url === level);
        return found ? found[0] : null;
    }, [edificio?.planos, level]);

    const setCapasFromFirestore = useGrafoMapaStore(state => state.setCapasFromFirestore);
    useEffect(() => {
        const nivelId = getLevelIndex();
        if (edificio?.id && nivelId) {
            setNivelActivo(nivelId);
            loadMapLayers({ edificioId: edificio.id, nivel: nivelId }).then(capas => {
                useGrafoMapaStore.getState().setCapasFromFirestore(nivelId, capas);
                useGrafoMapaStore.getState().setCapaActiva("");
                const capaNames = Object.keys(capas);
                if (capaNames.length > 0) {
                    const nuevaCapa = capaNames[0];
                    setTimeout(() => {
                        useGrafoMapaStore.getState().setCapaActiva(nuevaCapa);
                    }, 0);
                }
            });
        } else {
            setNivelActivo("");
            useGrafoMapaStore.getState().setCapasFromFirestore("", {});
            setAll({ nodes: [], connections: [], pois: [] });
            useGrafoMapaStore.getState().setCapaActiva("");
        }
    }, [edificio?.id, level, setAll, setNivelActivo, getLevelIndex]);

    // ── Store selectors ──────────────────────────────────────────────────────
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const nodes = useGrafoMapaStore(state => state.nodes);
    const connections = useGrafoMapaStore(state => state.connections);
    const pois = useGrafoMapaStore(state => state.pois);
    const selectedNode = useGrafoMapaStore(state => state.selectedNode);
    const addNode = useGrafoMapaStore(state => state.addNode);
    const moveNode = useGrafoMapaStore(state => state.moveNode);
    const connectNodes = useGrafoMapaStore(state => state.connectNodes);
    const disconnectNodes = useGrafoMapaStore(state => state.disconnectNodes);
    const renameNode = useGrafoMapaStore(state => state.renameNode);
    const deleteNode = useGrafoMapaStore(state => state.deleteNode);
    const setSelectedNode = useGrafoMapaStore(state => state.setSelectedNode);
    const clearSelection = useGrafoMapaStore(state => state.clearSelection);

    // ── Snap state ───────────────────────────────────────────────────────────
    const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
    const [isShiftHeld, setIsShiftHeld] = useState(false);
    const [snapAngleDeg, setSnapAngleDeg] = useState<number | null>(null);
    const [snapAngleInput, setSnapAngleInput] = useState<string>("");
    const SNAP_STEP = 45;

    // Drag state
    const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
    const isDraggingRef = useRef(false); // ref para evitar closures stale en handlers

    // Listener de Shift
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => { if (e.key === "Shift") setIsShiftHeld(true); };
        const onKeyUp = (e: KeyboardEvent) => { if (e.key === "Shift") setIsShiftHeld(false); };
        window.addEventListener("keydown", onKeyDown);
        window.addEventListener("keyup", onKeyUp);
        return () => {
            window.removeEventListener("keydown", onKeyDown);
            window.removeEventListener("keyup", onKeyUp);
        };
    }, []);

    // ── Canvas coord helper ──────────────────────────────────────────────────
    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } => {
        const canvas = e.currentTarget as HTMLCanvasElement;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
        };
    };

    // Buscar nodo cercano a una posición
    const findNodeAt = (x: number, y: number) => {
        return nodes.find(n => Math.hypot(n.x - x, n.y - y) < 15);
    };

    // ── Snap computation para un punto de destino ────────────────────────────
    const computeSnapped = useCallback(
        (rawX: number, rawY: number): { x: number; y: number; angleDeg: number | null } => {
            if (!selectedNode) return { x: rawX, y: rawY, angleDeg: null };
            const fromNode = nodes.find(n => n.node === selectedNode);
            if (!fromNode) return { x: rawX, y: rawY, angleDeg: null };
            return applySnap(fromNode.x, fromNode.y, rawX, rawY, isShiftHeld, snapAngleDeg, SNAP_STEP);
        },
        [selectedNode, nodes, isShiftHeld, snapAngleDeg]
    );

    // ── Drawing ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Dibujar conexiones locales
        connections.forEach(({ origen, destino, nivel_origen, nivel_destino }) => {
            const nodeA = nodes.find(n => n.node === origen);
            const nodeB = nodes.find(n => n.node === destino);
            if (nodeA && nodeB) {
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                ctx.lineTo(nodeB.x, nodeB.y);
                ctx.strokeStyle = "#888";
                ctx.lineWidth = 2;
                ctx.setLineDash([]);
                ctx.stroke();
            } else if (nodeA && !nodeB) {
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                ctx.lineTo(nodeA.x, 0);
                ctx.strokeStyle = "#f59e42";
                ctx.setLineDash([6, 6]);
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.font = "bold 12px Arial";
                ctx.fillStyle = "#f59e42";
                const destLabel = `→ ${destino}${nivel_destino !== undefined ? ` (Nivel ${nivel_destino})` : ''}`;
                ctx.fillText(destLabel, nodeA.x + 8, 16);
            } else if (!nodeA && nodeB) {
                ctx.beginPath();
                ctx.moveTo(nodeB.x, nodeB.y);
                ctx.lineTo(nodeB.x, 0);
                ctx.strokeStyle = "#f59e42";
                ctx.setLineDash([6, 6]);
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.font = "bold 12px Arial";
                ctx.fillStyle = "#f59e42";
                const destLabel = `→ ${origen}${nivel_origen !== undefined ? ` (Nivel ${nivel_origen})` : ''}`;
                ctx.fillText(destLabel, nodeB.x + 8, 16);
            }
        });

        // ── Preview de conexión ghost ────────────────────────────────────────
        if (selectedNode && mousePos && !draggingNodeId) {
            const fromNode = nodes.find(n => n.node === selectedNode);
            if (fromNode) {
                const { x: snapX, y: snapY, angleDeg } = computeSnapped(mousePos.x, mousePos.y);

                // Línea ghost azul punteada
                ctx.beginPath();
                ctx.moveTo(fromNode.x, fromNode.y);
                ctx.lineTo(snapX, snapY);
                ctx.strokeStyle = "rgba(37,99,235,0.55)";
                ctx.lineWidth = 2;
                ctx.setLineDash([6, 4]);
                ctx.stroke();
                ctx.setLineDash([]);

                // Punto de destino snap
                ctx.beginPath();
                ctx.arc(snapX, snapY, 6, 0, 2 * Math.PI);
                ctx.fillStyle = "rgba(37,99,235,0.35)";
                ctx.strokeStyle = "#2563eb";
                ctx.lineWidth = 1.5;
                ctx.fill();
                ctx.stroke();

                // Etiqueta del ángulo actual
                if (angleDeg !== null || isShiftHeld || snapAngleDeg !== null) {
                    const displayAngle = angleDeg !== null
                        ? angleDeg.toFixed(0)
                        : (Math.atan2(mousePos.y - fromNode.y, mousePos.x - fromNode.x) * 180 / Math.PI).toFixed(1);
                    const label = `${displayAngle}°`;
                    const midX = (fromNode.x + snapX) / 2;
                    const midY = (fromNode.y + snapY) / 2;
                    ctx.font = "bold 11px Arial";
                    const tw = ctx.measureText(label).width;
                    ctx.fillStyle = "rgba(255,255,255,0.85)";
                    ctx.fillRect(midX - tw / 2 - 3, midY - 10, tw + 6, 15);
                    ctx.fillStyle = "#1d4ed8";
                    ctx.fillText(label, midX - tw / 2, midY + 2);
                }
            }
        }

        // Dibujar nodos
        nodes.forEach((node) => {
            const isDragging = draggingNodeId === node.node;
            ctx.beginPath();
            ctx.arc(node.x, node.y, isDragging ? 12 : 10, 0, 2 * Math.PI);
            ctx.fillStyle = selectedNode === node.node ? "#2563eb" : isDragging ? "#93c5fd" : "#fff";
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = isDragging ? 3 : 2;
            ctx.fill();
            ctx.stroke();
        });

        // Dibujar nombres de POIs
        pois.forEach((poi) => {
            ctx.font = "12px Arial";
            ctx.fillStyle = "#111";
            ctx.fillText(poi.name, poi.x + 12, poi.y - 12);
        });
    }, [nodes, connections, pois, selectedNode, mousePos, draggingNodeId, computeSnapped, isShiftHeld, snapAngleDeg]);

    // ── Mouse Move ───────────────────────────────────────────────────────────
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);

        if (draggingNodeId && isDraggingRef.current) {
            moveNode(draggingNodeId, x, y);
            return;
        }

        setMousePos({ x, y });
    };

    // ── Mouse Down (inicia drag si toca un nodo) ─────────────────────────────
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button !== 0) return; // solo click izquierdo
        const { x, y } = getCanvasCoords(e);
        const node = findNodeAt(x, y);
        if (node && !e.ctrlKey) {
            // Iniciar drag solo si no es ctrl+shift (delete)
            setDraggingNodeId(node.node);
            isDraggingRef.current = false; // Se marcará en true al moverse
        }
    };

    // ── Mouse Up (finaliza drag) ─────────────────────────────────────────────
    const handleMouseUp = () => {
        setDraggingNodeId(null);
        // isDraggingRef.current se resetea DESPUÉS del click handler con un pequeño delay
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 10);
    };

    // ── Mouse Leave ──────────────────────────────────────────────────────────
    const handleMouseLeave = () => {
        setMousePos(null);
        setDraggingNodeId(null);
        isDraggingRef.current = false;
    };

    // ── Click: crear nodo o seleccionar/conectar ─────────────────────────────
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        // Si estaba arrastrando, no crear nodo
        if (isDraggingRef.current) return;

        const { x: rawX, y: rawY } = getCanvasCoords(e);
        const node = findNodeAt(rawX, rawY);

        if (e.ctrlKey && e.shiftKey && node) {
            deleteNode(node.node);
            return;
        }

        if (!node) {
            // Aplicar snap si hay nodo seleccionado
            const { x, y } = computeSnapped(rawX, rawY);
            addNode(x, y);
            clearSelection();
        } else {
            if (selectedNode && selectedNode !== node.node) {
                const alreadyConnected = connections.some(
                    v => (v.origen === selectedNode && v.destino === node.node) || (v.origen === node.node && v.destino === selectedNode)
                );
                if (alreadyConnected) {
                    disconnectNodes(selectedNode, node.node);
                } else {
                    connectNodes(selectedNode, node.node);
                }
                clearSelection();
            } else {
                setSelectedNode(node.node);
            }
        }
    };

    // Marcar isDraggingRef en true al mover con botón presionado
    const handleMouseMoveWithDragDetect = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (draggingNodeId && e.buttons === 1) {
            isDraggingRef.current = true;
        }
        handleMouseMove(e);
    };

    // ── Modal de renombrar POI ────────────────────────────────────────────────
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
    const [renameInitial, setRenameInitial] = useState<string>("");

    const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);
        const node = findNodeAt(x, y);
        if (node) {
            setRenameNodeId(node.node);
            const poi = pois.find(p => p.node === node.node);
            setRenameInitial(poi?.name || "");
            setRenameModalOpen(true);
        }
    };

    // ── Input handler de ángulo fijo ─────────────────────────────────────────
    const handleAngleInputChange = (val: string) => {
        setSnapAngleInput(val);
        const num = parseFloat(val);
        if (!isNaN(num)) {
            setSnapAngleDeg(num);
        } else {
            setSnapAngleDeg(null);
        }
    };

    const handleClearAngle = () => {
        setSnapAngleDeg(null);
        setSnapAngleInput("");
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <Card className="py-2">
            <CardContent className="px-2 relative">
                {level !== "" ? (
                    <>
                        <Image
                            src={level}
                            alt="Mapa"
                            className="w-full h-auto object-cover rounded-md"
                            width={800}
                            height={800}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full pointer-events-auto rounded-xl z-20 px-2"
                            width={800}
                            height={800}
                            style={{ cursor: draggingNodeId ? "grabbing" : selectedNode ? "crosshair" : "default" }}
                            onClick={handleCanvasClick}
                            onDoubleClick={handleCanvasDoubleClick}
                            onMouseMove={handleMouseMoveWithDragDetect}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                        />

                        {/* ── Panel de control de snap ── */}
                        <div className="absolute top-3 right-4 z-30 flex items-center gap-2 bg-white/92 backdrop-blur-sm border border-blue-100 rounded-xl px-3 py-2 shadow-md">
                            <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">Ángulo fijo</span>
                            <input
                                id="snap-angle-input"
                                type="number"
                                step="1"
                                min="0"
                                max="360"
                                value={snapAngleInput}
                                onChange={e => handleAngleInputChange(e.target.value)}
                                placeholder="libre"
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <span className="text-xs font-bold text-slate-600">°</span>
                            {snapAngleDeg !== null && (
                                <button
                                    onClick={handleClearAngle}
                                    className="text-slate-400 hover:text-red-400 transition-colors text-sm font-bold leading-none"
                                    title="Limpiar ángulo fijo"
                                >
                                    ✕
                                </button>
                            )}
                            <div className="w-px h-4 bg-slate-200 mx-1" />
                            <div className={`flex items-center gap-1 text-xs font-semibold ${isShiftHeld ? "text-blue-600" : "text-slate-400"}`}>
                                <kbd className="border border-current rounded px-1 py-0.5 text-xs">Shift</kbd>
                                <span>{isShiftHeld ? `snap ${SNAP_STEP}°` : "snap off"}</span>
                            </div>
                        </div>

                        <RenamePoiModal
                            open={renameModalOpen}
                            onOpenChange={setRenameModalOpen}
                            initialName={renameInitial}
                            onConfirm={name => {
                                if (renameNodeId) renameNode(renameNodeId, name);
                                setRenameModalOpen(false);
                            }}
                        />
                    </>
                ) : (
                    <></>
                )}
            </CardContent>
        </Card>
    );
}
