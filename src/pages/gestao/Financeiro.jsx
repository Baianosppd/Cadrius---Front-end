import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import styles from '../../components/ui/ui.module.css';
import g from '../../components/gestao/Gestao.module.css';
import { Banner, Button, Checkbox, Empty, Field, FormModal, Input, Loading, Modal, PageHeader, Pill, Row, Select, Stack, StatCard, Table, Tabs, Textarea } from '../../components/ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import {
    STATUSES, TIERS, adminApi, apiErrors, brl, formToBody, toLocalInput,
} from '../../services/financeiro';
const SEVERITIES = [['info', 'Informativo'], ['warn', 'Atenção'], ['danger', 'Urgente']];
const KINDS = [['percent', 'Percentual (%)'], ['amount', 'Valor fixo (R$)'], ['trial', 'Dias extras de teste']];
const DURATIONS = [['once', 'Só na 1ª cobrança'], ['repeating', 'Por N meses'], ['forever', 'Para sempre']];

// Cada recurso: URL, colunas da tabela e campos do formulário (o back valida; os erros aparecem no formulário)
const RESOURCES = {
    planos: {
        resource: 'plans', canCreate: true, canDelete: false,
        note: 'Reajuste NÃO é retroativo: assinaturas existentes mantêm o preço contratado; o novo preço vale para novas assinaturas. Planos não são apagados — desative.',
        columns: [['name', 'Plano'], ['tier', 'Tier'], ['price_brl', 'Preço', (v) => brl(v)], ['max_users', 'Usuários'], ['max_ai_extractions', 'Créditos/mês'], ['is_active', 'Ativo', (v) => <Pill tone={v ? 'green' : 'gray'}>{v ? 'Sim' : 'Não'}</Pill>]],
        fields: [
            { name: 'name', label: 'Nome', type: 'text' },
            { name: 'tier', label: 'Tier', type: 'select', options: TIERS },
            { name: 'price_brl', label: 'Preço mensal (R$)', type: 'text' },
            { name: 'max_users', label: 'Usuários', type: 'number' },
            { name: 'max_ai_extractions', label: 'Créditos de IA/mês', type: 'number' },
            { name: 'is_active', label: 'Ativo', type: 'checkbox' },
        ],
        empty: { name: '', tier: 'START', price_brl: '', max_users: 1, max_ai_extractions: 100, is_active: true },
    },
    pacotes: {
        resource: 'packs', canCreate: true, canDelete: false,
        note: 'Créditos avulsos valem 12 meses e são usados depois dos créditos do plano.',
        columns: [['name', 'Pacote'], ['credits', 'Créditos'], ['price_brl', 'Preço', (v) => brl(v)], ['is_active', 'Ativo', (v) => <Pill tone={v ? 'green' : 'gray'}>{v ? 'Sim' : 'Não'}</Pill>]],
        fields: [
            { name: 'name', label: 'Nome', type: 'text' },
            { name: 'credits', label: 'Créditos', type: 'number' },
            { name: 'price_brl', label: 'Preço (R$)', type: 'text' },
            { name: 'is_active', label: 'Ativo', type: 'checkbox' },
        ],
        empty: { name: '', credits: 200, price_brl: '', is_active: true },
    },
    promocoes: {
        resource: 'promotions', canCreate: true, canDelete: false,
        note: 'Desconto vale na assinatura (checkout); "Dias extras de teste" (1 a 90) entra na hora, no cadastro ou no Perfil durante o teste. O cliente pode digitar o cupom já na abertura da conta. Depois de usado, o desconto não pode mudar — crie outro cupom. Desative em vez de apagar.',
        columns: [['code', 'Código'], ['name', 'Nome'], ['kind', 'Desconto', (v, r) => (v === 'percent' ? `${Number(r.value)}%` : v === 'trial' ? `+${Number(r.value)} dias de teste` : brl(r.value))],
            ['duration', 'Duração', (v, r) => ({ once: '1ª cobrança', forever: 'sempre' }[v] || `${r.duration_months} meses`)],
            ['redemptions_count', 'Usos', (v, r) => `${v}${r.max_redemptions ? ` / ${r.max_redemptions}` : ''}`],
            ['plan_tiers', 'Planos', (v) => (v?.length ? v.join(', ') : 'todos')],
            ['is_active', 'Ativo', (v) => <Pill tone={v ? 'green' : 'gray'}>{v ? 'Sim' : 'Não'}</Pill>]],
        fields: [
            { name: 'code', label: 'Código (ex.: LANCAMENTO20)', type: 'text' },
            { name: 'name', label: 'Nome interno', type: 'text' },
            { name: 'description', label: 'Descrição', type: 'text' },
            { name: 'kind', label: 'Tipo', type: 'select', options: KINDS },
            { name: 'value', label: 'Valor (%, R$ ou dias)', type: 'text' },
            { name: 'duration', label: 'Duração', type: 'select', options: DURATIONS },
            { name: 'duration_months', label: 'Meses (se "Por N meses")', type: 'number', nullable: true },
            { name: 'plan_tiers', label: 'Planos (vazio = todos)', type: 'tiers' },
            { name: 'starts_at', label: 'Começa em', type: 'datetime', nullable: true },
            { name: 'ends_at', label: 'Termina em', type: 'datetime', nullable: true },
            { name: 'max_redemptions', label: 'Limite de usos (vazio = ilimitado)', type: 'number', nullable: true },
            { name: 'is_active', label: 'Ativo', type: 'checkbox' },
        ],
        empty: { code: '', name: '', description: '', kind: 'percent', value: '', duration: 'once', duration_months: '', plan_tiers: [], starts_at: '', ends_at: '', max_redemptions: '', is_active: true },
    },
    informes: {
        resource: 'notices', canCreate: true, canDelete: true,
        note: 'Informes aparecem como faixa no app dos escritórios, segmentados por plano e estado da assinatura, dentro do período definido.',
        columns: [['title', 'Título'], ['severity', 'Tipo', (v) => <Pill tone={{ info: 'blue', warn: 'yellow', danger: 'red' }[v]}>{{ info: 'Informativo', warn: 'Atenção', danger: 'Urgente' }[v]}</Pill>],
            ['audience_tiers', 'Planos', (v) => (v?.length ? v.join(', ') : 'todos')],
            ['audience_statuses', 'Estados', (v) => (v?.length ? v.join(', ') : 'todos')],
            ['is_active', 'Ativo', (v) => <Pill tone={v ? 'green' : 'gray'}>{v ? 'Sim' : 'Não'}</Pill>]],
        fields: [
            { name: 'title', label: 'Título', type: 'text' },
            { name: 'body', label: 'Mensagem', type: 'textarea' },
            { name: 'severity', label: 'Tipo', type: 'select', options: SEVERITIES },
            { name: 'audience_tiers', label: 'Planos (vazio = todos)', type: 'tiers' },
            { name: 'audience_statuses', label: 'Estados da assinatura (vazio = todos)', type: 'statuses' },
            { name: 'starts_at', label: 'Começa em', type: 'datetime', nullable: true },
            { name: 'ends_at', label: 'Termina em', type: 'datetime', nullable: true },
            { name: 'is_active', label: 'Ativo', type: 'checkbox' },
        ],
        empty: { title: '', body: '', severity: 'info', audience_tiers: [], audience_statuses: [], starts_at: '', ends_at: '', is_active: true },
    },
    pesos: {
        resource: 'credit-weights', canCreate: false, canDelete: false,
        note: 'Quantos créditos cada operação de IA consome. Triagem/OCR local = 0 (incluso).',
        columns: [['label', 'Operação'], ['operation', 'Chave'], ['credits', 'Créditos'], ['is_active', 'Ativo', (v) => <Pill tone={v ? 'green' : 'gray'}>{v ? 'Sim' : 'Não'}</Pill>]],
        fields: [{ name: 'credits', label: 'Créditos', type: 'number' }, { name: 'is_active', label: 'Ativo', type: 'checkbox' }],
        empty: {},
    },
};

