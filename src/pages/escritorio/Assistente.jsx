import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCheck, FiCpu, FiMessageCircle, FiPlus, FiSend, FiTool, FiTrash2, FiX, FiZap } from 'react-icons/fi';
import styles from '../../components/seguranca/seguranca.module.css';
import a from '../../components/assistant/Assistant.module.css';
import { Banner, PageHeader, Pill, errorMessage } from '../../components/seguranca/ui';
import RichText from '../../components/assistant/RichText';
import TextTools from '../../components/assistant/TextTools';
import { PROVIDER_LABEL, SUGGESTIONS, assistantApi } from '../../services/assistant';

// Assistente de IA (CAD-221): pergunta, pesquisa nos dados do escritório, escreve e PROPÕE ações — que só rodam
// quando a própria pessoa confirma.
export default function Assistente() {
    const [tab, setTab] = useState('conversa');
    const [status, setStatus] = useState(null);
    useEffect(() => { assistantApi.status().then(setStatus).catch(() => setStatus({ disponivel: false })); }, []);
    return (
        <div className={styles.page}>
            <PageHeader title="Assistente IA" subtitle="Pergunte, pesquise nos dados do escritório, escreva e peça ações — você confirma antes de qualquer mudança." />
            <div className={styles.tabs} role="tablist">
                <button type="button" role="tab" aria-selected={tab === 'conversa'} className={`${styles.tab} ${tab === 'conversa' ? styles.tab_active : ''}`} onClick={() => setTab('conversa')}>Conversa</button>
                <button type="button" role="tab" aria-selected={tab === 'texto'} className={`${styles.tab} ${tab === 'texto' ? styles.tab_active : ''}`} onClick={() => setTab('texto')}>Ferramentas de texto</button>
            </div>
            {status && !status.disponivel && (
                <Banner tone="warn">
                    {status.ia_ligada === false ? 'A IA está desligada para o escritório (Segurança → IA segura).'
                        : 'Nenhuma IA segura para dados do escritório está configurada. Peça à TI para configurar um provedor (Claude, OpenAI, Groq, Sabiá ou modelo local).'}
                </Banner>
            )}
            {tab === 'conversa' ? <Chat status={status} /> : <TextTools />}
        </div>
    );
}

