
import { Card, CardContent } from "@/components/ui/card";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { useRef, useEffect, useState, useCallback } from "react";
import { RenamePoiModal } from "./RenamePoiModal";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { loadMapLayers } from "@/services/map-graph.service";
import Image from "next/image";
import { ESCALA_ICONOS, ICONOS, getIcono, iconoUrl, tamanoIconoPunto } from "@/consts/iconos.consts";
import { useEditarMapaStore } from "@/zustand/editar-mapa.store";
import { Pencil, Route, Trash2 } from "lucide-react";
import { INTERLINEADO, canvasAlign, desfaseLineas, etiquetaDe, layoutEtiqueta, lineasNombre, tamanoEtiqueta } from "@/lib/etiquetas";
import type { Etiqueta } from "@/types/mapas.type";

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

    // `level` es la clave del nivel en edificio.planos ("0", "1", ...)
    const getLevelIndex = useCallback(() => {
        if (!edificio?.planos || !level || !(level in edificio.planos)) return null;
        return level;
    }, [edificio?.planos, level]);
    const planoUrl = edificio?.planos && level ? edificio.planos[level] : undefined;

    // Iconos habilitados para el edificio (los edificios anteriores a la biblioteca usan todos)
    const iconosEdificio = edificio?.iconos?.length ? ICONOS.filter(i => edificio.iconos?.includes(i.id)) : ICONOS;

    // Escala de los iconos del edificio: se ve al instante y se guarda sola al soltar el control
    const escalaIconos = edificio?.escalaIconos ?? ESCALA_ICONOS.defecto;
    // Tamaño de cada icono: escala general del edificio × su escala propia
    const tamanoDe = useCallback((poi?: { escala?: number }) => tamanoIconoPunto(escalaIconos, poi?.escala), [escalaIconos]);
    const setEscalaIconos = useEditarMapaStore(state => state.setEscalaIconos);
    const guardarEscalaIconos = useEditarMapaStore(state => state.guardarEscalaIconos);
    const [estadoEscala, setEstadoEscala] = useState<"" | "guardando" | "guardado" | "error">("");
    const escalaTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const handleEscalaChange = (valor: number) => {
        setEscalaIconos(valor);
        setEstadoEscala("guardando");
        if (escalaTimer.current) clearTimeout(escalaTimer.current);
        escalaTimer.current = setTimeout(async () => {
            setEstadoEscala(await guardarEscalaIconos() ? "guardado" : "error");
        }, 600);
    };

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
    const addPoi = useGrafoMapaStore(state => state.addPoi);
    const updatePoi = useGrafoMapaStore(state => state.updatePoi);
    const updateEtiqueta = useGrafoMapaStore(state => state.updateEtiqueta);
    const poiEnEdicion = useGrafoMapaStore(state => state.poiEnEdicion);
    const setPoiEnEdicion = useGrafoMapaStore(state => state.setPoiEnEdicion);
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

    // Arrastre del nombre de un punto: guarda dónde se lo agarró respecto de su centro
    const [draggingLabel, setDraggingLabel] = useState<{ id: string; grabDx: number; grabDy: number } | null>(null);
    // Rectángulo de cada nombre dibujado (unidades del lienzo), para detectar clics y arrastres
    const labelBoxes = useRef<Record<string, { x: number; y: number; w: number; h: number }>>({});

    // Icono a colocar con el próximo clic en el plano (null = modo caminos)
    const [iconoAColocar, setIconoAColocar] = useState<string | null>(null);

    // Imágenes de los iconos para dibujar en el canvas
    const iconImages = useRef<Record<string, HTMLImageElement>>({});
    const [iconsVersion, setIconsVersion] = useState(0);
    useEffect(() => {
        ICONOS.forEach(({ id }) => {
            if (iconImages.current[id]) return;
            const img = new window.Image();
            img.onload = () => setIconsVersion(v => v + 1);
            img.src = iconoUrl(id);
            iconImages.current[id] = img;
        });
    }, []);

    // Listener de Shift
    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Shift") setIsShiftHeld(true);
            // Atajos del plano: no aplican mientras se escribe ni con un diálogo abierto
            const escribiendo = e.target instanceof HTMLElement && e.target.closest("input, textarea, select, [contenteditable=true], [role=dialog]");
            if (escribiendo) return;
            if (e.key === "Escape") {
                setIconoAColocar(null);
                useGrafoMapaStore.getState().clearSelection();
            }
            if (e.key === "Delete") {
                const { selectedNode: seleccionado, deleteNode: borrar } = useGrafoMapaStore.getState();
                if (seleccionado) borrar(seleccionado);
            }
        };
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
        // Los iconos se pueden tomar desde cualquier parte de su superficie
        return nodes.find(n => {
            const poi = pois.find(p => p.node === n.node && p.icon);
            const radio = poi ? Math.max(15, tamanoDe(poi) / 2) : 15;
            return Math.hypot(n.x - x, n.y - y) < radio;
        });
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

        // Dibujar iconos y nombres de POIs
        pois.forEach((poi) => {
            const node = nodes.find(n => n.node === poi.node) ?? poi;
            const img = poi.icon ? iconImages.current[poi.icon] : undefined;
            const iconSize = tamanoDe(poi);
            const half = iconSize / 2;
            if (img?.complete && img.naturalWidth) {
                if (selectedNode === poi.node || draggingNodeId === poi.node) {
                    ctx.beginPath();
                    ctx.roundRect(node.x - half - 4, node.y - half - 4, iconSize + 8, iconSize + 8, 9);
                    ctx.strokeStyle = "#2563eb";
                    ctx.lineWidth = 3;
                    ctx.stroke();
                }
                ctx.drawImage(img, node.x - half, node.y - half, iconSize, iconSize);
            }
            // Nombre: posición configurable (o arrastrado libremente); oculto, solo se insinúa al seleccionarlo
            const etiqueta = etiquetaDe(poi);
            delete labelBoxes.current[poi.node];
            const seleccionado = selectedNode === poi.node || draggingLabel?.id === poi.node;
            if (!etiqueta.visible && !seleccionado) return;
            const fontSize = tamanoEtiqueta(escalaIconos);
            const layout = layoutEtiqueta(node.x, node.y, etiqueta, img ? half : 10);
            ctx.font = `bold ${fontSize}px Arial`;
            ctx.textAlign = canvasAlign[layout.align];
            ctx.textBaseline = layout.baseline;
            // El nombre puede tener varias líneas: el bloque se alinea como una sola etiqueta
            const lineas = lineasNombre(poi.name);
            const alturaLinea = fontSize * INTERLINEADO;
            const desfase = desfaseLineas(layout.baseline, lineas.length);
            const alto = (lineas.length - 1) * alturaLinea + fontSize;
            const ancho = Math.max(...lineas.map(l => ctx.measureText(l).width));
            const izquierda = layout.align === "start" ? layout.x : layout.align === "end" ? layout.x - ancho : layout.x - ancho / 2;
            const arriba = layout.baseline === "top" ? layout.y : layout.baseline === "bottom" ? layout.y - alto : layout.y - alto / 2;
            labelBoxes.current[poi.node] = { x: izquierda, y: arriba, w: ancho, h: alto };
            ctx.globalAlpha = etiqueta.visible ? 1 : 0.35;
            if (draggingLabel?.id === poi.node) {
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = "#2563eb";
                ctx.lineWidth = 1;
                ctx.strokeRect(izquierda - 3, arriba - 2, ancho + 6, alto + 4);
                ctx.setLineDash([]);
            }
            ctx.lineWidth = 3;
            ctx.strokeStyle = "rgba(255,255,255,0.9)";
            ctx.fillStyle = "#111";
            lineas.forEach((linea, i) => {
                const y = layout.y + (desfase + i) * alturaLinea;
                ctx.strokeText(linea, layout.x, y);
                ctx.fillText(linea, layout.x, y);
            });
            ctx.globalAlpha = 1;
            ctx.textAlign = "left";
            ctx.textBaseline = "alphabetic";
        });
    }, [nodes, connections, pois, selectedNode, mousePos, draggingNodeId, draggingLabel, computeSnapped, isShiftHeld, snapAngleDeg, iconsVersion, tamanoDe, escalaIconos]);

    // Nombre de punto bajo el cursor (para arrastrarlo)
    const findLabelAt = (x: number, y: number) => {
        const margen = 3;
        return Object.entries(labelBoxes.current).find(([, b]) =>
            x >= b.x - margen && x <= b.x + b.w + margen && y >= b.y - margen && y <= b.y + b.h + margen
        )?.[0];
    };

    // ── Mouse Move ───────────────────────────────────────────────────────────
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);

        if (draggingNodeId && isDraggingRef.current) {
            moveNode(draggingNodeId, x, y);
            return;
        }

        if (draggingLabel && isDraggingRef.current) {
            // Arrastrar el nombre lo deja en posición libre, relativa al punto
            const poi = pois.find(p => p.node === draggingLabel.id);
            const node = nodes.find(n => n.node === draggingLabel.id);
            if (poi && node) {
                updateEtiqueta(poi.node, {
                    ...etiquetaDe(poi),
                    visible: true,
                    posicion: "libre",
                    dx: Math.round(x - draggingLabel.grabDx - node.x),
                    dy: Math.round(y - draggingLabel.grabDy - node.y),
                });
            }
            return;
        }

        setMousePos({ x, y });
    };

    // ── Mouse Down (inicia drag si toca un nodo o un nombre) ─────────────────
    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.button !== 0) return; // solo click izquierdo
        const { x, y } = getCanvasCoords(e);
        const node = findNodeAt(x, y);
        if (node && !e.ctrlKey) {
            // Iniciar drag solo si no es ctrl+shift (delete)
            setDraggingNodeId(node.node);
            isDraggingRef.current = false; // Se marcará en true al moverse
            return;
        }
        const labelId = !node ? findLabelAt(x, y) : undefined;
        const box = labelId ? labelBoxes.current[labelId] : undefined;
        if (labelId && box) {
            // Se agarra el nombre por su centro, conservando dónde se tomó
            setDraggingLabel({ id: labelId, grabDx: x - (box.x + box.w / 2), grabDy: y - (box.y + box.h / 2) });
            isDraggingRef.current = false;
        }
    };

    // ── Mouse Up (finaliza drag) ─────────────────────────────────────────────
    const handleMouseUp = () => {
        setDraggingNodeId(null);
        setDraggingLabel(null);
        // isDraggingRef.current se resetea DESPUÉS del click handler con un pequeño delay
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 10);
    };

    // ── Mouse Leave ──────────────────────────────────────────────────────────
    const handleMouseLeave = () => {
        setMousePos(null);
        setDraggingNodeId(null);
        setDraggingLabel(null);
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

        if (!node && iconoAColocar) {
            // Colocar el icono y pedir el nombre del área
            const nombre = getIcono(iconoAColocar)?.nombre ?? "";
            const nodeId = addPoi(rawX, rawY, iconoAColocar, nombre);
            clearSelection();
            abrirEdicion(nodeId);
        } else if (!node && findLabelAt(rawX, rawY)) {
            // Clic sobre un nombre: selecciona su punto en vez de crear un nodo
            setSelectedNode(findLabelAt(rawX, rawY) as string);
        } else if (!node) {
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
        if ((draggingNodeId || draggingLabel) && e.buttons === 1) {
            isDraggingRef.current = true;
        }
        handleMouseMove(e);
    };

    // ── Modal de renombrar POI ────────────────────────────────────────────────
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
    const [renameInitial, setRenameInitial] = useState<string>("");
    const [renameInitialIcon, setRenameInitialIcon] = useState<string | undefined>(undefined);
    const [renameInitialEtiqueta, setRenameInitialEtiqueta] = useState<Etiqueta | undefined>(undefined);
    const [renameInitialEscala, setRenameInitialEscala] = useState<number | undefined>(undefined);

    // Abre el diálogo de un punto (lee el store directamente: puede llamarse justo después de crearlo)
    const abrirEdicion = useCallback((nodeId: string) => {
        const poi = useGrafoMapaStore.getState().pois.find(p => p.node === nodeId);
        setRenameNodeId(nodeId);
        setRenameInitial(poi?.name || "");
        setRenameInitialIcon(poi?.icon);
        setRenameInitialEtiqueta(poi?.etiqueta);
        setRenameInitialEscala(poi?.escala);
        setRenameModalOpen(true);
    }, []);

    // La lista de puntos pide abrir el diálogo a través del store
    useEffect(() => {
        if (!poiEnEdicion) return;
        abrirEdicion(poiEnEdicion);
        setPoiEnEdicion(null);
    }, [poiEnEdicion, abrirEdicion, setPoiEnEdicion]);

    const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { x, y } = getCanvasCoords(e);
        const nodeId = findNodeAt(x, y)?.node ?? findLabelAt(x, y);
        if (nodeId) abrirEdicion(nodeId);
    };

    // Barra de acciones del punto seleccionado, ubicada sobre el plano en % (sigue al plano al cambiar de tamaño)
    const nodoSeleccionado = selectedNode && !draggingNodeId && !draggingLabel ? nodes.find(n => n.node === selectedNode) : undefined;
    const poiSeleccionado = nodoSeleccionado ? pois.find(p => p.node === nodoSeleccionado.node) : undefined;

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
                {planoUrl ? (
                    <>
                        {/* ── Barra de iconos: elegir uno y hacer clic en el plano para colocarlo ── */}
                        <div className="flex flex-wrap items-center gap-1 pb-2">
                            <button
                                type="button"
                                onClick={() => setIconoAColocar(null)}
                                className={`flex h-10 items-center gap-1 rounded-lg border px-2 text-xs font-semibold cursor-pointer ${iconoAColocar === null ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 hover:bg-slate-100"}`}
                                title="Modo caminos: crear nodos y tramos"
                            >
                                <Route className="h-4 w-4" />Caminos
                            </button>
                            <div className="w-px h-6 bg-slate-200 mx-1" />
                            {iconosEdificio.map(icono => (
                                <button
                                    key={icono.id}
                                    type="button"
                                    title={`Colocar: ${icono.nombre}`}
                                    onClick={() => setIconoAColocar(prev => prev === icono.id ? null : icono.id)}
                                    className={`h-10 w-10 rounded-lg flex items-center justify-center cursor-pointer transition ${iconoAColocar === icono.id ? "ring-3 ring-blue-500 scale-110" : "opacity-80 hover:opacity-100"}`}
                                >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={iconoUrl(icono.id)} alt={icono.nombre} className="h-8 w-8" />
                                </button>
                            ))}
                        </div>
                        {/* ── Tamaño de los iconos sobre el mapa (se guarda en el edificio) ── */}
                        <div className="flex flex-wrap items-center gap-2 pb-2 text-xs text-slate-600">
                            <label htmlFor="escala-iconos" className="font-semibold whitespace-nowrap">Tamaño de iconos</label>
                            <input
                                id="escala-iconos"
                                type="range"
                                min={ESCALA_ICONOS.min}
                                max={ESCALA_ICONOS.max}
                                step={ESCALA_ICONOS.paso}
                                value={escalaIconos}
                                onChange={e => handleEscalaChange(Number(e.target.value))}
                                className="w-40 accent-blue-600 cursor-pointer"
                            />
                            <span className="w-10 font-mono">{Math.round(escalaIconos * 100)}%</span>
                            {escalaIconos !== ESCALA_ICONOS.defecto && (
                                <button type="button" className="underline cursor-pointer" onClick={() => handleEscalaChange(ESCALA_ICONOS.defecto)}>
                                    Restablecer
                                </button>
                            )}
                            <span className={estadoEscala === "error" ? "text-red-600" : "text-slate-500"}>
                                {estadoEscala === "guardando" && "Guardando…"}
                                {estadoEscala === "guardado" && "Guardado"}
                                {estadoEscala === "error" && "No se pudo guardar"}
                            </span>
                        </div>
                        {iconoAColocar && (
                            <p className="pb-2 text-xs text-slate-600">
                                Hacé clic en el plano para colocar <b>{getIcono(iconoAColocar)?.nombre}</b>. <kbd className="border rounded px-1">Esc</kbd> vuelve al modo caminos.
                            </p>
                        )}
                        <div className="relative">
                        <Image
                            src={planoUrl}
                            alt="Mapa"
                            className="w-full h-auto object-cover rounded-md"
                            width={800}
                            height={800}
                        />
                        <canvas
                            ref={canvasRef}
                            className="absolute top-0 left-0 w-full h-full pointer-events-auto rounded-xl z-20"
                            width={800}
                            height={800}
                            style={{ cursor: draggingNodeId ? "grabbing" : iconoAColocar ? "copy" : selectedNode ? "crosshair" : "default" }}
                            onClick={handleCanvasClick}
                            onDoubleClick={handleCanvasDoubleClick}
                            onMouseMove={handleMouseMoveWithDragDetect}
                            onMouseDown={handleMouseDown}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseLeave}
                        />

                        {/* ── Acciones del punto seleccionado ── */}
                        {nodoSeleccionado && (
                            <div
                                className="absolute z-30 flex -translate-x-1/2 items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
                                style={{
                                    left: `${(nodoSeleccionado.x / 800) * 100}%`,
                                    // Justo encima del icono (según su tamaño) o del nodo
                                    top: `calc(${((nodoSeleccionado.y - (poiSeleccionado?.icon ? tamanoDe(poiSeleccionado) / 2 : 10) - 6) / 800) * 100}% - 2.3rem)`,
                                }}
                            >
                                <button
                                    type="button"
                                    onClick={() => abrirEdicion(nodoSeleccionado.node)}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
                                    title="Editar nombre, icono y posición del nombre (doble clic)"
                                >
                                    <Pencil className="h-3.5 w-3.5" />Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => deleteNode(nodoSeleccionado.node)}
                                    className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 cursor-pointer"
                                    title="Eliminar el punto y sus tramos (Supr)"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />Eliminar
                                </button>
                            </div>
                        )}

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
                                className="w-16 border border-slate-200 rounded-lg px-2 py-1 text-sm text-center text-slate-700 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                            <span className="text-xs font-bold text-slate-600">°</span>
                            {snapAngleDeg !== null && (
                                <button
                                    onClick={handleClearAngle}
                                    className="text-slate-500 hover:text-red-600 transition-colors text-sm font-bold leading-none"
                                    title="Limpiar ángulo fijo"
                                >
                                    ✕
                                </button>
                            )}
                            <div className="w-px h-4 bg-slate-200 mx-1" />
                            <div className={`flex items-center gap-1 text-xs font-semibold ${isShiftHeld ? "text-blue-600" : "text-slate-500"}`}>
                                <kbd className="border border-current rounded px-1 py-0.5 text-xs">Shift</kbd>
                                <span>{isShiftHeld ? `snap ${SNAP_STEP}°` : "snap off"}</span>
                            </div>
                        </div>

                        </div>

                        <RenamePoiModal
                            open={renameModalOpen}
                            onOpenChange={setRenameModalOpen}
                            initialName={renameInitial}
                            initialIcon={renameInitialIcon}
                            initialEtiqueta={renameInitialEtiqueta}
                            initialEscala={renameInitialEscala}
                            escalaEdificio={escalaIconos}
                            iconos={iconosEdificio}
                            onConfirm={(name, icon, etiqueta, escala) => {
                                if (renameNodeId) updatePoi(renameNodeId, { name, icon, etiqueta, escala });
                                setRenameModalOpen(false);
                            }}
                            onDelete={() => {
                                if (renameNodeId) deleteNode(renameNodeId);
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
