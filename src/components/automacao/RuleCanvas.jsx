import { useEffect, useMemo, useState } from 'react';
import { Background, BackgroundVariant, Controls, Handle, Position, ReactFlow, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { FiCheckSquare, FiFilter, FiZap } from 'react-icons/fi';
import { Pill } from '../seguranca/ui';
import s from './RuleFlowView.module.css';

const ICON = { trigger: FiZap, condition: FiFilter, action: FiCheckSquare };
const NODE_W = 220;
const NODE_H = 132;
const GAP = 56;

// Um passo da regra como nó do React Flow (mesmo visual dos cartões de antes, agora num canvas navegável)
function StepNode({ data }) {
    const Icon = ICON[data.kind];
    const vertical = data.vertical;
    return (
        <div className={`${s.node} ${s[data.kind]} ${data.status ? s[`st_${data.status}`] || '' : ''} ${data.live ? s.node_live : ''}`}
            style={{ width: NODE_W, height: data.vertical ? undefined : NODE_H }} role="listitem">
            {data.kind !== 'trigger' && <Handle type="target" position={vertical ? Position.Top : Position.Left} isConnectable={false} />}
            <span className={s.kind}><Icon aria-hidden="true" /> {data.title}</span>
            {data.label && <span className={s.label}>{data.label}</span>}
            {data.details?.map((d, i) => <span key={i} className={`${s.detail} ${s.clamp}`} title={d}>{d}</span>)}
            {data.pill && <Pill tone={data.pill.tone}>{data.pill.text}</Pill>}
            {!data.last && <Handle type="source" position={vertical ? Position.Bottom : Position.Right} isConnectable={false} />}
        </div>
    );
}

const nodeTypes = { step: StepNode };

function useVertical() {
    const query = '(max-width: 760px)';
    const [v, setV] = useState(() => typeof window !== 'undefined' && window.matchMedia?.(query).matches);
    useEffect(() => {
        const mq = window.matchMedia?.(query);
        if (!mq) return undefined;
        const on = (e) => setV(e.matches);
        mq.addEventListener?.('change', on);
        return () => mq.removeEventListener?.('change', on);
    }, []);
    return !!v;
}

// CAD-232: a regra aberta vira um fluxo no React Flow (gatilho → condições → ações), com as arestas animadas quando a
// regra está ligada e cada passo colorido conforme a última execução (ou a simulação).
function buildFlow(steps, { live, vertical }) {
    const nodes = steps.map((st, i) => ({
        id: `n${i}`,
        type: 'step',
        position: vertical ? { x: 0, y: i * 190 } : { x: i * (NODE_W + GAP), y: 0 },
        data: { ...st, live, vertical, last: i === steps.length - 1 },
        draggable: true,
        selectable: false,
    }));
    const edges = steps.slice(1).map((_, i) => ({
        id: `e${i}`, source: `n${i}`, target: `n${i + 1}`, animated: live, type: 'smoothstep',
        style: { stroke: live ? 'var(--c-primary)' : 'var(--c-border-2)', strokeWidth: 2 },
    }));
    return { nodes, edges };
}

export default function RuleCanvas({ steps, live }) {
    const vertical = useVertical();
    const { nodes, edges } = useMemo(() => buildFlow(steps, { live, vertical }), [steps, live, vertical]);
    const height = vertical ? Math.min(160 + steps.length * 190, 900) : 230;
    return (
        <div className={s.canvas} style={{ height }} role="list" aria-label="Etapas da regra">
            <ReactFlowProvider>
                <ReactFlow key={vertical ? 'v' : 'h'} nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView fitViewOptions={{ padding: 0.12, maxZoom: 1 }}
                    nodesConnectable={false} elementsSelectable={false} panOnScroll={false} zoomOnScroll={false} preventScrolling={false}
                    minZoom={0.4} maxZoom={1.4} proOptions={{ hideAttribution: true }}>
                    <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
                    <Controls showInteractive={false} position="bottom-right" />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    );
}
