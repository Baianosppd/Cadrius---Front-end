import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiCalendar, FiList } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import m from './Marketing.module.css';
import { Banner, Chip, Empty, Pill, Row, Segmented, Stack, Tabs } from '../ui';
import { fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import useAuth from '../../hooks/useAuth';
import { STATUS, groupByDay } from '../../services/marketing';
import { mediaAddon } from '../../services/billing';
import ChannelTag from './ChannelTag';
import Calendario from './Calendario';
import ConteudoEditor from './ConteudoEditor';
import CriarConteudo from './CriarConteudo';
import Campanhas from './Campanhas';
import Indicadores from './Indicadores';

const VIEWS = [{ id: 'lista', label: 'Lista', icon: FiList }, { id: 'calendario', label: 'Calendário', icon: FiCalendar }];

// Estúdio de marketing (CAD-174): agenda editorial, criação com IA + verificador, campanhas e (Cadrius) indicadores
export default function MarketingStudio({ api, scope, canWrite, canApprove }) {
    const tabs = [
        { id: 'agenda', label: 'Agenda' },
        ...(canWrite ? [{ id: 'criar', label: 'Criar conteúdo' }] : []),
        { id: 'campanhas', label: 'Campanhas' },
        ...(scope === 'cadrius' ? [{ id: 'indicadores', label: 'Indicadores' }] : []),
    ];
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
    // CAD-231: adicional de mídia com IA (a Gestão Cadrius sempre pode)
    const [addon, setAddon] = useState(scope === 'cadrius' ? { ativo: true } : null);
    useEffect(() => {
        if (scope === 'cadrius') return;
        mediaAddon.status().then(setAddon).catch(() => setAddon({ ativo: false }));
        const q = new URLSearchParams(window.location.search).get('addon');
        if (q === 'success') toast.success('Adicional contratado. Assim que o pagamento confirmar, a IA de imagem e vídeo libera aqui.');
        if (q) window.history.replaceState(null, '', window.location.pathname);
    }, [scope]);
    return (
        <Stack>
            <Tabs tabs={tabs} value={tab} onChange={setTab} />
            {tab === 'agenda' && (
                <Stack>
                    <div className={styles.toolbar}>
                        <Row role="group" aria-label="Filtrar por situação">
                            <Chip active={!status} onClick={() => setStatus('')}>Todos</Chip>
                            {Object.entries(STATUS).map(([k, [l]]) => (
                                <Chip key={k} active={status === k} onClick={() => setStatus(k)}>
                                    {l} <span className={styles.count}>{counts[k] ?? 0}</span>
                                </Chip>
                            ))}
                        </Row>
                        <Segmented options={VIEWS} value={view} onChange={setView} aria-label="Visualização" />
                    </div>
                    {list.error && <Banner tone="error">{list.error}</Banner>}
                    {list.data && view === 'calendario' && <Calendario items={list.data.resultados} onOpen={setOpen} />}
                    {list.data && view === 'lista' && list.data.resultados.length === 0 && (
                        <Empty title="Sua agenda de conteúdo está vazia">{canWrite ? 'Use "Criar conteúdo": a IA escreve o rascunho dentro das regras da OAB e você revisa.' : 'Nenhum conteúdo.'}</Empty>
                    )}
                    {list.data && view === 'lista' && groupByDay(list.data.resultados).map(([day, items]) => (
                        <Stack key={day} gap={2}>
                            <div className={styles.eyebrow}>{day}</div>
                            {items.map((c) => {
                                const [label, tone] = STATUS[c.status] || [c.status, 'gray'];
                                return (
                                    <button key={c.id} type="button" className={`${styles.card} ${m.post_btn}`} onClick={() => setOpen(c.id)}>
                                        <ChannelTag canal={c.canal} />
                                        <strong className={m.post_title}>{c.titulo || c.tema}</strong>
                                        {c.bloqueado && <Pill tone="red">alertas OAB</Pill>}
                                        <Pill tone={tone}>{label}</Pill>
                                        <span className={`${styles.muted} ${styles.text_xs}`}>{c.agendado_para ? fmtDateTime(c.agendado_para) : 'sem data'}</span>
                                    </button>
                                );
                            })}
                        </Stack>
                    ))}
                </Stack>
            )}
            {tab === 'criar' && <CriarConteudo api={api} scope={scope} ideas={ideas} campaigns={campaigns} onCreated={(id) => { list.reload(); setOpen(id); setTab('agenda'); }} />}
            {tab === 'campanhas' && <Campanhas api={api} campaigns={campaigns} reload={extra.reload} />}
            {tab === 'indicadores' && <Indicadores api={api} />}
            {open && <ConteudoEditor api={api} id={open} brand={brand} addon={addon} canApprove={canApprove} onClose={() => setOpen(null)} onChanged={() => list.reload()} />}
        </Stack>
    );
}
