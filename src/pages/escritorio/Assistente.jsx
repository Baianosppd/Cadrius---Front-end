import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiBriefcase, FiCheck, FiCpu, FiFileText, FiLink, FiMessageCircle, FiPaperclip, FiPlus, FiSend, FiSettings, FiTool, FiTrash2, FiX, FiZap } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';
import styles from '../../components/seguranca/seguranca.module.css';
import a from '../../components/assistant/Assistant.module.css';
import { Banner, PageHeader, Pill, errorMessage } from '../../components/seguranca/ui';
import RichText from '../../components/assistant/RichText';
import TextTools from '../../components/assistant/TextTools';
import { FALE_SOBRE_PROCESSO, PROVIDER_LABEL, SUGGESTIONS, assistantApi } from '../../services/assistant';
import FaleSobreProcesso from '../../components/ia/FaleSobreProcesso';
import DocPicker from '../../components/assistant/DocPicker';
import { DOC_ACTIONS, splitDocRef } from '../../services/assistant';
import { casesApi } from '../../services/rules';

// Assistente de IA (CAD-221): pergunta, pesquisa nos dados do escritório, escreve e PROPÕE ações — que só rodam
// quando a própria pessoa confirma.
export default function Assistente() {
    const [tab, setTab] = useState('conversa');
    const [status, setStatus] = useState(null);
    const [config, setConfig] = useState(false);
    const loadStatus = () => assistantApi.status().then(setStatus).catch(() => setStatus({ disponivel: false }));
    useEffect(() => { loadStatus(); }, []);
    return (
        <div className={styles.page}>
            <PageHeader title="Assistente IA" subtitle="Você confirma antes de qualquer mudança"
                actions={status?.pode_configurar && (
                    <button type="button" className={styles.btn} onClick={() => setConfig(true)}><FiSettings aria-hidden="true" /> Configurações</button>
                )} />
            {config && <Settings status={status} onClose={() => { setConfig(false); loadStatus(); }} />}
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
    const [caseStart, setCaseStart] = useState(false);
    const [fale, setFale] = useState(false);
    const [doc, setDoc] = useState(null);              // CAD-226: documento escolhido para a próxima mensagem
    const [picking, setPicking] = useState(false);
    const [params, setParams] = useSearchParams();
    const end = useRef(null);
    const input = useRef(null);

    const loadList = () => assistantApi.list().then(setList).catch(() => {});
    useEffect(() => { loadList(); }, []);
    useEffect(() => {                                  // vindo de Documentos → "Usar no Assistente"
        const id = params.get('documento');
        if (!id) return;
        setDoc({ id: Number(id), nome: params.get('nome') || `Documento ${id}` });
        setConv(null);
        const next = new URLSearchParams(params); next.delete('documento'); next.delete('nome');
        setParams(next, { replace: true });
    }, [params, setParams]);
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
            const docId = doc?.id;
            const data = conv ? await assistantApi.send(conv.id, body, docId) : await assistantApi.start(body, docId);
            setConv(data);
            setDoc(null);
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
                {status?.estrategia_de_caso && (
                    <button type="button" className={styles.btn} onClick={() => setCaseStart(true)}><FiBriefcase aria-hidden="true" /> Estratégia de caso</button>
                )}
                {list.map((c) => (
                    <div key={c.id} className={`${a.conv} ${conv?.id === c.id ? a.conv_on : ''}`}>
                        {c.modo === 'caso' ? <FiBriefcase aria-label="Estratégia de caso" /> : c.modo === 'mcp' ? <FiLink aria-label="Pedidos pelo conector" />
                            : <FiMessageCircle aria-hidden="true" />}
                        <button type="button" className={a.conv_title} onClick={() => open(c.id)}
                            style={{ background: 'none', border: 0, padding: 0, font: 'inherit', color: 'inherit', cursor: 'pointer', textAlign: 'left' }}>{c.titulo}</button>
                        <button type="button" className={a.conv_del} aria-label={`Apagar conversa ${c.titulo}`} onClick={() => remove(c.id)}><FiTrash2 /></button>
                    </div>
                ))}
            </aside>
            <section className={a.chat} aria-label="Conversa com o assistente">
                {conv?.modo === 'caso' && <Banner tone="info">Modo estratégia de caso{conv.processo ? ` — processo ${conv.processo}` : ''}: fatos, teses, provas,
                    riscos, cenários e plano de ação. Confira sempre as fontes citadas.</Banner>}
                {conv?.modo === 'mcp' && <Banner tone="info">Pedidos feitos pelo Claude/ChatGPT através do conector. Confirme ou cancele cada um.</Banner>}
                {fale && <FaleSobreProcesso onClose={() => setFale(false)} />}
                {caseStart && <CaseStart onClose={() => setCaseStart(false)} onStarted={(c) => { setCaseStart(false); setConv(c); loadList(); }} />}
                <div className={a.messages} aria-live="polite">
                    {!conv && !pending && (
                        <div className={a.welcome}>
                            <FiCpu size={28} aria-hidden="true" color="var(--c-primary)" />
                            <div className={a.welcome_title}>Como posso ajudar?</div>
                            <div>Consulto contatos, processos, publicações, prazos e documentos do escritório; escrevo e reviso textos;
                                e preparo tarefas, minutas e lançamentos para você confirmar.</div>
                            <div className={a.suggestions}>
                                {status?.pode_configurar && (
                                    <button type="button" className={`${a.suggestion} ${a.suggestion_main}`} onClick={() => setFale(true)}>{FALE_SOBRE_PROCESSO}</button>
                                )}
                                {SUGGESTIONS.map((s) => <button key={s} type="button" className={a.suggestion} onClick={() => send(s)} disabled={busy || status?.disponivel === false}>{s}</button>)}
                            </div>
                        </div>
                    )}
                    {conv?.mensagens.map((m) => (m.papel === 'note' ? (
                        <div key={m.id} className={a.note}><FiCheck aria-hidden="true" /> {m.texto}</div>
                    ) : (
                        <div key={m.id} className={`${a.msg} ${m.papel === 'user' ? a.msg_user : a.msg_ai}`}>
                            <div className={a.bubble}>{m.papel === 'user' ? <UserText text={m.texto} /> : <RichText text={m.texto} />}</div>
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
                {picking && <DocPicker onClose={() => setPicking(false)} onPick={(d) => { setDoc(d); setPicking(false); input.current?.focus(); }} />}
                <div className={a.composer_wrap}>
                {doc && (
                    <div className={a.doc_bar}>
                        <span className={a.doc_chip}><FiFileText aria-hidden="true" /><span title={doc.nome}>{doc.nome}</span>
                            <button type="button" onClick={() => setDoc(null)} aria-label="Tirar o documento"><FiX aria-hidden="true" /></button></span>
                        {DOC_ACTIONS.map((x) => (
                            <button key={x.label} type="button" className={`${a.suggestion}`} disabled={busy || status?.disponivel === false} onClick={() => send(x.prompt)}>{x.label}</button>
                        ))}
                    </div>
                )}
                <form className={a.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
                    <button type="button" className={styles.btn} onClick={() => setPicking(true)} aria-label="Usar um documento" title="Usar um documento"
                        disabled={status?.disponivel === false}><FiPaperclip aria-hidden="true" /></button>
                    <textarea ref={input} className={styles.textarea} rows={1} value={text} maxLength={8000} aria-label="Mensagem ao assistente"
                        placeholder="Pergunte ou peça algo… (Enter envia, Shift+Enter quebra linha)" disabled={status?.disponivel === false}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }} />
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || !text.trim()} aria-label="Enviar">
                        <FiSend aria-hidden="true" />
                    </button>
                </form>
                </div>
            </section>
        </div>
    );
}

// Mensagem da pessoa: o marcador [documento:ID "nome"] vira um selo clicável
function UserText({ text }) {
    const { body, doc } = splitDocRef(text);
    return (
        <>
            {body}
            {doc && <div><Link className={a.doc_ref} to={`/documents/${doc.id}`}><FiFileText aria-hidden="true" /> {doc.nome}</Link></div>}
        </>
    );
}

const TOOL_LABELS = {
    buscar_contatos: 'Contatos', buscar_processos: 'Processos', publicacoes: 'Publicações', ler_publicacao: 'Publicação', agenda: 'Agenda',
    buscar_documentos: 'Documentos', ler_documento: 'Leitura do documento', calcular_prazo: 'Cálculo de prazo', resumo_financeiro: 'Financeiro', memoria_do_escritorio: 'Memória do escritório',
    criar_tarefa: 'Tarefa', criar_contato: 'Contato', gerar_minuta: 'Minuta', lancar_despesa: 'Despesa', marcar_publicacao_revisada: 'Revisão',
    catalogo_de_automacao: 'Catálogo de automações', listar_regras: 'Regras', sugestoes_de_automacao: 'Sugestões', criar_regra: 'Nova automação',
    ativar_regra: 'Ligar automação', aceitar_sugestao: 'Sugestão', lembrar: 'Memória', perfil_do_escritorio: 'Perfil do escritório',
    oportunidades: 'Funil', criar_oportunidade: 'Oportunidade', honorarios_em_aberto: 'Honorários', enviar_mensagem_cliente: 'Mensagem',
    emails_triados: 'E-mails', agenda_google: 'Agenda Google', contexto_do_caso: 'Contexto do caso', salvar_plano_do_caso: 'Plano do caso',
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


function CaseStart({ onClose, onStarted }) {
    const [cases, setCases] = useState([]);
    const [pid, setPid] = useState('');
    const [msg, setMsg] = useState('Vamos montar a estratégia deste caso.');
    const [busy, setBusy] = useState(false);
    useEffect(() => { casesApi.list().then((r) => setCases(Array.isArray(r) ? r : r?.resultados || [])).catch(() => setCases([])); }, []);
    const start = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { onStarted(await assistantApi.startCase(msg, pid)); } catch (err) {
            if (err.response?.data?.conversa) onStarted(err.response.data.conversa);
            toast.error(errorMessage(err));
        } finally { setBusy(false); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="case-title">
            <form className={styles.modal} onSubmit={start}>
                <div className={styles.modal_title} id="case-title">Estratégia de caso</div>
                <p className={styles.muted}>O assistente conduz: fatos, questões jurídicas, teses, provas, riscos, cenários e plano de ação — e salva o plano em Minutas.</p>
                <label className={styles.field}>Processo acompanhado (opcional)
                    <select className={styles.select} value={pid} onChange={(e) => setPid(e.target.value)}>
                        <option value="">Caso novo / sem processo ainda</option>
                        {cases.map((c) => <option key={c.id} value={c.id}>{c.label || c.cnj}{c.cliente?.nome ? ` — ${c.cliente.nome}` : ''}</option>)}
                    </select>
                </label>
                <label className={styles.field}>Primeira mensagem
                    <textarea className={styles.textarea} value={msg} maxLength={8000} onChange={(e) => setMsg(e.target.value)} />
                </label>
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || !msg.trim()}>{busy ? 'Analisando…' : 'Começar'}</button>
                    <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

function Settings({ status, onClose }) {
    const [form, setForm] = useState({ estrategia_de_caso: status.estrategia_de_caso, usa_memoria: status.usa_memoria });
    const save = async () => {
        try { await assistantApi.saveSettings(form); toast.success('Configurações salvas.'); onClose(); } catch (e) { toast.error(errorMessage(e)); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="cfg-title">
            <div className={styles.modal}>
                <div className={styles.modal_title} id="cfg-title">Configurações do assistente</div>
                <label className={styles.check_row}><input type="checkbox" checked={form.estrategia_de_caso} onChange={(e) => setForm({ ...form, estrategia_de_caso: e.target.checked })} />
                    Liberar o modo "estratégia de caso" para a equipe</label>
                <label className={styles.check_row}><input type="checkbox" checked={form.usa_memoria} onChange={(e) => setForm({ ...form, usa_memoria: e.target.checked })} />
                    Consultar a memória do escritório (o que a equipe ensinou ao Cadrius) em cada pergunta</label>
                <p className={styles.muted}>O conector para Claude/ChatGPT fica em Plugins.</p>
                <div className={styles.btn_row}>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={save}>Salvar</button>
                    <button type="button" className={styles.btn} onClick={onClose}>Cancelar</button>
                </div>
            </div>
        </div>
    );
}