function MultiCheck({ label, options, value, onChange }) {
    const set = new Set(value || []);
    return (
        <Stack gap={1} role="group" aria-label={label}>
            <span className={styles.text_sm}>{label}</span>
            <Row gap={3}>
                {options.map(([k, l]) => (
                    <Checkbox key={k} checked={set.has(k)} onChange={() => { set.has(k) ? set.delete(k) : set.add(k); onChange([...set]); }}>{l}</Checkbox>
                ))}
            </Row>
        </Stack>
    );
}

function CampoRecurso({ field, form, setForm }) {
    const v = form[field.name] ?? '';
    const set = (val) => setForm((f) => ({ ...f, [field.name]: val }));
    if (field.type === 'checkbox') return <Checkbox checked={!!form[field.name]} onChange={(e) => set(e.target.checked)}>{field.label}</Checkbox>;
    if (field.type === 'tiers') return <MultiCheck label={field.label} options={TIERS} value={form[field.name]} onChange={set} />;
    if (field.type === 'statuses') return <MultiCheck label={field.label} options={STATUSES} value={form[field.name]} onChange={set} />;
    let control;
    if (field.type === 'select') control = <Select value={v} onChange={(e) => set(e.target.value)}>{field.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select>;
    else if (field.type === 'textarea') control = <Textarea rows={3} value={v} onChange={(e) => set(e.target.value)} />;
    else if (field.type === 'datetime') control = <Input type="datetime-local" value={v} onChange={(e) => set(e.target.value)} />;
    else control = <Input type={field.type === 'number' ? 'number' : 'text'} value={v} onChange={(e) => set(e.target.value)} />;
    return <Field label={field.label}>{control}</Field>;
}

function EditForm({ spec, title, initial, onSave, onCancel }) {
    const [form, setForm] = useState(initial);
    const [errors, setErrors] = useState([]);
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        setErrors([]);
        try { await onSave(formToBody(spec.fields, form)); } catch (err) { setErrors(apiErrors(err)); } finally { setBusy(false); }
    };
    return (
        <FormModal title={title} size="lg" onClose={onCancel} onSubmit={submit} busy={busy}
            error={errors.length > 0 && errors.map((e) => <div key={e}>{e}</div>)}>
            <div className={g.form_grid}>
                {spec.fields.map((fd) => <CampoRecurso key={fd.name} field={fd} form={form} setForm={setForm} />)}
            </div>
        </FormModal>
    );
}

