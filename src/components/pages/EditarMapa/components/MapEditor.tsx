
import { Card, CardContent } from "@/components/ui/card";
import { useEditMapEdificio } from "@/hooks/useEditMapEdificio";
import { useRef, useEffect, useState } from "react";
import { RenamePoiModal } from "./RenamePoiModal";
import { useGrafoMapaStore } from "@/zustand/grafo-mapa.store";
import { loadMapLayers } from "@/services/map-graph.service";
import Image from "next/image";

export function MapEditor() {
    const { edificio, level } = useEditMapEdificio();
    const setAll = useGrafoMapaStore(state => state.setAll);
    // Cargar grafo al abrir el editor
    // Obtener el índice del nivel seleccionado
    const getLevelIndex = () => {
        if (!edificio?.planos || !level) return null;
        const entries = Object.entries(edificio.planos);
        const found = entries.find(([idx, url]) => url === level);
        return found ? found[0] : null;
    };

    const setCapasFromFirestore = useGrafoMapaStore(state => state.setCapasFromFirestore);
    useEffect(() => {
        const nivelId = getLevelIndex();
        if (edificio?.id && nivelId) {
            // Cargar todas las capas desde Firestore
            loadMapLayers({ edificioId: edificio.id, nivel: nivelId }).then(capas => {
                setCapasFromFirestore(capas);
            });
        } else {
            setCapasFromFirestore({});
            setAll({ nodes: [], connections: [], pois: [] });
        }
    }, [edificio?.id, level, setAll, setCapasFromFirestore]);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const nodes = useGrafoMapaStore(state => state.nodes);
    const connections = useGrafoMapaStore(state => state.connections);
    const pois = useGrafoMapaStore(state => state.pois);
    const selectedNode = useGrafoMapaStore(state => state.selectedNode);
    const addNode = useGrafoMapaStore(state => state.addNode);
    const connectNodes = useGrafoMapaStore(state => state.connectNodes);
    const disconnectNodes = useGrafoMapaStore(state => state.disconnectNodes);
    const renameNode = useGrafoMapaStore(state => state.renameNode);
    const deleteNode = useGrafoMapaStore(state => state.deleteNode);
    const setSelectedNode = useGrafoMapaStore(state => state.setSelectedNode);
    const clearSelection = useGrafoMapaStore(state => state.clearSelection);

    // Dibuja nodos y conexiones en el canvas
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
                ctx.stroke();
            } else if (nodeA && !nodeB) {
                // Conexión a otro nivel desde nodeA
                ctx.beginPath();
                ctx.moveTo(nodeA.x, nodeA.y);
                // Dibujar línea hasta el borde superior
                ctx.lineTo(nodeA.x, 0);
                ctx.strokeStyle = "#f59e42";
                ctx.setLineDash([6, 6]);
                ctx.lineWidth = 2;
                ctx.stroke();
                ctx.setLineDash([]);
                // Mostrar texto con info de destino
                ctx.font = "bold 12px Arial";
                ctx.fillStyle = "#f59e42";
                const destLabel = `→ ${destino}${nivel_destino !== undefined ? ` (Nivel ${nivel_destino})` : ''}`;
                ctx.fillText(destLabel, nodeA.x + 8, 16);
            } else if (!nodeA && nodeB) {
                // Conexión a otro nivel desde nodeB
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
        // Dibujar nodos
        nodes.forEach((node) => {
            ctx.beginPath();
            ctx.arc(node.x, node.y, 10, 0, 2 * Math.PI);
            ctx.fillStyle = selectedNode === node.node ? "#2563eb" : "#fff";
            ctx.strokeStyle = "#2563eb";
            ctx.lineWidth = 2;
            ctx.fill();
            ctx.stroke();
        });
        // Dibujar nombres de POIs
        pois.forEach((poi) => {
            ctx.font = "12px Arial";
            ctx.fillStyle = "#111";
            ctx.fillText(poi.name, poi.x + 12, poi.y - 12);
        });
    }, [nodes, connections, pois, selectedNode]);

    // Obtener coordenadas relativas al canvas, ajustando por escalado
    const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
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

    // Click: crear nodo o seleccionar/conectar
    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const { x, y } = getCanvasCoords(e);
        const node = findNodeAt(x, y);
        if (e.ctrlKey && e.shiftKey && node) {
            deleteNode(node.node);
            return;
        }
        if (!node) {
            addNode(x, y);
            clearSelection();
        } else {
            if (selectedNode && selectedNode !== node.node) {
                // Si ya hay uno seleccionado, conectar/desconectar
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

    // Estado para modal de renombrar POI
    const [renameModalOpen, setRenameModalOpen] = useState(false);
    const [renameNodeId, setRenameNodeId] = useState<string | null>(null);
    const [renameInitial, setRenameInitial] = useState<string>("");

    // Doble click: abrir modal para renombrar nodo
    const handleCanvasDoubleClick = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
        const { x, y } = getCanvasCoords(e);
        const node = findNodeAt(x, y);
        if (node) {
            setRenameNodeId(node.node);
            const poi = pois.find(p => p.node === node.node);
            setRenameInitial(poi?.name || "");
            setRenameModalOpen(true);
        }
    };

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
                            onClick={handleCanvasClick}
                            onDoubleClick={handleCanvasDoubleClick}
                        />
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
