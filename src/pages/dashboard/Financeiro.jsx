import { useCallback, useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import TabBar from '../../components/ui/TabBar';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, Loading, Pill, StatCard } from '../../components/seguranca/ui';
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

function MultiCheck({ options, value, onChange }) {
    const set = new Set(value || []);
    return (
        <span style={{ display: 'inline-flex', gap: 10, flexWrap: 'wrap' }}>
            {options.map(([k, label]) => (
                <label key={k}><input type="checkbox" checked={set.has(k)} onChange={() => { set.has(k) ? set.delete(k) : set.add(k); onChange([...set]); }} /> {label}</label>
            ))}
        </span>
    );
}

function Field({ field, form, setForm }) {
    const v = form[field.name] ?? '';
    const set = (val) => setForm((f) => ({ ...f, [field.name]: val }));
    const base = { style: { width: '100%', padding: 6, border: '1px solid var(--c-border-2)', borderRadius: 6 } };
    if (field.type === 'checkbox') return <input type="checkbox" checked={!!form[field.name]} onChange={(e) => set(e.target.checked)} />;
    if (field.type === 'select') return <select {...base} value={v} onChange={(e) => set(e.target.value)}>{field.options.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>;
    if (field.type === 'textarea') return <textarea {...base} rows={3} value={v} onChange={(e) => set(e.target.value)} />;
    if (field.type === 'tiers') return <MultiCheck options={TIERS} value={form[field.name]} onChange={set} />;
    if (field.type === 'statuses') return <MultiCheck options={STATUSES} value={form[field.name]} onChange={set} />;
    if (field.type === 'datetime') return <input {...base} type="datetime-local" value={v} onChange={(e) => set(e.target.value)} />;
    return <input {...base} type={field.type === 'number' ? 'number' : 'text'} value={v} onChange={(e) => set(e.target.value)} />;
}

function EditForm({ spec, initial, onSave, onCancel }) {
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
        <form onSubmit={submit} style={{ background: 'var(--c-surface-2)', border: '1px solid var(--c-border)', borderRadius: 8, padding: 14, margin: '8px 0', display: 'grid', gap: 10, gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))' }}>
            {spec.fields.map((f) => (
                <label key={f.name} style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.85rem', color: 'var(--c-text-2)' }}>{f.label}<Field field={f} form={form} setForm={setForm} /></label>
            ))}
            {errors.length > 0 && <div style={{ gridColumn: '1 / -1' }}><Banner tone="error">{errors.map((e) => <div key={e}>{e}</div>)}</Banner></div>}
            <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 8 }}>
                <button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
                <button type="button" onClick={onCancel}>Cancelar</button>
            </div>
        </form>
    );
}

function toForm(spec, row) {
    const f = { ...row };
    for (const field of spec.fields) if (field.type === 'datetime') f[field.name] = toLocalInput(row[field.name]);
    return f;
}

