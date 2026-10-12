import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import s from './Suporte.module.css';
import { Banner, Button, Field, FilterBar, Input, Loading, Row, Select, Stack, StatusPill, Textarea } from '../ui';
import { errorMessage, fmtDate, fmtDateTime } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
import { STAGES, brl, customizationApi } from '../../services/cad223';

// Pedido de parametrização (CAD-223): o escritório descreve algo específico; a Cadrius analisa, propõe e só executa após o "aprovo".
export function NovaParametrizacao({ onDone, onCancel, pageUrl }) {
    const { data } = useLoader(() => customizationApi.list(), []);
    const [f, setF] = useState({ area: 'automacao', titulo: '', objetivo: '', exemplo: '', frequencia: '', pessoas: 1, desejado_para: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
    const hint = data?.areas.find((a) => a.chave === f.area)?.dica;
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true); setError('');
        try { const r = await customizationApi.create({ ...f, page_url: pageUrl }); toast.success('Pedido enviado. A equipe Cadrius responde no chamado.'); onDone(r.chamado_id); }
        catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <Stack as="form" gap={3} className={`${styles.card} ${s.form}`} onSubmit={submit}>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Pedir parametrização</div>
            <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Precisa de uma automação, relatório, modelo, integração ou rotina específica do seu escritório? Descreva aqui. A equipe Cadrius
                analisa, envia uma proposta (o que será feito, prazo e, se houver, custo) e só executa depois que o dono ou administrador aprovar.</p>
            <FilterBar>
                <Field label="Área">
                    <Select value={f.area} onChange={set('area')}>
                        {(data?.areas || [{ chave: 'automacao', rotulo: 'Automação / gatilho' }]).map((a) => <option key={a.chave} value={a.chave}>{a.rotulo}</option>)}
                    </Select>
                </Field>
                <Field label="Título (opcional)" className={styles.flex_2}><Input value={f.titulo} onChange={set('titulo')} maxLength={200} /></Field>
            </FilterBar>
            {hint && <Banner tone="info">{hint}</Banner>}
            <Field label="O que você precisa e por quê?"><Textarea required minLength={20} value={f.objetivo} onChange={set('objetivo')} /></Field>
            <Field label="Exemplo concreto / como é feito hoje (opcional)"><Textarea value={f.exemplo} onChange={set('exemplo')} /></Field>
            <FilterBar>
                <Field label="Com que frequência acontece?"><Input value={f.frequencia} onChange={set('frequencia')} placeholder="ex.: toda publicação nova" maxLength={40} /></Field>
                <Field label="Pessoas que usam"><Input type="number" min={1} max={500} value={f.pessoas} onChange={set('pessoas')} /></Field>
                <Field label="Para quando?"><Input type="date" value={f.desejado_para} onChange={set('desejado_para')} /></Field>
            </FilterBar>
            <Banner tone="info">Não envie senhas nem dados de clientes. Se a equipe precisar ver algo, você autoriza o acesso assistido no chamado.</Banner>
            {error && <Banner tone="error">{error}</Banner>}
            <Row>
                <Button type="submit" variant="primary" loading={busy} loadingLabel="Enviando…">Enviar pedido</Button>
                <Button onClick={onCancel}>Cancelar</Button>
            </Row>
        </Stack>
    );
}

export function MinhasParametrizacoes({ canApprove, onOpen }) {
    const { data, error, reload } = useLoader(() => customizationApi.list(), []);
    const decide = async (r, d) => {
        const msg = d === 'aprovar'
            ? `Aprovar a proposta${r.custo_centavos ? ` com custo de ${brl(r.custo_centavos)}` : ' (sem custo)'}${r.prazo_dias ? ` e prazo de ${r.prazo_dias} dia(s)` : ''}?`
            : 'Cancelar este pedido?';
        if (!window.confirm(msg)) return;
        try { await customizationApi.decide(r.id, d); toast.success(d === 'aprovar' ? 'Proposta aprovada.' : 'Pedido cancelado.'); reload(); } catch (e) { toast.error(errorMessage(e)); }
    };
    if (error) return <Banner tone="error">{error}</Banner>;
    if (!data) return <Loading />;
    if (data.resultados.length === 0) return null;
    return (
        <Stack>
            <div className={`${styles.section_title} ${styles.mb_0}`}>Pedidos de parametrização</div>
            {data.resultados.map((r) => (
                <Stack key={r.id} gap={2} className={styles.card}>
                    <Row justify="between">
                        <strong>{r.area_label}</strong>
                        <StatusPill map={STAGES} value={r.etapa} />
                    </Row>
                    <p className={`${styles.pre_wrap} ${styles.mt_0} ${styles.mb_0}`}>{r.objetivo}</p>
                    <div className={styles.muted}>Pedido em {fmtDateTime(r.criado_em)}{r.desejado_para ? ` · desejado para ${fmtDate(r.desejado_para)}` : ''}</div>
                    {r.proposta && (
                        <div className={`${styles.card} ${styles.bg_soft}`}>
                            <div className={styles.card_title}>Proposta da Cadrius</div>
                            <p className={styles.pre_wrap}>{r.proposta}</p>
                            <div className={styles.muted}>Prazo: {r.prazo_dias ? `${r.prazo_dias} dia(s)` : '—'} · Custo: {r.custo_centavos ? brl(r.custo_centavos) : 'sem custo (incluído no plano)'}</div>
                        </div>
                    )}
                    <Row gap={1}>
                        <Button size="sm" onClick={() => onOpen(r.chamado_id)}>Abrir conversa</Button>
                        {r.etapa === 'proposta' && canApprove && <Button size="sm" variant="primary" onClick={() => decide(r, 'aprovar')}>Aprovar proposta</Button>}
                        {r.etapa === 'proposta' && !canApprove && <span className={styles.muted}>Aguardando o dono ou administrador aprovar.</span>}
                        {['recebido', 'em_analise', 'proposta', 'aprovado'].includes(r.etapa) && <Button size="sm" variant="ghost" onClick={() => decide(r, 'cancelar')}>Cancelar pedido</Button>}
                    </Row>
                </Stack>
            ))}
        </Stack>
    );
}
