import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, errorMessage } from '../seguranca/ui';
import { contactsApi } from '../../services/contacts';
import { casesApi } from '../../services/rules';
import {
    AGREEMENT_KINDS, EXPENSE_CATEGORIES, SOURCES, STAGES, brl, carteiraApi, parseBRL, previewSchedule,
} from '../../services/carteira';

const today = () => new Date().toISOString().slice(0, 10);

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
        <div className={styles.filters} style={{ marginBottom: 0 }}>
            <label className={styles.field}>Buscar {label.toLowerCase()}
                <input className={styles.input} value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Nome, CPF/CNPJ ou e-mail" />
            </label>
            <label className={styles.field}>{label}
                <select className={styles.select} value={value || ''} onChange={(e) => onChange(e.target.value)} required aria-label={label}>
                    <option value="">— escolha —</option>
                    {options.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </label>
        </div>
    );
}

function CaseSelect({ value, onChange }) {
    const [cases, setCases] = useState([]);
    useEffect(() => { casesApi.list().then((d) => setCases(Array.isArray(d) ? d : d.resultados || [])).catch(() => {}); }, []);
    return (
        <label className={styles.field}>Processo (opcional)
            <select className={styles.select} value={value || ''} onChange={(e) => onChange(e.target.value)}>
                <option value="">— nenhum —</option>
                {cases.map((c) => <option key={c.id} value={c.id}>{c.cnj}{c.label ? ` — ${c.label}` : ''}</option>)}
            </select>
        </label>
    );
}

function Modal({ title, onClose, onSubmit, busy, error, children, submitLabel = 'Salvar', wide }) {
    return (
        <div className={styles.overlay} role="dialog" aria-modal="true" aria-label={title} onClick={onClose}>
            <form className={styles.modal} style={{ maxWidth: wide ? 760 : 560 }} onClick={(e) => e.stopPropagation()} onSubmit={onSubmit}>
                <div className={styles.modal_title}>{title}</div>
                {children}
                {error && <Banner tone="error">{error}</Banner>}
                <div className={styles.btn_row}>
                    <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>{submitLabel}</button>
                    <button type="button" className={styles.btn} onClick={onClose} disabled={busy}>Cancelar</button>
                </div>
            </form>
        </div>
    );
}

function useSubmit(fn, onDone, ok) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError('');
        try { const r = await fn(); if (ok) toast.success(ok); onDone(r); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    return { busy, error, submit };
}

