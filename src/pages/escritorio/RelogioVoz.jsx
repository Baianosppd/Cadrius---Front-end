import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiBell, FiCheckCircle, FiCopy, FiMic, FiPlus, FiWatch, FiZap } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ui from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, fmtDateTime, Loading, PageHeader, Pill } from '../../components/seguranca/ui';
import useLoader from '../gestao/useLoader';
import { DEVICE_GUIDES, NOTIFY_GUIDE, QUICK_TRIES, VOICE_COMMANDS, devicesApi } from '../../services/devices';
import s from './RelogioVoz.module.css';

function Copy({ value, label }) {
    const copy = async () => { try { await navigator.clipboard.writeText(value); toast.success('Copiado.'); } catch { toast.error('Selecione e copie.'); } };
    return (
        <div className={s.copy}>
            <span className={s.copy_label}>{label}</span>
            <code>{value}</code>
            <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={copy}><FiCopy aria-hidden="true" /> Copiar</button>
        </div>
    );
}

function AddDevice({ info, onClose, onCreated }) {
    const [form, setForm] = useState({ nome: 'Meu Apple Watch', tipo: 'apple', aprova: info.pode_aprovar, avisos: false });
    const [created, setCreated] = useState(null);
    const [busy, setBusy] = useState(false);
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { const r = await devicesApi.create(form); setCreated(r); onCreated(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const guide = DEVICE_GUIDES[created?.tipo || form.tipo];
    return (
        <div className={ui.overlay} role="dialog" aria-modal="true" aria-labelledby="dev-title">
            <div className={ui.modal} style={{ maxWidth: 680, width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
                <div id="dev-title" className={ui.modal_title}><FiWatch aria-hidden="true" /> {created ? `${created.nome} pronto` : 'Adicionar aparelho'}</div>
                {!created ? (
                    <form onSubmit={save} className={ui.stack}>
                        <div className={ui.filters}>
                            <label className={ui.field}>Nome<input className={ui.input} maxLength={60} value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
                            <label className={ui.field}>Tipo
                                <select className={ui.select} value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
                                    {info.tipos.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </label>
                        </div>
                        <label className={ui.check_row}>
                            <input type="checkbox" checked={form.aprova} disabled={!info.pode_aprovar} onChange={(e) => setForm({ ...form, aprova: e.target.checked })} />
                            <span><strong>Aprovar envios por este aparelho</strong><br /><span className={ui.muted}>
                                {info.pode_aprovar ? 'Você aprova dizendo o código de 4 dígitos do envio. Sem o código, nada é aprovado.' : 'O seu cargo não aprova envios.'}</span></span>
                        </label>
                        <label className={ui.check_row}>
                            <input type="checkbox" checked={form.avisos} onChange={(e) => setForm({ ...form, avisos: e.target.checked })} />
                            <span><strong>Avisar no relógio quando houver envio para aprovar</strong><br /><span className={ui.muted}>
                                Pelo app gratuito ntfy, com os botões Aprovar e Recusar. O aviso mostra só a regra e o código, nunca o nome do cliente.</span></span>
                        </label>
                        <div className={ui.btn_row} style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className={ui.btn} onClick={onClose}>Cancelar</button>
                            <button type="submit" className={`${ui.btn} ${ui.btn_primary}`} disabled={busy || !form.nome.trim()}>Gerar a chave do aparelho</button>
                        </div>
                    </form>
                ) : (
                    <div className={ui.stack}>
                        <Banner tone="warn">Guarde agora: por segurança o link não aparece de novo. Se perder, remova o aparelho e cadastre outro.</Banner>
                        <Copy label="Link de voz (POST com o campo texto)" value={created.url_voz} />
                        {created.url_avisos && <Copy label="Tópico de avisos (assine no app ntfy)" value={created.url_avisos} />}
                        <div className={ui.section_title}>{guide.titulo}: passo a passo</div>
                        <ol className={s.steps}>{guide.passos.map((p) => <li key={p}>{p}</li>)}</ol>
                        {created.url_avisos && (<>
                            <div className={ui.section_title}>Avisos no relógio</div>
                            <ol className={s.steps}>{NOTIFY_GUIDE.map((p) => <li key={p}>{p}</li>)}</ol>
                        </>)}
                        <div className={ui.btn_row} style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={onClose}>Concluir</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// Relógio e voz (CAD-227): o Cadrius no pulso — aprovar, perguntar a agenda, anotar e disparar atalhos falando
export default function RelogioVoz() {
    const { data, error, reload } = useLoader(() => devicesApi.list(), []);
    const [adding, setAdding] = useState(false);
    const [text, setText] = useState('');
    const [answer, setAnswer] = useState(null);
    const tryIt = async (t) => {
        const texto = (t ?? text).trim();
        if (!texto) return;
        setText(texto);
        try { setAnswer(await devicesApi.test(texto)); } catch (err) { toast.error(errorMessage(err)); }
    };
    const remove = async (d) => {
        if (!window.confirm(`Remover "${d.nome}"? O link dele para de funcionar na hora.`)) return;
        try { await devicesApi.remove(d.id); toast.success('Aparelho removido.'); reload(); } catch (err) { toast.error(errorMessage(err)); }
    };
    if (error) return <div className={ui.page}><Banner tone="error">{error}</Banner></div>;
    return (
        <div className={ui.page}>
            <PageHeader title="Relógio e voz" subtitle="Comandos de voz e aprovação pelo relógio"
                actions={data && <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={() => setAdding(true)}><FiPlus aria-hidden="true" /> Adicionar aparelho</button>} />
            <div className={s.benefits}>
                <div className={s.benefit}><FiCheckCircle aria-hidden="true" /><div><strong>Aprove pelo relógio</strong><span>Diga "pendências" e "aprovar" com o código. Na audiência, sem abrir o computador.</span></div></div>
                <div className={s.benefit}><FiMic aria-hidden="true" /><div><strong>Fale com o Cadrius</strong><span>"Agenda de hoje", "lembrete ligar para a Maria amanhã".</span></div></div>
                <div className={s.benefit}><FiZap aria-hidden="true" /><div><strong>Frases que disparam regras</strong><span>"Cheguei ao fórum" avisa a equipe e cria a tarefa. <Link to="/automacao?aba=regras">Criar atalho</Link></span></div></div>
            </div>
            <section className={ui.card} aria-labelledby="meus-ap">
                <div className={ui.header_row} style={{ alignItems: 'center' }}>
                    <div id="meus-ap" className={ui.section_title} style={{ margin: 0 }}>Meus aparelhos</div>
                    {data?.pendentes > 0 && <Pill tone="yellow">{data.pendentes} envio(s) aguardando aprovação</Pill>}
                </div>
                {!data && <Loading />}
                {data && data.aparelhos.length === 0 && (
                    <Empty title="Nenhum aparelho ainda">Adicione o relógio ou o celular: leva 3 minutos e o passo a passo aparece na tela.</Empty>
                )}
                {data?.aparelhos.map((d) => (
                    <div key={d.id} className={ui.list_row}>
                        <div>
                            <strong>{d.nome}</strong> <span className={ui.muted}>· {d.tipo_label}</span>{' '}
                            {d.aprova && <Pill tone="green">aprova</Pill>} {d.avisos && <Pill tone="blue"><FiBell aria-hidden="true" /> avisos</Pill>}
                            <div className={ui.muted} style={{ fontSize: '.85rem' }}>{d.ultimo_uso ? `Último uso ${fmtDateTime(d.ultimo_uso)}` : 'Ainda não usado'}</div>
                        </div>
                        <button type="button" className={`${ui.btn} ${ui.btn_sm} ${ui.btn_ghost}`} style={{ color: 'var(--c-danger)' }} onClick={() => remove(d)}>Remover</button>
                    </div>
                ))}
            </section>
            <div className={ui.two_col}>
                <section className={ui.card} aria-labelledby="exp-title">
                    <div id="exp-title" className={ui.section_title}>Experimente um comando</div>
                    <p className={ui.muted} style={{ marginTop: 0 }}>Teste aqui o que o relógio vai responder. Consultas rodam de verdade; aprovações e lembretes só dizem o que fariam.</p>
                    <form className={ui.btn_row} onSubmit={(e) => { e.preventDefault(); tryIt(); }}>
                        <input className={ui.input} style={{ flex: 1, minWidth: 200 }} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: pendências" aria-label="Comando" />
                        <button type="submit" className={`${ui.btn} ${ui.btn_primary}`}>Testar</button>
                    </form>
                    <div className={ui.btn_row} style={{ marginTop: 8, gap: 6 }}>
                        {QUICK_TRIES.map((q) => <button key={q} type="button" className={ui.chip} onClick={() => tryIt(q)}>{q}</button>)}
                    </div>
                    {answer && (
                        <div className={s.watch} aria-live="polite">
                            <div className={s.watch_face}><FiWatch aria-hidden="true" /> {answer.fala}</div>
                        </div>
                    )}
                </section>
                <section className={ui.card} aria-labelledby="cmd-title">
                    <div id="cmd-title" className={ui.section_title}>O que dá para dizer</div>
                    <dl className={s.cmds}>
                        {VOICE_COMMANDS.map((c) => <div key={c.dizer}><dt>"{c.dizer}"</dt><dd>{c.faz}</dd></div>)}
                    </dl>
                </section>
            </div>
            <p className={ui.muted} style={{ fontSize: '.85rem' }}>Segurança: cada aparelho tem a própria chave (só o hash fica guardado), funciona só enquanto você está no escritório
                e pode ser removido a qualquer momento. Tudo fica na auditoria, sem o texto falado.</p>
            {adding && data && <AddDevice info={data} onClose={() => setAdding(false)} onCreated={reload} />}
        </div>
    );
}
