import { useCallback, useRef, forwardRef, useImperativeHandle } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    addEdge,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
    useReactFlow,
    ReactFlowProvider,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import CustomNode from './CustomNode';
import styles from './FlowCanvas.module.css';
import { getAutoLayout } from './FlowAutoLayout';
import { FiLayout } from 'react-icons/fi';

const nodeTypes = {
    custom: CustomNode,
};

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

const FlowCanvasInner = forwardRef(({ onNodesChange: onNodesChangeProp, onEdgesChange: onEdgesChangeProp }, ref) => {
    const reactFlowWrapper = useRef(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const { fitView } = useReactFlow();

    useImperativeHandle(ref, () => ({
        getFlow: () => ({ nodes, edges }),
        loadFlow: (flowNodes, flowEdges) => {
            setNodes(flowNodes);
            setEdges(flowEdges);
            setTimeout(() => fitView(), 100);
        },
        autoLayout: () => {
            const laid = getAutoLayout(nodes, edges);
            setNodes(laid);
            setTimeout(() => fitView(), 100);
        },
    }));

    const onConnect = useCallback(
        (connection) => setEdges((eds) => {
            const updated = addEdge({ ...connection, animated: true }, eds);
            if (onEdgesChangeProp) onEdgesChangeProp(updated);
            return updated;
        }),
        [setEdges, onEdgesChangeProp]
    );

    const onDragOver = useCallback((e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback((e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData('application/reactflow');
        if (!data) return;

        const nodeData = JSON.parse(data);
        const bounds = reactFlowWrapper.current.getBoundingClientRect();

        const position = {
            x: e.clientX - bounds.left - 75,
            y: e.clientY - bounds.top - 30,
        };

        const newNode = {
            id: getId(),
            type: 'custom',
            position,
            data: nodeData,
        };

        setNodes((nds) => {
            const updated = [...nds, newNode];
            if (onNodesChangeProp) onNodesChangeProp(updated);
            return updated;
        });
    }, [setNodes, onNodesChangeProp]);

    const onDeleteNode = useCallback((nodeId) => {
        setNodes((nds) => {
            const updated = nds.filter((n) => n.id !== nodeId);
            if (onNodesChangeProp) onNodesChangeProp(updated);
            return updated;
        });
        setEdges((eds) => eds.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
        ));
    }, [setNodes, setEdges, onNodesChangeProp]);

    const handleAutoLayout = () => {
        const laid = getAutoLayout(nodes, edges);
        setNodes(laid);
        setTimeout(() => fitView(), 100);
    };

    return (
        <div className={styles.wrapper} ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes.map(n => ({
                    ...n,
                    data: { ...n.data, onDelete: () => onDeleteNode(n.id) }
                }))}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
                deleteKeyCode="Delete"
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d1d5db" />
                <Controls />
                <MiniMap
                    nodeColor={(n) => {
                        if (n.data?.type === 'trigger') return '#16a34a';
                        if (n.data?.type === 'action') return '#3b82f6';
                        if (n.data?.type === 'condition') return '#f59e0b';
                        return '#9ca3af';
                    }}
                />
            </ReactFlow>
        </div>
    );
});

const FlowCanvas = forwardRef((props, ref) => (
    <ReactFlowProvider>
        <FlowCanvasInner {...props} ref={ref} />
    </ReactFlowProvider>
));

export default FlowCanvas;