export function OpportunityForm({ initial, onClose, onDone, team = [] }) {
    const [f, setF] = useState({
        contato_id: initial?.contato?.id || '', titulo: initial?.titulo || '', area: initial?.area || '', origem: initial?.origem || 'indicacao',
        valor: initial?.valor_centavos ? (initial.valor_centavos / 100).toFixed(2).replace('.', ',') : '', etapa: initial?.etapa || 'novo',
        proxima_acao: initial?.proxima_acao || '', proxima_acao_em: initial?.proxima_acao_em || '', motivo_perda: initial?.motivo_perda || '',
        observacoes: initial?.observacoes || '', responsavel_id: initial?.responsavel?.id || '',
    });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const { busy, error, submit } = useSubmit(() => {
        const body = { ...f, responsavel_id: f.responsavel_id || null };
        return initial?.id ? carteiraApi.updateOpportunity(initial.id, body) : carteiraApi.createOpportunity(body);
    }, onDone, 'Oportunidade salva.');
    return (
        <Modal title={initial?.id ? 'Editar oportunidade' : 'Nova oportunidade'} onClose={onClose} onSubmit={submit} busy={busy} error={error}>
            <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} initial={initial?.contato ? { id: initial.contato.id, name: initial.contato.nome } : null} />
            <label className={styles.field}>Caso / assunto<input className={styles.input} value={f.titulo} onChange={set('titulo')} required maxLength={160} placeholder="Ex.: Revisional de aposentadoria" /></label>
            <div className={styles.filters}>
                <label className={styles.field}>Origem<select className={styles.select} value={f.origem} onChange={set('origem')}>{SOURCES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <label className={styles.field}>Etapa<select className={styles.select} value={f.etapa} onChange={set('etapa')}>{STAGES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <label className={styles.field}>Honorários estimados (R$)<input className={styles.input} inputMode="decimal" value={f.valor} onChange={set('valor')} placeholder="0,00" /></label>
            </div>
            {f.etapa === 'perdido' && <label className={styles.field}>Por que não fechou?<input className={styles.input} value={f.motivo_perda} onChange={set('motivo_perda')} required maxLength={200} placeholder="Ex.: preço, fechou com outro escritório, sem viabilidade" /></label>}
            <div className={styles.filters}>
                <label className={styles.field} style={{ flex: 2 }}>Próxima ação<input className={styles.input} value={f.proxima_acao} onChange={set('proxima_acao')} maxLength={160} placeholder="Ex.: enviar proposta" /></label>
                <label className={styles.field}>Quando<input className={styles.input} type="date" value={f.proxima_acao_em} onChange={set('proxima_acao_em')} /></label>
            </div>
            {team.length > 0 && (
                <label className={styles.field}>Responsável
                    <select className={styles.select} value={f.responsavel_id} onChange={set('responsavel_id')}>
                        <option value="">— eu —</option>{team.map((u) => <option key={u.id} value={u.id}>{u.nome}</option>)}
                    </select>
                </label>
            )}
            <label className={styles.field}>Observações (cifradas)<textarea className={styles.textarea} value={f.observacoes} onChange={set('observacoes')} maxLength={2000} /></label>
        </Modal>
    );
}

export function AgreementForm({ opportunity, contact, onClose, onDone }) {
    const [f, setF] = useState({
        contato_id: opportunity?.contato?.id || contact?.id || '', titulo: opportunity?.titulo || 'Honorários advocatícios', tipo: 'parcelado',
        valor: opportunity?.valor_centavos ? (opportunity.valor_centavos / 100).toFixed(2).replace('.', ',') : '', parcelas: 3,
        primeiro_vencimento: today(), exito_pct: '', processo_id: '', observacoes: '',
    });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const cents = parseBRL(f.valor);
    const rows = previewSchedule(f.tipo, cents, f.parcelas, f.primeiro_vencimento);
    const { busy, error, submit } = useSubmit(() => carteiraApi.createAgreement({
        ...f, processo_id: f.processo_id || null, oportunidade_id: opportunity?.id || null,
    }), onDone, 'Contrato criado e parcelas lançadas.');
    const initialContact = opportunity?.contato ? { id: opportunity.contato.id, name: opportunity.contato.nome } : (contact ? { id: contact.id, name: contact.name || contact.nome } : null);
    return (
        <Modal title="Contrato de honorários" onClose={onClose} onSubmit={submit} busy={busy} error={error} submitLabel="Criar contrato" wide>
            <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} initial={initialContact} />
            <label className={styles.field}>Título<input className={styles.input} value={f.titulo} onChange={set('titulo')} required maxLength={160} /></label>
            <div className={styles.filters}>
                <label className={styles.field}>Forma<select className={styles.select} value={f.tipo} onChange={set('tipo')}>{AGREEMENT_KINDS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                {f.tipo !== 'exito' && <label className={styles.field}>{f.tipo === 'mensal' ? 'Valor da mensalidade (R$)' : f.tipo === 'misto' ? 'Entrada (R$)' : 'Valor total (R$)'}<input className={styles.input} inputMode="decimal" value={f.valor} onChange={set('valor')} required placeholder="0,00" /></label>}
                {['parcelado', 'mensal', 'misto'].includes(f.tipo) && <label className={styles.field}>{f.tipo === 'mensal' ? 'Meses' : 'Parcelas'}<input className={styles.input} type="number" min={1} max={120} value={f.parcelas} onChange={set('parcelas')} /></label>}
                {f.tipo !== 'exito' && <label className={styles.field}>1º vencimento<input className={styles.input} type="date" value={f.primeiro_vencimento} onChange={set('primeiro_vencimento')} required /></label>}
                {['exito', 'misto'].includes(f.tipo) && <label className={styles.field}>Êxito (% do proveito)<input className={styles.input} inputMode="decimal" value={f.exito_pct} onChange={set('exito_pct')} required placeholder="30" /></label>}
            </div>
            <CaseSelect value={f.processo_id} onChange={(v) => setF((x) => ({ ...x, processo_id: v }))} />
            {rows.length > 0 && (
                <div className={styles.card}>
                    <div className={styles.card_title}>Parcelas que serão lançadas</div>
                    <ul className={styles.muted} style={{ margin: 0, paddingLeft: 18, maxHeight: 140, overflowY: 'auto' }}>
                        {rows.map((r) => <li key={r.label}>{r.label}: {brl(r.cents)} — vence {r.due.split('-').reverse().join('/')}</li>)}
                    </ul>
                </div>
            )}
            {f.tipo === 'exito' && <p className={styles.muted}>Êxito não gera parcelas agora: quando houver proveito, use "Registrar êxito" no contrato.</p>}
            <label className={styles.field}>Observações (cifradas)<textarea className={styles.textarea} value={f.observacoes} onChange={set('observacoes')} maxLength={2000} /></label>
        </Modal>
    );
}

export function ReceivableForm({ contact, onClose, onDone }) {
    const [f, setF] = useState({ contato_id: contact?.id || '', descricao: 'Consulta', valor: '', vencimento: today(), obs: '' });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
    const { busy, error, submit } = useSubmit(() => carteiraApi.createReceivable(f), onDone, 'Lançamento criado.');
    return (
        <Modal title="Novo lançamento a receber" onClose={onClose} onSubmit={submit} busy={busy} error={error}>
            <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} initial={contact} />
            <label className={styles.field}>Descrição<input className={styles.input} value={f.descricao} onChange={set('descricao')} required maxLength={200} /></label>
            <div className={styles.filters}>
                <label className={styles.field}>Valor (R$)<input className={styles.input} inputMode="decimal" value={f.valor} onChange={set('valor')} required placeholder="0,00" /></label>
                <label className={styles.field}>Vencimento<input className={styles.input} type="date" value={f.vencimento} onChange={set('vencimento')} required /></label>
            </div>
        </Modal>
    );
}