function ConfirmarApagar({ row, onDone, onCancel }) {
    const [busy, setBusy] = useState(false);
    const confirm = async () => {
        setBusy(true);
        try { await onDone(row); } catch (e) { toast.error(errorMessage(e)); setBusy(false); }
    };
    return (
        <Modal title="Apagar este item?" size="sm" onClose={onCancel} busy={busy}
            footer={<>
                <Button onClick={onCancel} disabled={busy}>Voltar</Button>
                <Button variant="danger" icon={FiTrash2} loading={busy} onClick={confirm}>Apagar</Button>
            </>}>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{row.title || row.name || row.code} será apagado e não pode ser recuperado.</p>
        </Modal>
    );
}

function toForm(spec, row) {
    const f = { ...row };
    for (const field of spec.fields) if (field.type === 'datetime') f[field.name] = toLocalInput(row[field.name]);
    return f;
}

function Crud({ spec }) {
    const { data: rows, error, reload } = useLoader(() => adminApi.list(spec.resource), [spec.resource]);
    const [editing, setEditing] = useState(null);
    const [removing, setRemoving] = useState(null);

    const save = async (body) => {
        if (editing === 'new') await adminApi.create(spec.resource, body); else await adminApi.update(spec.resource, editing, body);
        toast.success('Salvo.');
        setEditing(null);
        reload();
    };
    const remove = async (row) => {
        await adminApi.remove(spec.resource, row.id);
        toast.success('Apagado.');
        setRemoving(null);
        reload();
    };

    if (error) return <Banner tone="error">{error}</Banner>;
    if (!rows) return <Loading />;
    const current = editing && editing !== 'new' ? rows.find((r) => r.id === editing) : null;
    return (
        <Stack gap={3}>
            <Banner tone="info">{spec.note}</Banner>
            {spec.canCreate && <Button variant="primary" icon={FiPlus} className={styles.w_fit} onClick={() => setEditing('new')}>Novo</Button>}
            <Table columns={[...spec.columns.map(([, label]) => label), { label: '', className: styles.td_actions }]}
                empty={rows.length === 0 && <Empty>Nada cadastrado.</Empty>}>
                {rows.map((row) => (
                    <tr key={row.id}>
                        {spec.columns.map(([key, label, render], i) => (
                            <td key={label} data-label={i ? label : undefined}>{render ? render(row[key], row) : String(row[key] ?? '—')}</td>
                        ))}
                        <td className={styles.td_actions}>
                            <Row gap={1} wrap={false}>
                                <Button size="sm" onClick={() => setEditing(row.id)}>Editar</Button>
                                {spec.canDelete && <Button size="sm" variant="danger" icon={FiTrash2} onClick={() => setRemoving(row)}>Apagar</Button>}
                            </Row>
                        </td>
                    </tr>
                ))}
            </Table>
            {editing === 'new' && <EditForm spec={spec} title="Novo" initial={spec.empty} onSave={save} onCancel={() => setEditing(null)} />}
            {current && (
                <EditForm spec={spec} title={`Editar: ${current.name || current.title || current.label || current.code || ''}`}
                    initial={toForm(spec, current)} onSave={save} onCancel={() => setEditing(null)} />
            )}
            {removing && <ConfirmarApagar row={removing} onDone={remove} onCancel={() => setRemoving(null)} />}
        </Stack>
    );
}

