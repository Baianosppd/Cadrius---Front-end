import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, Pill, StatCard, errorMessage, fmtDateTime } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { FiCalendar, FiChevronLeft, FiChevronRight, FiList } from 'react-icons/fi';
import {
    AUTO_CHANNELS, CHANNELS, CHANNEL_COLOR, CHANNEL_LABEL, LEVEL_TONE, STATUS, groupByDay, monthGrid, parseHashtags, toLocalInput,
} from '../../services/marketing';
import PostPreview from './PostPreview';
import useAuth from '../../hooks/useAuth';

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Selo do canal com a cor da rede (identificação rápida)
function ChannelTag({ canal }) {
    return <span className={styles.channel_tag} style={{ '--ch': CHANNEL_COLOR[canal] || 'var(--c-muted)' }}>{CHANNEL_LABEL[canal] || canal}</span>;
}

// Calendário editorial do mês (CAD-219): cada dia mostra os conteúdos com a cor do canal
function Calendario({ items, onOpen }) {
    const now = new Date();
    const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() });
    const weeks = monthGrid(ym.y, ym.m, items);
    const raw = new Date(ym.y, ym.m, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const title = raw.charAt(0).toUpperCase() + raw.slice(1);
    const move = (d) => setYm(({ y, m }) => { const x = new Date(y, m + d, 1); return { y: x.getFullYear(), m: x.getMonth() }; });
    const today = now.toDateString();
    return (
        <div className={styles.cal}>
            <div className={styles.cal_head}>
                <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => move(-1)} aria-label="Mês anterior"><FiChevronLeft /></button>
                <strong className={styles.cal_title}>{title}</strong>
                <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => move(1)} aria-label="Próximo mês"><FiChevronRight /></button>
            </div>
            <div className={styles.cal_grid} role="grid" aria-label={`Calendário de ${title}`}>
                {WEEKDAYS.map((d) => <div key={d} className={styles.cal_wd} role="columnheader">{d}</div>)}
                {weeks.flat().map((c) => (
                    <div key={c.date.toISOString()} role="gridcell"
                        className={`${styles.cal_day} ${c.inMonth ? '' : styles.cal_out} ${c.date.toDateString() === today ? styles.cal_today : ''}`}>
                        <span className={styles.cal_num}>{c.day}</span>
                        {c.items.slice(0, 3).map((it) => (
                            <button key={it.id} type="button" className={styles.cal_item} style={{ '--ch': CHANNEL_COLOR[it.canal] || 'var(--c-muted)' }}
                                onClick={() => onOpen(it.id)} title={`${CHANNEL_LABEL[it.canal]}: ${it.titulo || it.tema}`}>
                                {it.titulo || it.tema}
                            </button>
                        ))}
                        {c.items.length > 3 && <span className={styles.cal_more}>+{c.items.length - 3}</span>}
                    </div>
                ))}
            </div>
        </div>
    );
}

function Alertas({ alertas }) {
    if (!alertas?.length) return <Banner tone="ok">Nenhum alerta encontrado pelo verificador.</Banner>;
    return (
        <div className={styles.stack} style={{ gap: 6 }}>
            {alertas.map((a, i) => (
                <div key={i} style={{ fontSize: '.85rem' }}>
                    <Pill tone={LEVEL_TONE[a.nivel] || 'gray'}>{a.nivel}</Pill> <strong>{a.regra}</strong>
                    {a.trecho && <span className={styles.muted}> — "{a.trecho}"</span>}
                    <div className={styles.muted}>{a.sugestao}</div>
                </div>
            ))}
        </div>
    );
}