function Crud({ spec }) {
    const [rows, setRows] = useState(null);
    const [error, setError] = useState(null);
    const [editing, setEditing] = useState(null);   // id | 'new'
    const load = useCallback(() => adminApi.list(spec.resource).then(setRows).catch((e) => setError(errorMessage(e))), [spec.resource]);
    useEffect(() => { load(); }, [load]);

    const save = async (body) => {
        if (editing === 'new') await adminApi.create(spec.resource, body); else await adminApi.update(spec.resource, editing, body);
        toast.success('Salvo.');
        setEditing(null);
        load();
    };
    const remove = async (row) => {
        if (!window.confirm('Apagar este item?')) return;
        try { await adminApi.remove(spec.resource, row.id); load(); } catch (e) { toast.error(errorMessage(e)); }
    };

    if (error) return <Banner tone="error">{error}</Banner>;
    if (!rows) return <Loading />;
    return (
        <div className={styles.page}>
            <Banner tone="info">{spec.note}</Banner>
            {spec.canCreate && editing !== 'new' && <div><button onClick={() => setEditing('new')}>+ Novo</button></div>}
            {editing === 'new' && <EditForm spec={spec} initial={spec.empty} onSave={save} onCancel={() => setEditing(null)} />}
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr>{spec.columns.map(([, label]) => <th key={label}>{label}</th>)}<th /></tr></thead>
                    <tbody>
                        {rows.length === 0 && <tr><td colSpan={spec.columns.length + 1}><Empty>Nada cadastrado.</Empty></td></tr>}
                        {rows.map((row) => (
                            <tr key={row.id}>
                                {spec.columns.map(([key, label, render]) => <td key={label}>{render ? render(row[key], row) : String(row[key] ?? '—')}</td>)}
                                <td style={{ whiteSpace: 'nowrap' }}>
                                    <button onClick={() => setEditing(editing === row.id ? null : row.id)}>Editar</button>
                                    {spec.canDelete && <button onClick={() => remove(row)} style={{ color: 'var(--c-danger)', marginLeft: 6 }}>Apagar</button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {editing && editing !== 'new' && (
                <EditForm spec={spec} initial={toForm(spec, rows.find((r) => r.id === editing) || {})} onSave={save} onCancel={() => setEditing(null)} />
            )}
        </div>
    );
}

function Resumo() {
    const [data, setData] = useState(null);
    const [history, setHistory] = useState([]);
    const [error, setError] = useState(null);
    useEffect(() => {
        adminApi.summary().then(setData).catch((e) => setError(errorMessage(e)));
        adminApi.priceHistory().then(setHistory).catch(() => setHistory([]));
    }, []);
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    const st = data.organizacoes_por_estado;
    return (
        <div className={styles.page}>
            <div className={styles.grid}>
                <StatCard title="MRR (preço de tabela)" value={brl(data.mrr_tabela_brl)} note="Assinaturas ativas com Stripe; não desconta cupons" />
                <StatCard title="Assinantes pagantes" value={data.assinantes_pagantes} note={`Ticket médio ${brl(data.ticket_medio_brl)}`} />
                <StatCard title="Em teste" value={st.trialing} note={`${data.trials_terminando_em_7_dias} terminam em 7 dias`} />
                <StatCard title="Pagamento pendente" value={st.past_due} tone={st.past_due ? 'red' : 'green'} note={`${st.restricted} restritas · ${st.suspended} suspensas · ${st.canceled} canceladas`} />
                <StatCard title="Créditos avulsos (30 dias)" value={brl(data.pacotes_30d.receita_brl)} note={`${data.pacotes_30d.creditos_vendidos} créditos vendidos${data.creditos_cortesia_30d ? ` · ${data.creditos_cortesia_30d} de cortesia` : ''}`} />
                <StatCard title="Promoções" value={data.promocoes_ativas} note={`${data.usos_de_promocao} usos no total`} />
            </div>
            <h3>Histórico de preços</h3>
            <div className={styles.table_wrap}>
                <table className={styles.table}>
                    <thead><tr><th>Quando</th><th>Plano</th><th>Preço</th><th>Créditos</th></tr></thead>
                    <tbody>
                        {history.length === 0 && <tr><td colSpan={4}><Empty>Nenhuma alteração registrada.</Empty></td></tr>}
                        {history.map((h, i) => (
                            <tr key={i}><td>{new Date(h.changed_at).toLocaleString('pt-BR')}</td><td>{h.plan}</td>
                                <td>{brl(h.old_price)} → {brl(h.new_price)}</td><td>{h.old_credits} → {h.new_credits}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const TABS = [{ id: 'resumo', label: 'Resumo' }, { id: 'planos', label: 'Planos e preços' }, { id: 'pacotes', label: 'Pacotes de créditos' },
    { id: 'promocoes', label: 'Promoções' }, { id: 'informes', label: 'Informes' }, { id: 'pesos', label: 'Pesos de crédito' }];

export default function Financeiro() {
    const [tab, setTab] = useState('resumo');
    return (
        <div className={styles.page}>
            <div>
                <div className={styles.page_title}>Financeiro</div>
                <div className={styles.page_subtitle}>Preços, pacotes e promoções</div>
            </div>
            <TabBar tabs={TABS} activeTab={tab} onTabChange={setTab} />
            {tab === 'resumo' ? <Resumo /> : <Crud key={tab} spec={RESOURCES[tab]} />}
        </div>
    );
}
