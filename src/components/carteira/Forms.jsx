import { useEffect, useState } from 'react';
import styles from '../ui/ui.module.css';
import { Checkbox, Field, FilterBar, FormModal, Input, MoneyInput, Select, Textarea } from '../ui';
import useSubmit from '../../hooks/useSubmit';
import { contactsApi } from '../../services/contacts';
import { casesApi } from '../../services/rules';
import {
    AGREEMENT_KINDS, EXPENSE_CATEGORIES, SOURCES, STAGES, brl, carteiraApi, parseBRL, previewSchedule,
} from '../../services/carteira';

const today = () => new Date().toISOString().slice(0, 10);
// Centavos da API → texto do MoneyInput ("1.500,00")
const centsToText = (c) => (c ? (c / 100).toFixed(2).replace('.', ',') : '');

// Busca de cliente no quadro de contatos (nome, CPF/CNPJ, e-mail) — evita listas enormes num <select>
export function ContactSelect({ value, onChange, label = 'Cliente', kind = 'cliente', initial }) {
    const [term, setTerm] = useState('');
    const [options, setOptions] = useState(initial ? [initial] : []);
    useEffect(() => {
        let live = true;
        const t = setTimeout(() => {
            contactsApi.list({ q: term.trim(), kind }).then((d) => { if (live) setOptions(d.resultados || []); }).catch(() => {});
        }, term ? 300 : 0);
        return () => { live = false; clearTimeout(t); };
    }, [term, kind]);
    return (
        <FilterBar>
            <Field label={`Buscar ${label.toLowerCase()}`}>
                <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome, CPF/CNPJ ou e-mail" />
            </Field>
            <Field label={label}>
                <Select value={value || ''} onChange={(e) => onChange(e.target.value)} required aria-label={label}>
                    <option value="">— escolha —</option>
                    {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </Select>
            </Field>
        </FilterBar>
    );
}

function CaseSelect({ value, onChange }) {
    const [cases, setCases] = useState([]);
    useEffect(() => { casesApi.list().then((d) => setCases(Array.isArray(d) ? d : d.resultados || [])).catch(() => {}); }, []);
    return (
        <Field label="Processo (opcional)">
            <Select value={value || ''} onChange={(e) => onChange(e.target.value)}>
                <option value="">— nenhum —</option>
                {cases.map((c) => <option key={c.id} value={c.id}>{c.cnj}{c.label ? ` — ${c.label}` : ''}</option>)}
            </Select>
        </Field>
    );
}

export function OpportunityForm({ initial, onClose, onDone, team = [] }) {
    const [f, setF] = useState({
        contato_id: initial?.contato?.id || '', titulo: initial?.titulo || '', area: initial?.area || '', origem: initial?.origem || 'indicacao',
        valor: centsToText(initial?.valor_centavos), etapa: initial?.etapa || 'novo',
        proxima_acao: initial?.proxima_acao || '', proxima_acao_em: initial?.proxima_acao_em || '', motivo_perda: initial?.motivo_perda || '',
        observacoes: initial?.observacoes || '', responsavel_id: initial?.responsavel?.id || '',
    });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const { busy, error, submit } = useSubmit(() => {
        const body = { ...f, responsavel_id: f.responsavel_id || null };
        return initial?.id ? carteiraApi.updateOpportunity(initial.id, body) : carteiraApi.createOpportunity(body);
    }, { onDone, ok: 'Oportunidade salva.' });
    return (
        <FormModal title={initial?.id ? 'Editar oportunidade' : 'Nova oportunidade'} onClose={onClose} onSubmit={submit} busy={busy} error={error}>
            <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} initial={initial?.contato ? { id: initial.contato.id, name: initial.contato.nome } : null} />
            <Field label="Caso / assunto"><Input value={f.titulo} onChange={set('titulo')} required maxLength={160} placeholder="Ex.: Revisional de aposentadoria" /></Field>
            <FilterBar>
                <Field label="Origem"><Select value={f.origem} onChange={set('origem')}>{SOURCES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                <Field label="Etapa"><Select value={f.etapa} onChange={set('etapa')}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                <Field label="Honorários estimados (R$)"><MoneyInput value={f.valor} onChange={(v) => setF((x) => ({ ...x, valor: v }))} /></Field>
            </FilterBar>
            {f.etapa === 'perdido' && <Field label="Por que não fechou?"><Input value={f.motivo_perda} onChange={set('motivo_perda')} required maxLength={200} placeholder="Ex.: preço, fechou com outro escritório, sem viabilidade" /></Field>}
            <FilterBar>
                <Field label="Próxima ação" className={styles.flex_2}><Input value={f.proxima_acao} onChange={set('proxima_acao')} maxLength={160} placeholder="Ex.: enviar proposta" /></Field>
                <Field label="Quando"><Input type="date" value={f.proxima_acao_em} onChange={set('proxima_acao_em')} /></Field>
            </FilterBar>
            {team.length > 0 && (
                <Field label="Responsável">
                    <Select value={f.responsavel_id} onChange={set('responsavel_id')}>
                        <option value="">— eu —</option>{team.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </Select>
                </Field>
            )}
            <Field label="Observações (cifradas)"><Textarea value={f.observacoes} onChange={set('observacoes')} maxLength={2000} /></Field>
        </FormModal>
    );
}

export function AgreementForm({ opportunity, contact, onClose, onDone }) {
    const [f, setF] = useState({
        contato_id: opportunity?.contato?.id || contact?.id || '', titulo: opportunity?.titulo || 'Honorários advocatícios', tipo: 'parcelado',
        valor: centsToText(opportunity?.valor_centavos), parcelas: 3,
        primeiro_vencimento: today(), exito_pct: '', processo_id: '', observacoes: '',
    });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const cents = parseBRL(f.valor);
    const rows = previewSchedule(f.tipo, cents, f.parcelas, f.primeiro_vencimento);
    const { busy, error, submit } = useSubmit(() => carteiraApi.createAgreement({
        ...f, processo_id: f.processo_id || null, oportunidade_id: opportunity?.id || null,
    }), { onDone, ok: 'Contrato criado e parcelas lançadas.' });
    const initialContact = opportunity?.contato ? { id: opportunity.contato.id, name: opportunity.contato.nome } : (contact ? { id: contact.id, name: contact.name || contact.nome } : null);
    const valorLabel = f.tipo === 'mensal' ? 'Valor da mensalidade (R$)' : f.tipo === 'misto' ? 'Entrada (R$)' : 'Valor total (R$)';
    return (
        <FormModal title="Contrato de honorários" size="lg" onClose={onClose} onSubmit={submit} busy={busy} error={error} submitLabel="Criar contrato">
            <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} initial={initialContact} />
            <Field label="Título"><Input value={f.titulo} onChange={set('titulo')} required maxLength={160} /></Field>
            <FilterBar>
                <Field label="Forma"><Select value={f.tipo} onChange={set('tipo')}>{AGREEMENT_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                {f.tipo !== 'exito' && <Field label={valorLabel}><MoneyInput value={f.valor} onChange={(v) => setF((x) => ({ ...x, valor: v }))} required /></Field>}
                {['parcelado', 'mensal', 'misto'].includes(f.tipo) && <Field label={f.tipo === 'mensal' ? 'Meses' : 'Parcelas'}><Input type="number" min={1} max={120} value={f.parcelas} onChange={set('parcelas')} /></Field>}
                {f.tipo !== 'exito' && <Field label="1º vencimento"><Input type="date" value={f.primeiro_vencimento} onChange={set('primeiro_vencimento')} required /></Field>}
                {['exito', 'misto'].includes(f.tipo) && <Field label="Êxito (% do proveito)"><Input inputMode="decimal" value={f.exito_pct} onChange={set('exito_pct')} required placeholder="30" /></Field>}
            </FilterBar>
            <CaseSelect value={f.processo_id} onChange={(v) => setF((x) => ({ ...x, processo_id: v }))} />
            {rows.length > 0 && (
                <div className={styles.card}>
                    <div className={styles.card_title}>Parcelas que serão lançadas</div>
                    <ul className={`${styles.muted} ${styles.list_scroll}`}>
                        {rows.map((r) => <li key={r.label}>{r.label}: {brl(r.cents)} — vence {r.due.split('-').reverse().join('/')}</li>)}
                    </ul>
                </div>
            )}
            {f.tipo === 'exito' && <p className={styles.muted}>Êxito não gera parcelas agora: quando houver proveito, use "Registrar êxito" no contrato.</p>}
            <Field label="Observações (cifradas)"><Textarea value={f.observacoes} onChange={set('observacoes')} maxLength={2000} /></Field>
        </FormModal>
    );
}

export function ReceivableForm({ contact, onClose, onDone }) {
    const [f, setF] = useState({ contato_id: contact?.id || '', descricao: 'Consulta', valor: '', vencimento: today(), obs: '' });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const { busy, error, submit } = useSubmit(() => carteiraApi.createReceivable(f), { onDone, ok: 'Lançamento criado.' });
    return (
        <FormModal title="Novo lançamento a receber" onClose={onClose} onSubmit={submit} busy={busy} error={error}>
            <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} initial={contact} />
            <Field label="Descrição"><Input value={f.descricao} onChange={set('descricao')} required maxLength={200} /></Field>
            <FilterBar>
                <Field label="Valor (R$)"><MoneyInput value={f.valor} onChange={(v) => setF((x) => ({ ...x, valor: v }))} required /></Field>
                <Field label="Vencimento"><Input type="date" value={f.vencimento} onChange={set('vencimento')} required /></Field>
            </FilterBar>
        </FormModal>
    );
}

export function ExpenseForm({ onClose, onDone }) {
    const [f, setF] = useState({ descricao: '', categoria: 'custas', valor: '', data: today(), processo_id: '', contato_id: '', reembolsavel: false });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const { busy, error, submit } = useSubmit(() => carteiraApi.createExpense({ ...f, processo_id: f.processo_id || null, contato_id: f.contato_id || null }),
        { onDone, ok: 'Despesa lançada.' });
    return (
        <FormModal title="Nova despesa" onClose={onClose} onSubmit={submit} busy={busy} error={error}>
            <Field label="Descrição"><Input value={f.descricao} onChange={set('descricao')} required maxLength={200} placeholder="Ex.: Custas iniciais" /></Field>
            <FilterBar>
                <Field label="Categoria"><Select value={f.categoria} onChange={set('categoria')}>{EXPENSE_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</Select></Field>
                <Field label="Valor (R$)"><MoneyInput value={f.valor} onChange={(v) => setF((x) => ({ ...x, valor: v }))} required /></Field>
                <Field label="Data"><Input type="date" value={f.data} onChange={set('data')} required /></Field>
            </FilterBar>
            <CaseSelect value={f.processo_id} onChange={(v) => setF((x) => ({ ...x, processo_id: v }))} />
            <Checkbox checked={f.reembolsavel} onChange={set('reembolsavel')}>O cliente reembolsa (gera um lançamento a receber)</Checkbox>
            {f.reembolsavel && !f.processo_id && <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} />}
        </FormModal>
    );
}
