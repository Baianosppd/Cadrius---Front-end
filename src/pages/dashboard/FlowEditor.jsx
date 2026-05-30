import { useState, useRef } from 'react';
import styles from './FlowEditor.module.css';
import EditorHeader from '../../components/ui/EditorHeader';
import NodeLibrary from '../../components/ui/NodeLibrary';
import FlowCanvas from '../../components/ui/FlowCanvas';
import FlowAIChat from '../../components/ui/FlowAIChat';
import api from '../../services/api.js';
import { toast } from 'react-toastify';

function FlowEditor() {
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const [flowTitle, setFlowTitle] = useState('Novo Fluxo');
    const [active, setActive] = useState(false);
    const canvasRef = useRef(null);
    const importInputRef = useRef(null);

    const nodeCount = {
        triggers: nodes.filter(n => n.data?.type === 'trigger').length,
        actions: nodes.filter(n => n.data?.type === 'action').length,
        conditions: nodes.filter(n => n.data?.type === 'condition').length,
        connections: edges.length,
    };

    // =============================
    // SALVAR — envia JSON pro back
    // =============================
    const handleSave = async () => {
        const flow = canvasRef.current?.getFlow();
        if (!flow) return;

        const payload = {
            title: flowTitle,
            active,
            nodes: flow.nodes.map(n => ({
                id: n.id,
                type: n.data.type,
                subtype: n.data.subtype,
                label: n.data.label,
                description: n.data.description,
                position: n.position,
            })),
            edges: flow.edges.map(e => ({
                id: e.id,
                source: e.source,
                target: e.target,
            })),
        };

        try {
            await api.post('/automacoes/fluxos/', payload);
            toast.success('Fluxo salvo com sucesso!');
        } catch (err) {
            toast.error('Falha ao salvar o fluxo. Tente novamente.');
        }
    };

    // =============================
    // IMPORTAR — carrega JSON no canvas
    // =============================
    const handleImportFile = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target.result);
                loadFlowFromJson(json);
                toast.success('Fluxo importado com sucesso!');
            } catch {
                toast.error('Arquivo inválido. Use um JSON de fluxo exportado pelo Cadrius.');
            }
        };
        reader.readAsText(file);
        e.target.value = '';
    };

    const loadFlowFromJson = (json) => {
        const nodeIconMap = {
            whatsapp: 'FiMessageSquare',
            email: 'FiMail',
            projuris: 'FiFileText',
            agendamento: 'FiCalendar',
            send_whatsapp: 'FiSend',
            send_email: 'FiMail',
            criar_projuris: 'FiPlusSquare',
            send_sms: 'FiSmartphone',
            google_drive: 'FiHardDrive',
            slack: 'FiSlack',
            condicao: 'FiGitBranch',
            aguardar: 'FiClock',
        };

        const colorMap = {
            trigger: { color: '#16a34a', bg: '#dcfce7' },
            action: { color: '#3b82f6', bg: '#dbeafe' },
            condition: { color: '#f59e0b', bg: '#fef9c3' },
        };

        const flowNodes = json.nodes.map(n => ({
            id: n.id,
            type: 'custom',
            position: n.position,
            data: {
                type: n.type,
                subtype: n.subtype,
                label: n.label,
                description: n.description,
                color: colorMap[n.type]?.color,
                bg: colorMap[n.type]?.bg,
            },
        }));

        const flowEdges = json.edges.map(e => ({
            id: e.id,
            source: e.source,
            target: e.target,
            animated: true,
        }));

        if (json.title) setFlowTitle(json.title);
        if (json.active !== undefined) setActive(json.active);

        canvasRef.current?.loadFlow(flowNodes, flowEdges);
        setNodes(flowNodes);
        setEdges(flowEdges);
    };

    // =============================
    // CARREGAR DO BACK (por ID)
    // =============================
    const handleLoadFromBack = async (id) => {
        try {
            const response = await api.get(`/automacoes/fluxos/${id}/`);
            loadFlowFromJson(response.data);
            toast.success('Fluxo carregado!');
        } catch (err) {
            toast.error('Falha ao carregar o fluxo.');
        }
    };

    return (
        <div className={styles.container}>
            <EditorHeader
                title={flowTitle}
                active={active}
                lastExecution={null}
                nodeCount={nodeCount}
                onAdd={() => { }}
                onExecute={() => { }}
                onSave={handleSave}
                onImport={() => importInputRef.current?.click()}
                onAutoLayout={() => canvasRef.current?.autoLayout()}
            />

            {/* Input escondido para importar arquivo */}
            <input
                ref={importInputRef}
                type="file"
                accept=".json"
                style={{ display: 'none' }}
                onChange={handleImportFile}
            />

            <div className={styles.body}>
                <NodeLibrary />
                <div className={styles.canvas_area}>
                    <FlowCanvas
                        ref={canvasRef}
                        onNodesChange={setNodes}
                        onEdgesChange={setEdges}
                    />
                </div>
                <FlowAIChat onAddNodes={() => { }} />
            </div>
        </div>
    );
}

export default FlowEditor;