function Resumo() {
    const { data, error } = useLoader(adminApi.summary);
    const { data: history } = useLoader(() => adminApi.priceHistory().catch(() => []));
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const st = data.organizacoes_por_estado;
    return (
        <Stack gap={3}>
            <div className={styles.grid}>
                <StatCard title="MRR (preço de tabela)" value={brl(data.mrr_tabela_brl)} note="Assinaturas ativas com Stripe; não desconta cupons" />
                <StatCard title="Assinantes pagantes" value={data.assinantes_pagantes} note={`Ticket médio ${brl(data.ticket_medio_brl)}`} />
                <StatCard title="Em teste" value={st.trialing} note={`${data.trials_terminando_em_7_dias} terminam em 7 dias`} />
                <StatCard title="Pagamento pendente" value={st.past_due} tone={st.past_due ? 'red' : 'green'} note={`${st.restricted} restritas · ${st.suspended} suspensas · ${st.canceled} canceladas`} />
                <StatCard title="Créditos avulsos (30 dias)" value={brl(data.pacotes_30d.receita_brl)} note={`${data.pacotes_30d.creditos_vendidos} créditos vendidos${data.creditos_cortesia_30d ? ` · ${data.creditos_cortesia_30d} de cortesia` : ''}`} />
                <StatCard title="Promoções" value={data.promocoes_ativas} note={`${data.usos_de_promocao} usos no total`} />
            </div>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Histórico de preços</div>
            <Table columns={['Quando', 'Plano', 'Preço', 'Créditos']}
                empty={(history || []).length === 0 && <Empty>Nenhuma alteração registrada.</Empty>}>
                {(history || []).map((h, i) => (
                    <tr key={i}><td>{fmtDateTime(h.changed_at)}</td><td data-label="Plano">{h.plan}</td>
                        <td data-label="Preço">{brl(h.old_price)} → {brl(h.new_price)}</td><td data-label="Créditos">{h.old_credits} → {h.new_credits}</td></tr>
                ))}
            </Table>
        </Stack>
    );
}

const TABS = [{ id: 'resumo', label: 'Resumo' }, { id: 'planos', label: 'Planos e preços' }, { id: 'pacotes', label: 'Pacotes de créditos' },
    { id: 'promocoes', label: 'Promoções' }, { id: 'informes', label: 'Informes' }, { id: 'pesos', label: 'Pesos de crédito' }];

export default function Financeiro() {
    const [tab, setTab] = useState('resumo');
    return (
        <div className={styles.page}>
            <PageHeader title="Financeiro" subtitle="Preços, pacotes e promoções" />
            <Tabs tabs={TABS} value={tab} onChange={setTab} />
            {tab === 'resumo' ? <Resumo /> : <Crud key={tab} spec={RESOURCES[tab]} />}
        </div>
    );
}
