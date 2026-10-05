import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './FlowEditor.module.css';
import EditorHeader from '../../components/ui/EditorHeader';
import NodeLibrary from '../../components/ui/NodeLibrary';
import FlowCanvas from '../../components/ui/FlowCanvas';
import FlowAIChat from '../../components/ui/FlowAIChat';
import NodeInspector from '../../components/ui/NodeInspector';
import { getAutoLayout } from '../../components/ui/FlowAutoLayout';
import api from '../../services/api.js';
import { toast } from 'react-toastify';
import { flowToWorkflow, validateFlow, workflowToFlow } from '../../services/flowMapper';
import { errorMessage } from '../../components/seguranca/ui';

const COLORS = {
    trigger: { color: 'var(--c-success)', bg: '#dcfce7' },
    action: { color: '#3b82f6', bg: '#dbeafe' },
};

// Dá cor aos nós vindos do back (o ícone é opcional)
const decorate = (nodes) => nodes.map((n) => ({ ...n, data: { ...n.data, ...(COLORS[n.data.type] || {}) } }));

function FlowEditor() {
    const [params] = useSearchParams();
    const workflowId = params.get('id');
    const navigate = useNavigate();

    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [flowTitle, setFlowTitle] = useState('Novo Fluxo');
    const [active, setActive] = useState(false);
    const [saving, setSaving] = useState(false);
    const [connections, setConnections] = useState([]);
    const [connectionId, setConnectionId] = useState(null);
    const [selectedId, setSelectedId] = useState(null);
    const canvasRef = useRef(null);
    const importInputRef = useRef(null);

    const nodeCount = {
        triggers: nodes.filter(n => n.data?.type === 'trigger').length,
        actions: nodes.filter(n => n.data?.type === 'action').length,
        conditions: nodes.filter(n => n.data?.type === 'condition').length,
        connections: edges.length,
    };

    const applyFlow = useCallback((flowNodes, flowEdges) => {
        const laidOut = getAutoLayout(flowNodes, flowEdges);
        canvasRef.current?.loadFlow(decorate(laidOut), flowEdges);
    }, []);

    useEffect(() => {
        api.get('connections/').then((r) => setConnections(r.data)).catch(() => setConnections([]));
    }, []);

    // Edição: carrega o workflow existente do back
    useEffect(() => {
        if (!workflowId) return;
        api.get(`workflows/${workflowId}/`)
            .then(({ data }) => {
                setFlowTitle(data.name);
                setActive(data.is_active);
                setConnectionId(data.trigger?.connection ?? null);
                const flow = workflowToFlow(data);
                setTimeout(() => applyFlow(flow.nodes, flow.edges), 50);
            })
            .catch(() => { toast.error('Não foi possível carregar a automação.'); navigate('/automacao'); });
    }, [workflowId, applyFlow, navigate]);

    const handleSave = async () => {
        const flow = canvasRef.current?.getFlow();
        if (!flow) return;
        const problems = validateFlow(flow.nodes, flow.edges);
        if (!connectionId && flow.nodes.some((n) => n.data?.type === 'trigger')) problems.push('Selecione a conexão do gatilho (clique no gatilho).');
        if (problems.length) { toast.error(problems[0]); return; }

        setSaving(true);
        try {
            const body = flowToWorkflow({ nodes: flow.nodes, edges: flow.edges, title: flowTitle, active, connectionId });
            if (workflowId) await api.put(`workflows/${workflowId}/`, body);
            else await api.post('workflows/', body);
            toast.success('Automação salva!');
            navigate('/automacao');
        } catch (err) {
            toast.error(errorMessage(err, 'Falha ao salvar a automação.'));
        } finally {
            setSaving(false);
        }
    };

    // Importar JSON exportado: aceita o formato do back (trigger + actions)
    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                if (!json.trigger || !Array.isArray(json.actions)) throw new Error('formato');
                if (json.name) setFlowTitle(json.name);
                const flow = workflowToFlow(json);
                applyFlow(flow.nodes, flow.edges);
                toast.success('Fluxo importado.');
            } catch {
                toast.error('Arquivo inválido. Use um JSON de automação (trigger + actions).');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    // Sugestão da IA → vira nós no canvas (nada é salvo até o usuário revisar e clicar em Salvar)
    const handleAIWorkflow = (generated) => {
        const flow = workflowToFlow({
            trigger: generated.trigger, actions: generated.actions,
        });
        if (generated.workflow_name) setFlowTitle(generated.workflow_name);
        applyFlow(flow.nodes, flow.edges);
    };

    const selected = nodes.find((n) => n.id === selectedId) || null;

    return (
        <div className={styles.container}>
            <EditorHeader
                title={flowTitle}
                active={active}
                lastExecution={null}
                nodeCount={nodeCount}
                saving={saving}
                onTitleChange={setFlowTitle}
                onToggleActive={() => setActive((a) => !a)}
                onSave={handleSave}
                onImport={() => importInputRef.current?.click()}
                onAutoLayout={() => canvasRef.current?.autoLayout()}
            />

            <input ref={importInputRef} type="file" accept=".json" style={{ display: 'none' }} onChange={handleImportFile} />

            <div className={styles.body}>
                <NodeLibrary />
                <div className={styles.canvas_area}>
                    <FlowCanvas
                        ref={canvasRef}
                        onNodesChange={setNodes}
                        onEdgesChange={setEdges}
                        onSelectNode={setSelectedId}
                    />
                </div>
                {selected ? (
                    <NodeInspector
                        node={selected}
                        connections={connections}
                        connectionId={connectionId}
                        onConnection={setConnectionId}
                        onChange={(id, patch) => canvasRef.current?.updateNodeData(id, patch)}
                        onClose={() => setSelectedId(null)}
                    />
                ) : (
                    <FlowAIChat onWorkflow={handleAIWorkflow} />
                )}
            </div>
        </div>
    );
}

export default FlowEditor;
