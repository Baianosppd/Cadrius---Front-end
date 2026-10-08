import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Empty, errorMessage, fmtDate, fmtDateTime, Loading, StatusPill } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
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
        <form className={styles.card} onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 760 }}>
            <div className={styles.section_title}>Pedir parametrização</div>
            <p className={styles.muted}>Precisa de uma automação, relatório, modelo, integração ou rotina específica do seu escritório? Descreva aqui. A equipe Cadrius
                analisa, envia uma proposta (o que será feito, prazo e, se houver, custo) e só executa depois que o dono ou administrador aprovar.</p>
            <div className={styles.filters}>
                <label className={styles.field}>Área<select className={styles.select} value={f.area} onChange={set('area')}>
                    {(data?.areas || [{ chave: 'automacao', rotulo: 'Automação / gatilho' }]).map((a) => <option key={a.chave} value={a.chave}>{a.rotulo}</option>)}</select></label>
                <label className={styles.field} style={{ flex: 2 }}>Título (opcional)<input className={styles.input} value={f.titulo} onChange={set('titulo')} maxLength={200} /></label>
            </div>
            {hint && <Banner tone="info">{hint}</Banner>}
            <label className={styles.field}>O que você precisa e por quê?<textarea className={styles.textarea} required minLength={20} value={f.objetivo} onChange={set('objetivo')} /></label>
            <label className={styles.field}>Exemplo concreto / como é feito hoje (opcional)<textarea className={styles.textarea} value={f.exemplo} onChange={set('exemplo')} /></label>
            <div className={styles.filters}>
                <label className={styles.field}>Com que frequência acontece?<input className={styles.input} value={f.frequencia} onChange={set('frequencia')} placeholder="ex.: toda publicação nova" maxLength={40} /></label>
                <label className={styles.field}>Pessoas que usam<input className={styles.input} type="number" min={1} max={500} value={f.pessoas} onChange={set('pessoas')} /></label>
                <label className={styles.field}>Para quando?<input className={styles.input} type="date" value={f.desejado_para} onChange={set('desejado_para')} /></label>
            </div>
            <Banner tone="info">Não envie senhas nem dados de clientes. Se a equipe precisar ver algo, você autoriza o acesso assistido no chamado.</Banner>
            {error && <Banner tone="error">{error}</Banner>}
            <div className={styles.btn_row}>
                <button type="submit" className={`${styles.btn} ${styles.btn_primary}`} disabled={busy}>Enviar pedido</button>
                <button type="button" className={styles.btn} onClick={onCancel}>Cancelar</button>
            </div>
        </form>
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
        <div className={styles.stack}>
            <div className={styles.section_title}>Pedidos de parametrização</div>
            {data.resultados.map((r) => (
                <div key={r.id} className={styles.card}>
                    <div className={styles.btn_row} style={{ justifyContent: 'space-between' }}>
                        <strong>{r.area_label}</strong>
                        <StatusPill map={STAGES} value={r.etapa} />
                    </div>
                    <p style={{ whiteSpace: 'pre-wrap' }}>{r.objetivo}</p>
                    <div className={styles.muted}>Pedido em {fmtDateTime(r.criado_em)}{r.desejado_para ? ` · desejado para ${fmtDate(r.desejado_para)}` : ''}</div>
                    {r.proposta && (
                        <div className={styles.card} style={{ marginTop: 8 }}>
                            <div className={styles.card_title}>Proposta da Cadrius</div>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{r.proposta}</p>
                            <div className={styles.muted}>Prazo: {r.prazo_dias ? `${r.prazo_dias} dia(s)` : '—'} · Custo: {r.custo_centavos ? brl(r.custo_centavos) : 'sem custo (incluído no plano)'}</div>
                        </div>
                    )}
                    <div className={styles.btn_row} style={{ marginTop: 8 }}>
                        <button type="button" className={`${styles.btn} ${styles.btn_sm}`} onClick={() => onOpen(r.chamado_id)}>Abrir conversa</button>
                        {r.etapa === 'proposta' && canApprove && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_primary}`} onClick={() => decide(r, 'aprovar')}>Aprovar proposta</button>}
                        {r.etapa === 'proposta' && !canApprove && <span className={styles.muted}>Aguardando o dono ou administrador aprovar.</span>}
                        {['recebido', 'em_analise', 'proposta', 'aprovado'].includes(r.etapa) && <button type="button" className={`${styles.btn} ${styles.btn_sm} ${styles.btn_ghost}`} onClick={() => decide(r, 'cancelar')}>Cancelar pedido</button>}
                    </div>
                </div>
            ))}
        </div>
    );
}
