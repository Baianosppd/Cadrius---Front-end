import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, errorMessage } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import useLoader from '../gestao/useLoader';
import CobrancaModal from '../../components/integracoes/CobrancaModal';
import ClientFile from '../../components/carteira/ClientFile';
import { EMPTY_CONTACT, KINDS, channelStatus, contactBody, contactsApi, formatPhone } from '../../services/contacts';

function ContatoForm({ initial, onDone, onCancel, canDelete, onCharge, onFile }) {
    const [form, setForm] = useState({ ...EMPTY_CONTACT, ...initial, tags: (initial?.tags || []).join(', ') });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        setError('');
        try {
            const body = contactBody(form, initial || EMPTY_CONTACT);
            if (initial?.id) await contactsApi.update(initial.id, body); else await contactsApi.create(body);
            toast.success('Contato salvo.');
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    const remove = async () => {
        if (!window.confirm('Excluir este contato? Esta ação não pode ser desfeita.')) return;
        try { await contactsApi.remove(initial.id); toast.success('Contato excluído.'); onDone(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true">
            <form className={styles.modal} onSubmit={save}>
                <div className={styles.modal_title}>{initial?.id ? 'Editar contato' : 'Novo contato'}</div>
                <div className={styles.filters}>
                    <label className={styles.field} style={{ flex: 2 }}>Nome<input className={styles.input} value={form.name} onChange={set('name')} autoFocus /></label>
                    <label className={styles.field}>Tipo
                        <select className={styles.select} value={form.kind} onChange={set('kind')}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    </label>
                </div>
                <div className={styles.filters}>
                    <label className={styles.field}>CPF ou CNPJ<input className={styles.input} value={form.document} onChange={set('document')} /></label>
                    <label className={styles.field}>E-mail<input className={styles.input} type="email" value={form.email} onChange={set('email')} /></label>
                    <label className={styles.field}>Telefone / WhatsApp (com DDD)<input className={styles.input} value={form.phone} onChange={set('phone')} /></label>
                </div>
                <label className={styles.field}>Etiquetas (separe por vírgula)<input className={styles.input} value={form.tags} onChange={set('tags')} /></label>
                <label className={styles.field}>Observações<textarea className={styles.textarea} value={form.notes} onChange={set('notes')} /></label>
                <div className={styles.section_title} style={{ marginBottom: 0 }}>Consentimento para mensagens (LGPD)</div>
                <div className={styles.btn_row}>
                    <label className={styles.check_row}><input type="checkbox" checked={form.whatsapp_consent} onChange={set('whatsapp_consent')} /> Aceita WhatsApp</label>
                    <label className={styles.check_row}><input type="checkbox" checked={form.email_consent} onChange={set('email_consent')} /> Aceita e-mail</label>
                    <label className={styles.check_row}><input type="checkbox" checked={form.opted_out} onChange={set('opted_out')} /> Pediu para não receber</label>
                </div>
                <label className={styles.field}>Como o consentimento foi obtido (ex.: contrato assinado em 01/10)
                    <input className={styles.input} value={form.consent_source} onChange={set('consent_source')} maxLength={120} />
                </label>
                <p className={styles.muted}>As automações só enviam mensagens por um canal com consentimento e sem pedido de saída.</p>
                {error && <Banner tone="error">{error}</Banner>}
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>Salvar</button>
                    <button type="button" className={styles.btn} onClick={onCancel} disabled={busy}>Cancelar</button>
                    {initial?.id && onFile && initial.kind === 'cliente' && <button type="button" className={styles.btn} onClick={() => onFile(initial)}>Ficha e portal do cliente</button>}
                    {initial?.id && onCharge && <button type="button" className={styles.btn} onClick={() => onCharge(initial)}>Cobrar honorários</button>}
                    {initial?.id && canDelete && <button type="button" className={`${styles.btn} ${styles.btn_danger}`} onClick={remove}>Excluir</button>}
                </div>
            </form>
        </div>
    );
}

export default function Contatos() {
    const { role, isOrgManager } = useAuth();
    const canWrite = role !== 'VIEWER';
    const [term, setTerm] = useState('');
    const [query, setQuery] = useState({ q: '', kind: '', tag: '' });
    const [editing, setEditing] = useState(null);
    const [charging, setCharging] = useState(null);
    const [file, setFile] = useState(null);
    const { data, error, reload } = useLoader(() => contactsApi.list(query), [query.q, query.kind, query.tag]);
    return (
        <div className={styles.page}>
            <PageHeader title="Contatos" subtitle="Clientes, partes, testemunhas e parceiros — a base das automações"
                actions={canWrite && (<>
                    <Link to="/importar" className={styles.btn}>Importar planilha</Link>
                    <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={() => setEditing({})}>Novo contato</button>
                </>)} />
            <form className={styles.filters} onSubmit={(e) => { e.preventDefault(); setQuery((q) => ({ ...q, q: term.trim() })); }}>
                <label className={styles.field}>Buscar<input className={styles.input} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome, CPF/CNPJ, e-mail ou telefone" /></label>
                <label className={styles.field}>Tipo
                    <select className={styles.select} value={query.kind} onChange={(e) => setQuery((q) => ({ ...q, kind: e.target.value }))}>
                        <option value="">Todos</option>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                </label>
                <button type="submit" className={styles.btn}>Buscar</button>
            </form>
            {data?.tags?.length > 0 && (
                <div className={styles.btn_row}>
                    {data.tags.map((t) => (
                        <button key={t} type="button" className={styles.btn} style={query.tag === t ? { borderColor: 'var(--c-primary)', color: 'var(--c-primary)' } : undefined}
                            onClick={() => setQuery((q) => ({ ...q, tag: q.tag === t ? '' : t }))}>#{t}</button>
                    ))}
                </div>
            )}
            {error && <Banner tone="error">{error}</Banner>}
            {!data && !error && <Empty>Carregando…</Empty>}
            {data && (
                <div className={styles.table_wrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Nome</th><th>Tipo</th><th>Contato</th><th>Mensagens</th><th>Etiquetas</th></tr></thead>
                        <tbody>
                            {data.resultados.length === 0 && <tr><td colSpan={5}><Empty title="Sua carteira começa aqui">Cadastre os clientes ou importe a planilha do sistema antigo: eles viram destinatários das automações e do portal.</Empty></td></tr>}
                            {data.resultados.map((c) => {
                                const ch = channelStatus(c);
                                return (
                                    <tr key={c.id} onClick={() => canWrite && setEditing(c)} style={{ cursor: canWrite ? 'pointer' : 'default' }}>
                                        <td><strong>{c.name}</strong><div className={styles.muted}>{c.document || '—'}</div></td>
                                        <td>{c.kind_label}</td>
                                        <td>{c.email || '—'}<div className={styles.muted}>{formatPhone(c.phone)}</div></td>
                                        <td><Pill tone={ch.tone}>{ch.label}</Pill></td>
                                        <td>{c.tags.map((t) => <Pill key={t} tone="blue">{t}</Pill>)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
            {data && data.total > data.resultados.length && <div className={styles.muted}>Mostrando {data.resultados.length} de {data.total}. Refine a busca.</div>}
            {file && <ClientFile contact={file} onClose={() => setFile(null)} />}
            {charging && <CobrancaModal contact={charging} onClose={() => setCharging(null)} />}
            {editing && <ContatoForm initial={editing.id ? editing : null} canDelete={isOrgManager} onCharge={(c) => { setEditing(null); setCharging(c); }}
                onFile={(c) => { setEditing(null); setFile(c); }}
                onCancel={() => setEditing(null)} onDone={() => { setEditing(null); reload(); }} />}
        </div>
    );
}