// Editor de um conteúdo: texto, verificador ao vivo, imagem, agenda e ações de aprovação/publicação
function Editor({ api, id, canApprove, onClose, onChanged, brand }) {
    const [p, setP] = useState(null);
    const [form, setForm] = useState(null);
    const [alertas, setAlertas] = useState(null);
    const [revisei, setRevisei] = useState(false);
    const [busy, setBusy] = useState(false);
    const timer = useRef(null);
    useEffect(() => {
        api.get(id).then((x) => {
            setP(x);
            setAlertas(x.alertas);
            setForm({ titulo: x.titulo, texto: x.texto, hashtags: (x.hashtags || []).map((t) => `#${t}`).join(' '), imagem_url: x.imagem_url, agendado_para: toLocalInput(x.agendado_para) });
        }).catch((err) => toast.error(errorMessage(err)));
    }, [api, id]);
    const setText = (texto) => {
        setForm((f) => ({ ...f, texto }));
        clearTimeout(timer.current);
        timer.current = setTimeout(() => api.check(texto, p.canal).then((r) => setAlertas(r.alertas)).catch(() => {}), 600);
    };
    if (!p || !form) return null;
    const blocking = (alertas || []).some((a) => a.nivel === 'alto');
    const save = async (extra = {}, ok = 'Salvo.') => {
        setBusy(true);
        try {
            const body = { titulo: form.titulo, texto: form.texto, hashtags: parseHashtags(form.hashtags), imagem_url: form.imagem_url,
                agendado_para: form.agendado_para ? new Date(form.agendado_para).toISOString() : null, ...extra };
            if (blocking && revisei) body.revisei_alertas = true;
            const x = await api.update(p.id, body);
            setP(x); setAlertas(x.alertas); toast.success(ok); onChanged();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const publishNow = async () => {
        setBusy(true);
        try { const x = await api.publish(p.id); setP(x); toast.success('Publicado.'); onChanged(); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const copy = async () => {
        const tags = parseHashtags(form.hashtags).map((t) => `#${t}`).join(' ');
        try { await navigator.clipboard.writeText(tags ? `${form.texto}\n\n${tags}` : form.texto); toast.success('Texto copiado. Cole no app do canal.'); }
        catch { toast.error('Não foi possível copiar. Selecione o texto e copie manualmente.'); }
    };
    const [label, tone] = STATUS[p.status] || [p.status, 'gray'];
    const auto = AUTO_CHANNELS.includes(p.canal);
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="mkt-ed" onClick={onClose}>
            <div className={styles.modal} style={{ maxWidth: 980 }} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header_row} style={{ alignItems: 'center' }}>
                    <h2 id="mkt-ed" className={styles.modal_title}>{CHANNEL_LABEL[p.canal]} <Pill tone={tone}>{label}</Pill> {p.ia && <Pill tone="blue">IA</Pill>}</h2>
                    <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={onClose}>Fechar</button>
                </div>
                {p.erro && <Banner tone="warn">{p.erro}</Banner>}
                <div className={styles.two_col}>
                    <div className={styles.stack}>
                        <label className={styles.field}>Título / primeira linha
                            <input className={styles.input} value={form.titulo} maxLength={200} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
                        </label>
                        <label className={styles.field}>Texto
                            <textarea className={styles.textarea} style={{ minHeight: 260 }} value={form.texto} aria-label="Texto do conteúdo" onChange={(e) => setText(e.target.value)} />
                        </label>
                        <div className={styles.muted} style={{ fontSize: '.78rem', textAlign: 'right' }}>{form.texto.length} caracteres</div>
                        {['instagram', 'facebook', 'linkedin'].includes(p.canal) && (
                            <label className={styles.field}>Hashtags (até 8)
                                <input className={styles.input} value={form.hashtags} onChange={(e) => setForm({ ...form, hashtags: e.target.value })} placeholder="#direitodoconsumidor #cdc" />
                            </label>
                        )}
                    </div>
                    <div className={styles.stack}>
                        <div className={styles.card} style={{ background: 'var(--c-surface-2)' }}>
                            <div className={styles.section_title}>Verificador (OAB e LGPD)</div>
                            <Alertas alertas={alertas} />
                            {blocking && canApprove && (
                                <label className={styles.check_row} style={{ marginTop: 10 }}>
                                    <input type="checkbox" checked={revisei} onChange={(e) => setRevisei(e.target.checked)} />
                                    Revisei os alertas e assumo a responsabilidade pelo texto
                                </label>
                            )}
                        </div>
                        {p.sugestao_imagem && <p className={styles.muted} style={{ fontSize: '.84rem' }}>Sugestão de arte: {p.sugestao_imagem}</p>}
                        {auto && (
                            <label className={styles.field}>Imagem (URL pública https){p.canal === 'instagram' && ' — obrigatória no Instagram'}
                                <input className={styles.input} value={form.imagem_url} onChange={(e) => setForm({ ...form, imagem_url: e.target.value })} placeholder="https://…" />
                            </label>
                        )}
                        <div className={styles.section_title}>Como vai aparecer</div>
                        <PostPreview channel={p.canal} brand={brand} title={form.titulo} text={form.texto} hashtags={form.hashtags}
                            image={form.imagem_url} hint={p.sugestao_imagem} />
                        <label className={styles.field}>Data e hora da publicação
                            <input className={styles.input} type="datetime-local" value={form.agendado_para} onChange={(e) => setForm({ ...form, agendado_para: e.target.value })} />
                        </label>
                        <p className={styles.muted} style={{ fontSize: '.8rem' }}>
                            {auto ? 'Facebook e Instagram publicam sozinhos na hora agendada (com a conexão Meta em Integrações).'
                                : 'Este canal não publica sozinho: na hora agendada você recebe um lembrete e publica com o texto copiado.'}
                        </p>
                    </div>
                </div>
                <div className={styles.btn_row}>
                    {p.status !== 'publicado' && <button type="button" className={styles.btn} disabled={busy} onClick={() => save()}>Salvar</button>}
                    <button type="button" className={styles.btn} onClick={copy}>Copiar texto</button>
                    {canApprove && p.status === 'rascunho' && (
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || (blocking && !revisei)} onClick={() => save({ status: 'aprovado' }, 'Aprovado.')}>Aprovar</button>
                    )}
                    {canApprove && ['rascunho', 'aprovado'].includes(p.status) && (
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy || !form.agendado_para || (blocking && !revisei)}
                            onClick={() => save({ status: 'agendado' }, 'Agendado.')}>Agendar</button>
                    )}
                    {canApprove && auto && ['aprovado', 'agendado', 'falhou'].includes(p.status) && (
                        <button type="button" className={styles.btn} disabled={busy} onClick={publishNow}>Publicar agora</button>
                    )}
                    {canApprove && !auto && ['aprovado', 'agendado'].includes(p.status) && (
                        <button type="button" className={styles.btn} disabled={busy} onClick={() => save({ status: 'publicado' }, 'Marcado como publicado.')}>Já publiquei</button>
                    )}
                    <button type="button" className={`${styles.btn} ${styles.btn_ghost}`} style={{ color: 'var(--c-danger)', marginLeft: 'auto' }}
                        onClick={() => window.confirm('Excluir este conteúdo?') && api.remove(p.id).then(() => { onChanged(); onClose(); })}>Excluir</button>
                </div>
            </div>
        </div>
    );
}