export function ExpenseForm({ onClose, onDone }) {
    const [f, setF] = useState({ descricao: '', categoria: 'custas', valor: '', data: today(), processo_id: '', contato_id: '', reembolsavel: false });
    const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
    const { busy, error, submit } = useSubmit(() => carteiraApi.createExpense({ ...f, processo_id: f.processo_id || null, contato_id: f.contato_id || null }),
        onDone, 'Despesa lançada.');
    return (
        <Modal title="Nova despesa" onClose={onClose} onSubmit={submit} busy={busy} error={error}>
            <label className={styles.field}>Descrição<input className={styles.input} value={f.descricao} onChange={set('descricao')} required maxLength={200} placeholder="Ex.: Custas iniciais" /></label>
            <div className={styles.filters}>
                <label className={styles.field}>Categoria<select className={styles.select} value={f.categoria} onChange={set('categoria')}>{EXPENSE_CATEGORIES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></label>
                <label className={styles.field}>Valor (R$)<input className={styles.input} inputMode="decimal" value={f.valor} onChange={set('valor')} required placeholder="0,00" /></label>
                <label className={styles.field}>Data<input className={styles.input} type="date" value={f.data} onChange={set('data')} required /></label>
            </div>
            <CaseSelect value={f.processo_id} onChange={(v) => setF((x) => ({ ...x, processo_id: v }))} />
            <label className={styles.check_row}><input type="checkbox" checked={f.reembolsavel} onChange={set('reembolsavel')} /> O cliente reembolsa (gera um lançamento a receber)</label>
            {f.reembolsavel && !f.processo_id && <ContactSelect value={f.contato_id} onChange={(v) => setF((x) => ({ ...x, contato_id: v }))} />}
        </Modal>
    );
}
