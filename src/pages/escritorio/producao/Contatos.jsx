import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../../components/ui/ui.module.css';
import { Banner, Button, Checkbox, Chip, Empty, Field, FilterBar, FormModal, Input, PageHeader, Pill, Row, Select, Table, Textarea } from '../../../components/ui';
import { errorMessage } from '../../../utils/format';
import useAuth from '../../../hooks/useAuth';
import useLoader from '../../../hooks/useLoader';
import useSubmit from '../../../hooks/useSubmit';
import CobrancaModal from '../../../components/integracoes/CobrancaModal';
import ClientFile from '../../../components/carteira/ClientFile';
import { EMPTY_CONTACT, KINDS, birthdayToInput, channelStatus, contactBody, contactsApi, formatPhone } from '../../../services/contacts';
import { cnpjApi } from '../../../services/cad223';

function ContatoForm({ initial, onDone, onCancel, canDelete, onCharge, onFile }) {
    const [form, setForm] = useState({ ...EMPTY_CONTACT, ...initial, tags: (initial?.tags || []).join(', '), birthday: birthdayToInput(initial?.birthday) });
    const digits = String(form.document || '').replace(/\D/g, '');
    const lookup = async () => {
        try {
            const d = await cnpjApi.lookup(digits);
            setForm((f) => ({ ...f, name: f.name || d.nome_fantasia || d.razao_social, phone: f.phone || d.telefone, email: f.email || d.email,
                notes: [f.notes, `${d.razao_social} — ${d.situacao}. ${d.atividade}. ${d.endereco} ${d.municipio}/${d.uf}`.trim()].filter(Boolean).join('\n') }));
            toast.success(`Dados da Receita: ${d.razao_social} (${d.situacao}).`);
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const { busy, error, submit } = useSubmit(async () => {
        const body = contactBody(form, initial || EMPTY_CONTACT);
        if (initial?.id) await contactsApi.update(initial.id, body); else await contactsApi.create(body);
    }, { ok: 'Contato salvo.', onDone });
    const remove = async () => {
        if (!window.confirm('Excluir este contato? Esta ação não pode ser desfeita.')) return;
        try { await contactsApi.remove(initial.id); toast.success('Contato excluído.'); onDone(); } catch (err) { toast.error(errorMessage(err)); }
    };
    return (
        <FormModal title={initial?.id ? 'Editar contato' : 'Novo contato'} size="lg" onClose={onCancel} onSubmit={submit} busy={busy} error={error}
            actions={initial?.id && <>
                {onFile && initial.kind === 'cliente' && <Button onClick={() => onFile(initial)}>Ficha e portal do cliente</Button>}
                {onCharge && <Button onClick={() => onCharge(initial)}>Cobrar honorários</Button>}
                {canDelete && <Button variant="danger" onClick={remove}>Excluir</Button>}
            </>}>
            <FilterBar>
                <Field label="Nome" className={styles.flex_2}><Input value={form.name} onChange={set('name')} /></Field>
                <Field label="Tipo">
                    <Select value={form.kind} onChange={set('kind')}>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>
                </Field>
            </FilterBar>
            <FilterBar>
                <Field label="CPF ou CNPJ">
                    <Input value={form.document} onChange={set('document')} />
                    {digits.length === 14 && <Button size="sm" variant="ghost" onClick={lookup}>Buscar na Receita</Button>}
                </Field>
                <Field label="E-mail"><Input type="email" value={form.email} onChange={set('email')} /></Field>
                <Field label="Telefone / WhatsApp (com DDD)"><Input value={form.phone} onChange={set('phone')} /></Field>
            </FilterBar>
            <FilterBar>
                <Field label="Etiquetas (separe por vírgula)" className={styles.flex_2}><Input value={form.tags} onChange={set('tags')} /></Field>
                <Field label="Aniversário (dia/mês)"><Input value={form.birthday} onChange={set('birthday')} placeholder="06/03" maxLength={10} /></Field>
            </FilterBar>
            <Field label="Observações"><Textarea value={form.notes} onChange={set('notes')} /></Field>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Consentimento para mensagens (LGPD)</div>
            <Row gap={4}>
                <Checkbox checked={form.whatsapp_consent} onChange={set('whatsapp_consent')}>Aceita WhatsApp</Checkbox>
                <Checkbox checked={form.email_consent} onChange={set('email_consent')}>Aceita e-mail</Checkbox>
                <Checkbox checked={form.opted_out} onChange={set('opted_out')}>Pediu para não receber</Checkbox>
            </Row>
            <Field label="Como o consentimento foi obtido (ex.: contrato assinado em 01/10)"
                hint="As automações só enviam mensagens por um canal com consentimento e sem pedido de saída.">
                <Input value={form.consent_source} onChange={set('consent_source')} maxLength={120} />
            </Field>
        </FormModal>
    );
}

export default function Contatos() {
    const { role, isOrgManager } = useAuth();
    const canWrite = role !== 'VIEWER';
    const [term, setTerm] = useState('');
    const [query, setQuery] = useState({ q: '', kind: '', tag: '' });
    const [params] = useSearchParams();
    const [editing, setEditing] = useState(() => (params.get('novo') ? {} : null));
    const abrir = params.get('abrir');
    // Atalho da busca global (Ctrl+K): /contatos?abrir=<id> abre o contato direto
    useEffect(() => {
        if (abrir) contactsApi.get(abrir).then(setEditing).catch(() => {});
    }, [abrir]);
    const [charging, setCharging] = useState(null);
    const [file, setFile] = useState(null);
    const { data, error, reload } = useLoader(() => contactsApi.list(query), [query.q, query.kind, query.tag]);
    // Linha da tabela abre o contato no clique ou com Enter (quem só lê não abre)
    const open = (c) => canWrite && setEditing(c);
    return (
        <div className={styles.page}>
            <PageHeader title="Contatos" subtitle="Clientes, partes e parceiros"
                actions={canWrite && (<>
                    <Button as={Link} to="/importar">Importar planilha</Button>
                    <Button variant="primary" onClick={() => setEditing({})}>Novo contato</Button>
                </>)} />
            <FilterBar as="form" onSubmit={(e) => { e.preventDefault(); setQuery((q) => ({ ...q, q: term.trim() })); }}>
                <Field label="Buscar"><Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome, CPF/CNPJ, e-mail ou telefone" /></Field>
                <Field label="Tipo">
                    <Select value={query.kind} onChange={(e) => setQuery((q) => ({ ...q, kind: e.target.value }))}>
                        <option value="">Todos</option>{KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </Select>
                </Field>
                <Button type="submit">Buscar</Button>
            </FilterBar>
            {data?.tags?.length > 0 && (
                <Row>
                    {data.tags.map((t) => (
                        <Chip key={t} active={query.tag === t} onClick={() => setQuery((q) => ({ ...q, tag: q.tag === t ? '' : t }))}>#{t}</Chip>
                    ))}
                </Row>
            )}
            {error && <Banner tone="error">{error}</Banner>}
            {!error && (
                <Table columns={['Nome', 'Tipo', 'Contato', 'Mensagens', 'Etiquetas']} loading={!data}
                    empty={data?.resultados.length === 0 && <Empty title="Sua carteira começa aqui">Cadastre os clientes ou importe a planilha do sistema antigo: eles viram destinatários das automações e do portal.</Empty>}>
                    {data?.resultados.map((c) => {
                        const ch = channelStatus(c);
                        return (
                            <tr key={c.id} className={canWrite ? styles.clickable : undefined} tabIndex={canWrite ? 0 : undefined}
                                onClick={() => open(c)} onKeyDown={(e) => e.key === 'Enter' && open(c)}>
                                <td><strong>{c.name}</strong>{c.document && <div className={styles.muted}>{c.document}</div>}</td>
                                <td data-label="Tipo">{c.kind_label}</td>
                                <td data-label="Contato">{c.email || '—'}<div className={styles.muted}>{formatPhone(c.phone)}</div></td>
                                <td data-label="Mensagens"><Pill tone={ch.tone}>{ch.label}</Pill></td>
                                <td data-label={c.tags.length ? 'Etiquetas' : undefined}>{c.tags.map((t) => <Pill key={t} tone="blue">{t}</Pill>)}</td>
                            </tr>
                        );
                    })}
                </Table>
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