function Criar({ api, scope, ideas, campaigns, onCreated }) {
    const [form, setForm] = useState({ canal: 'instagram', tema: '', orientacoes: '', usar_ia: true, campanha_id: '' });
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const x = await api.generate({ ...form, campanha_id: form.campanha_id || null });
            toast.success(x.ia ? 'Rascunho criado com IA. Revise antes de aprovar.' : 'Esqueleto criado. Complete os trechos [COMPLETAR].');
            if (x.aviso) toast.info(x.aviso);
            setForm((f) => ({ ...f, tema: '', orientacoes: '' }));
            onCreated(x.id);
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const pick = (tema) => setForm((f) => ({ ...f, tema }));
    return (
        <div className={styles.two_col}>
            <form className={`${styles.card} ${styles.stack}`} onSubmit={submit}>
                <div className={styles.section_title} style={{ marginBottom: 0 }}>Novo conteúdo</div>
                <label className={styles.field}>Canal
                    <select className={styles.select} value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })}>
                        {CHANNELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                </label>
                <label className={styles.field}>Tema
                    <input className={styles.input} value={form.tema} maxLength={200} required onChange={(e) => setForm({ ...form, tema: e.target.value })}
                        placeholder={scope === 'cadrius' ? 'Ex.: como evitar perder prazos do DJEN' : 'Ex.: prazo para reclamar de produto com defeito'} />
                </label>
                <label className={styles.field}>Orientações (opcional)
                    <textarea className={styles.textarea} value={form.orientacoes} maxLength={1000} onChange={(e) => setForm({ ...form, orientacoes: e.target.value })}
                        placeholder="Público, enfoque, exemplo a usar…" />
                </label>
                {campaigns.length > 0 && (
                    <label className={styles.field}>Campanha
                        <select className={styles.select} value={form.campanha_id} onChange={(e) => setForm({ ...form, campanha_id: e.target.value })}>
                            <option value="">— nenhuma —</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </select>
                    </label>
                )}
                <label className={styles.check_row}><input type="checkbox" checked={form.usar_ia} onChange={(e) => setForm({ ...form, usar_ia: e.target.checked })} />
                    Escrever com IA {scope === 'escritorio' && '(usa créditos; segue as regras da OAB e o perfil do escritório)'}</label>
                <button className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{busy ? 'Gerando…' : 'Gerar rascunho'}</button>
            </form>
            <div className={`${styles.card} ${styles.stack}`}>
                <div className={styles.section_title} style={{ marginBottom: 0 }}>Ideias de pauta</div>
                {(ideas?.datas || []).length > 0 && (
                    <div className={styles.stack} style={{ gap: 6 }}>
                        <div className={styles.muted} style={{ fontSize: '.8rem' }}>Próximas datas</div>
                        {ideas.datas.slice(0, 5).map((d) => (
                            <button key={d.data + d.tema} type="button" className={styles.chip} style={{ justifyContent: 'flex-start', textAlign: 'left', whiteSpace: 'normal' }} onClick={() => pick(d.tema)}>
                                <strong>{new Date(`${d.data}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</strong> {d.ocasiao}: {d.tema}
                            </button>
                        ))}
                    </div>
                )}
                <div className={styles.muted} style={{ fontSize: '.8rem' }}>Temas sempre úteis</div>
                <div className={styles.btn_row}>
                    {(ideas?.temas || []).slice(0, 12).map((t) => (
                        <button key={t.tema} type="button" className={styles.chip} title={t.angulo || ''} onClick={() => pick(t.tema)}>{t.tema}</button>
                    ))}
                </div>
                {scope === 'escritorio' && <p className={styles.muted} style={{ fontSize: '.8rem' }}>As áreas vêm do Perfil do escritório (IA do escritório → Perfil).</p>}
            </div>
        </div>
    );
}

function Campanhas({ api, campaigns, reload }) {
    const [form, setForm] = useState({ nome: '', objetivo: '', publico: '', inicio: '', fim: '', canais: [] });
    const add = async (e) => {
        e.preventDefault();
        try { await api.addCampaign(form); toast.success('Campanha criada.'); setForm({ nome: '', objetivo: '', publico: '', inicio: '', fim: '', canais: [] }); reload(); }
        catch (err) { toast.error(errorMessage(err)); }
    };
    const toggle = (k) => setForm((f) => ({ ...f, canais: f.canais.includes(k) ? f.canais.filter((c) => c !== k) : [...f.canais, k] }));
    return (
        <div className={styles.stack}>
            <form className={`${styles.card} ${styles.stack}`} onSubmit={add}>
                <div className={styles.filters}>
                    <label className={styles.field}>Nome<input className={styles.input} value={form.nome} required onChange={(e) => setForm({ ...form, nome: e.target.value })} /></label>
                    <label className={styles.field}>Objetivo<input className={styles.input} value={form.objetivo} onChange={(e) => setForm({ ...form, objetivo: e.target.value })} /></label>
                    <label className={styles.field}>Público<input className={styles.input} value={form.publico} onChange={(e) => setForm({ ...form, publico: e.target.value })} /></label>
                    <label className={styles.field}>Início<input className={styles.input} type="date" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: e.target.value })} /></label>
                    <label className={styles.field}>Fim<input className={styles.input} type="date" value={form.fim} onChange={(e) => setForm({ ...form, fim: e.target.value })} /></label>
                </div>
                <div className={styles.btn_row}>
                    {CHANNELS.map(([k, l]) => <button key={k} type="button" className={`${styles.chip} ${form.canais.includes(k) ? styles.chip_active : ''}`} aria-pressed={form.canais.includes(k)} onClick={() => toggle(k)}>{l}</button>)}
                </div>
                <div><button className={`${styles.btn} ${styles.btn_primary}`}>Criar campanha</button></div>
            </form>
            {campaigns.length === 0 && <Empty title="Nenhuma campanha ainda">Agrupe conteúdos de um mesmo objetivo (ex.: "Mês do consumidor").</Empty>}
            <div className={styles.card_grid}>
                {campaigns.map((c) => (
                    <div key={c.id} className={styles.card}>
                        <strong>{c.nome}</strong>
                        <div className={styles.muted} style={{ fontSize: '.84rem' }}>{c.objetivo}</div>
                        <div style={{ margin: '6px 0' }}>{c.canais.map((k) => <Pill key={k} tone="blue">{CHANNEL_LABEL[k]}</Pill>)}</div>
                        <div className={styles.muted} style={{ fontSize: '.8rem' }}>{c.conteudos} conteúdo(s)</div>
                        <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} style={{ color: 'var(--c-danger)', marginTop: 8 }}
                            onClick={() => window.confirm(`Excluir a campanha "${c.nome}"? Os conteúdos ficam.`) && api.removeCampaign(c.id).then(reload)}>Excluir</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

function Indicadores({ api }) {
    const { data, error } = useLoader(() => api.growth(), []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Empty>Carregando…</Empty>;
    const max = Math.max(1, ...data.por_semana.map((w) => w.cadastros));
    return (
        <div className={styles.stack}>
            <div className={styles.grid}>
                <StatCard title={`Cadastros (${data.periodo_dias} dias)`} value={data.cadastros} />
                <StatCard title="Em teste" value={data.em_teste} />
                <StatCard title="Pagantes" value={data.pagantes} note={data.conversao_pct !== null ? `${data.conversao_pct}% de conversão` : ''} />
                <StatCard title="Conteúdos publicados" value={data.conteudos_publicados} />
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Cadastros por semana</div>
                {data.por_semana.length === 0 ? <Empty>Sem cadastros no período.</Empty> : data.por_semana.map((w) => (
                    <div key={w.semana} style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0', fontSize: '.84rem' }}>
                        <span style={{ width: 70 }}>{w.semana.slice(8, 10)}/{w.semana.slice(5, 7)}</span>
                        <div className={styles.bar} style={{ flex: 1 }}><div className={styles.bar_fill} style={{ width: `${(100 * w.cadastros) / max}%` }} /></div>
                        <span style={{ width: 90, textAlign: 'right' }}>{w.cadastros} ({w.pagantes} pag.)</span>
                    </div>
                ))}
            </div>
            <div className={styles.card}>
                <div className={styles.section_title}>Playbook de aquisição</div>
                {data.playbook.map((p) => (
                    <div key={p.acao} className={styles.kv} style={{ flexDirection: 'column', gap: 2 }}>
                        <strong>{p.acao} <Pill tone="blue">{p.canal}</Pill></strong><span className={styles.muted}>{p.por_que}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

// Estúdio de marketing (CAD-174): agenda editorial, criação com IA + verificador, campanhas e (Cadrius) indicadores
export default function MarketingStudio({ api, scope, canWrite, canApprove }) {
    const tabs = [['agenda', 'Agenda'], ...(canWrite ? [['criar', 'Criar conteúdo']] : []), ['campanhas', 'Campanhas'], ...(scope === 'cadrius' ? [['indicadores', 'Indicadores']] : [])];
    const [tab, setTab] = useState('agenda');
    const [view, setView] = useState('lista');
    const { user } = useAuth();
    const brand = scope === 'cadrius' ? 'Cadrius' : (user?.organization?.name || 'Seu escritório');
    const [status, setStatus] = useState('');
    const [open, setOpen] = useState(null);
    const list = useLoader(() => api.list(status ? { status } : {}), [status]);
    const extra = useLoader(() => Promise.all([api.ideas(), api.campaigns()]), []);
    const [ideas, campaigns] = extra.data || [null, []];
    const counts = list.data?.contagem || {};
    return (
        <div className={styles.stack}>
            <div className={styles.tabs} role="tablist">
                {tabs.map(([k, label]) => (
                    <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${styles.tab} ${tab === k ? styles.tab_active : ''}`} onClick={() => setTab(k)}>{label}</button>
                ))}
            </div>
            {tab === 'agenda' && (
                <div className={styles.stack}>
                    <div className={styles.toolbar}>
                    <div className={styles.btn_row} role="group" aria-label="Filtrar por situação">
                        <button type="button" className={`${styles.chip} ${!status ? styles.chip_active : ''}`} onClick={() => setStatus('')}>Todos</button>
                        {Object.entries(STATUS).map(([k, [l]]) => (
                            <button key={k} type="button" className={`${styles.chip} ${status === k ? styles.chip_active : ''}`} aria-pressed={status === k} onClick={() => setStatus(k)}>
                                {l} <span className={styles.count}>{counts[k] ?? 0}</span>
                            </button>
                        ))}
                    </div>
                    <div className={styles.segmented} role="group" aria-label="Visualização">
                        <button type="button" aria-pressed={view === 'lista'} className={view === 'lista' ? styles.seg_on : ''} onClick={() => setView('lista')}><FiList /> Lista</button>
                        <button type="button" aria-pressed={view === 'calendario'} className={view === 'calendario' ? styles.seg_on : ''} onClick={() => setView('calendario')}><FiCalendar /> Calendário</button>
                    </div>
                    </div>
                    {list.error && <Banner tone="error">{list.error}</Banner>}
                    {list.data && view === 'calendario' && <Calendario items={list.data.resultados} onOpen={setOpen} />}
                    {list.data && view === 'lista' && list.data.resultados.length === 0 && (
                        <Empty title="Sua agenda de conteúdo está vazia">{canWrite ? 'Use "Criar conteúdo": a IA escreve o rascunho dentro das regras da OAB e você revisa.' : 'Nenhum conteúdo.'}</Empty>
                    )}
                    {list.data && view === 'lista' && groupByDay(list.data.resultados).map(([day, items]) => (
                        <div key={day} className={styles.stack} style={{ gap: 8 }}>
                            <div className={styles.muted} style={{ fontSize: '.8rem', fontWeight: 700, textTransform: 'uppercase' }}>{day}</div>
                            {items.map((c) => {
                                const [label, tone] = STATUS[c.status] || [c.status, 'gray'];
                                return (
                                    <button key={c.id} type="button" className={styles.card} onClick={() => setOpen(c.id)}
                                        style={{ textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', font: 'inherit' }}>
                                        <ChannelTag canal={c.canal} />
                                        <strong style={{ flex: '1 1 220px', minWidth: 0 }}>{c.titulo || c.tema}</strong>
                                        {c.bloqueado && <Pill tone="red">alertas OAB</Pill>}
                                        <Pill tone={tone}>{label}</Pill>
                                        <span className={styles.muted} style={{ fontSize: '.8rem' }}>{c.agendado_para ? fmtDateTime(c.agendado_para) : 'sem data'}</span>
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}
            {tab === 'criar' && <Criar api={api} scope={scope} ideas={ideas} campaigns={campaigns} onCreated={(id) => { list.reload(); setOpen(id); setTab('agenda'); }} />}
            {tab === 'campanhas' && <Campanhas api={api} campaigns={campaigns} reload={extra.reload} />}
            {tab === 'indicadores' && <Indicadores api={api} />}
            {open && <Editor api={api} id={open} brand={brand} canApprove={canApprove} onClose={() => setOpen(null)} onChanged={() => list.reload()} />}
        </div>
    );
}