function Chat({ status }) {
    const [list, setList] = useState([]);
    const [conv, setConv] = useState(null);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [pending, setPending] = useState('');
    const end = useRef(null);
    const input = useRef(null);

    const loadList = () => assistantApi.list().then(setList).catch(() => {});
    useEffect(() => { loadList(); }, []);
    useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [conv, pending]);

    const open = async (id) => {
        try { setConv(await assistantApi.get(id)); } catch (e) { toast.error(errorMessage(e)); }
    };
    const send = async (msg) => {
        const body = (msg ?? text).trim();
        if (!body || busy) return;
        setBusy(true);
        setPending(body);
        setText('');
        try {
            const data = conv ? await assistantApi.send(conv.id, body) : await assistantApi.start(body);
            setConv(data);
            loadList();
        } catch (e) {
            const data = e.response?.data;
            if (data?.conversa) setConv(data.conversa);
            toast.error(errorMessage(e));
            setText(body);
        } finally {
            setBusy(false);
            setPending('');
            input.current?.focus();
        }
    };
    const decide = async (id, decisao) => {
        try {
            setConv(await assistantApi.decide(id, decisao));
            toast.success(decisao === 'confirmar' ? 'Feito.' : 'Cancelado.');
        } catch (e) { toast.error(errorMessage(e)); }
    };
    const remove = async (id) => {
        try {
            await assistantApi.remove(id);
            if (conv?.id === id) setConv(null);
            loadList();
        } catch (e) { toast.error(errorMessage(e)); }
    };

    const actionsByMsg = {};
    for (const act of conv?.acoes || []) (actionsByMsg[act.mensagem_id] ||= []).push(act);

    return (
        <div className={a.layout}>
            <aside className={a.side} aria-label="Conversas">
                <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => { setConv(null); input.current?.focus(); }}>
                    <FiPlus aria-hidden="true" /> Nova conversa
                </button>
                {list.map((c) => (
                    <div key={c.id} className={`${a.conv} ${conv?.id === c.id ? a.conv_on : ''}`}>
                        <FiMessageCircle aria-hidden="true" />
                        <button type="button" className={a.conv_title} onClick={() => open(c.id)}
                            style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>{c.titulo}</button>
                        <button type="button" className={a.conv_del} aria-label={`Apagar conversa ${c.titulo}`} onClick={() => remove(c.id)}><FiTrash2 /></button>
                    </div>
                ))}
            </aside>
            <section className={a.chat} aria-label="Conversa com o assistente">
                <div className={a.messages} aria-live="polite">
                    {!conv && !pending && (
                        <div className={a.welcome}>
                            <FiCpu size={28} aria-hidden="true" color="var(--c-primary)" />
                            <div className={a.welcome_title}>Como posso ajudar?</div>
                            <div>Consulto contatos, processos, publicações, prazos e documentos do escritório; escrevo e reviso textos;
                                e preparo tarefas, minutas e lançamentos para você confirmar.</div>
                            <div className={a.suggestions}>
                                {SUGGESTIONS.map((s) => <button key={s} type="button" className={a.suggestion} onClick={() => send(s)} disabled={busy || status?.disponivel === false}>{s}</button>)}
                            </div>
                        </div>
                    )}
                    {conv?.mensagens.map((m) => (m.papel === 'note' ? (
                        <div key={m.id} className={a.note}><FiCheck aria-hidden="true" /> {m.texto}</div>
                    ) : (
                        <div key={m.id} className={`${a.msg} ${m.papel === 'user' ? a.msg_user : a.msg_ai}`}>
                            <div className={a.bubble}>{m.papel === 'user' ? m.texto : <RichText text={m.texto} />}</div>
                            {m.papel === 'assistant' && (m.ferramentas.length > 0 || m.provedor) && (
                                <div className={a.meta}>
                                    {m.ferramentas.map((t) => <span key={t} className={a.tool_chip}><FiTool aria-hidden="true" /> {toolLabel(t)}</span>)}
                                    {m.provedor && <span>via {PROVIDER_LABEL[m.provedor] || m.provedor}</span>}
                                </div>
                            )}
                            {(actionsByMsg[m.id] || []).map((act) => <ActionCard key={act.id} action={act} onDecide={decide} />)}
                        </div>
                    )))}
                    {pending && (
                        <>
                            <div className={`${a.msg} ${a.msg_user}`}><div className={a.bubble}>{pending}</div></div>
                            <div className={`${a.msg} ${a.msg_ai}`}><div className={a.bubble}><span className={a.thinking} aria-label="Pensando"><span /><span /><span /></span></div></div>
                        </>
                    )}
                    <div ref={end} />
                </div>
                <form className={a.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
                    <textarea ref={input} className={styles.textarea} rows={1} value={text} maxLength={8000} aria-label="Mensagem ao assistente"
                        placeholder="Pergunte ou peça algo… (Enter envia, Shift+Enter quebra linha)" disabled={status?.disponivel === false}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || !text.trim()} aria-label="Enviar">
                        <FiSend aria-hidden="true" />
                    </button>
                </form>
            </section>
        </div>
    );
}

const TOOL_LABELS = {
    buscar_contatos: 'Contatos', buscar_processos: 'Processos', publicacoes: 'Publicações', ler_publicacao: 'Publicação', agenda: 'Agenda',
    buscar_documentos: 'Documentos', calcular_prazo: 'Cálculo de prazo', resumo_financeiro: 'Financeiro', memoria_do_escritorio: 'Memória do escritório',
    criar_tarefa: 'Tarefa', criar_contato: 'Contato', gerar_minuta: 'Minuta', lancar_despesa: 'Despesa', marcar_publicacao_revisada: 'Revisão',
};
const toolLabel = (t) => TOOL_LABELS[t] || t;

function ActionCard({ action, onDecide }) {
    const [busy, setBusy] = useState(false);
    const go = async (d) => { setBusy(true); await onDecide(action.id, d); setBusy(false); };
    const tone = { pending: ['blue', 'Aguardando sua confirmação'], done: ['green', 'Feito'], canceled: ['gray', 'Cancelado'], failed: ['red', 'Não foi possível'] }[action.status];
    return (
        <div className={a.action}>
            <div className={a.action_title}><FiZap aria-hidden="true" /> {action.rotulo} <Pill tone={tone[0]}>{tone[1]}</Pill></div>
            <div className={a.action_text}>{action.resumo}</div>
            {action.status === 'failed' && action.resultado?.erro && <Banner tone="error">{action.resultado.erro}</Banner>}
            {action.status === 'done' && action.resultado?.link && <a href={action.resultado.link}>Abrir</a>}
            {action.status === 'pending' && (
                <div className={styles.btn_row}>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary} ${styles.btn_sm}`} disabled={busy} onClick={() => go('confirmar')}><FiCheck aria-hidden="true" /> Confirmar</button>
                    <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={busy} onClick={() => go('cancelar')}><FiX aria-hidden="true" /> Cancelar</button>
                </div>
            )}
        </div>
    );
}

