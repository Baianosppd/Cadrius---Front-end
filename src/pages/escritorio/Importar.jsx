import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import styles from '../../components/seguranca/seguranca.module.css';
import { Banner, Empty, PageHeader, Pill, StatCard, errorMessage, fmtDateTime } from '../../components/seguranca/ui';
import useLoader from '../gestao/useLoader';
import { ACTION_TONE, MAX_MB, TARGETS, importsApi, missingRequired, setColumnField } from '../../services/imports';

function Historico({ tick }) {
    const { data } = useLoader(importsApi.list, [tick]);
    if (!data?.length) return null;
    return (
        <div className={styles.table_wrap}>
            <table className={styles.table}>
                <thead><tr><th>Quando</th><th>Arquivo</th><th>Destino</th><th>Situação</th><th>Resultado</th></tr></thead>
                <tbody>{data.map((j) => (
                    <tr key={j.id}><td>{fmtDateTime(j.created_at)}</td><td>{j.filename}</td><td>{j.target_label}</td><td>{j.status_label}</td>
                        <td>{j.status === 'done' ? `${j.summary.created} criados · ${j.summary.updated} atualizados · ${j.summary.errors} com erro` : '—'}</td></tr>
                ))}</tbody>
            </table>
        </div>
    );
}

export default function Importar() {
    const [target, setTarget] = useState('contacts');
    const [file, setFile] = useState(null);
    const [job, setJob] = useState(null);
    const [mapping, setMapping] = useState({});
    const [preview, setPreview] = useState(null);
    const [result, setResult] = useState(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [tick, setTick] = useState(0);

    const run = async (fn) => {
        setBusy(true);
        setError('');
        try { await fn(); } catch (err) { setError(errorMessage(err)); } finally { setBusy(false); }
    };
    const reset = () => { setJob(null); setPreview(null); setResult(null); setFile(null); setMapping({}); setTick((t) => t + 1); };
    const upload = () => run(async () => {
        if (!file) throw new Error('Escolha um arquivo.');
        const j = await importsApi.upload(file, target);
        setJob(j);
        setMapping(j.mapping);
    });
    const simulate = () => run(async () => { setPreview(await importsApi.preview(job.id, mapping)); });
    const commit = () => run(async () => {
        const done = await importsApi.commit(job.id);
        setResult(done);
        toast.success('Importação concluída.');
        setTick((t) => t + 1);
    });
    const missing = job ? missingRequired(job.fields, mapping) : [];

    return (
        <div className={styles.page}>
            <PageHeader title="Importar dados" subtitle="Contatos e processos de planilhas" />
            {error && <Banner tone="error">{error}</Banner>}

            {!job && (
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 640 }}>
                    <div className={styles.section_title}>1. Escolha o arquivo</div>
                    <label className={styles.field}>O que você vai importar
                        <select className={styles.select} value={target} onChange={(e) => setTarget(e.target.value)}>{TARGETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select>
                    </label>
                    <label className={styles.field}>Planilha (.csv ou .xlsx, até {MAX_MB} MB e 5.000 linhas; 1ª linha com os nomes das colunas)
                        <input className={styles.input} type="file" accept=".csv,.xlsx,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                    </label>
                    <div><button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={upload} disabled={busy || !file}>{busy ? 'Lendo…' : 'Ler planilha'}</button></div>
                </div>
            )}

            {job && !result && (
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className={styles.section_title}>2. Confira as colunas — {job.filename} ({job.rows_total} linhas)</div>
                    <p className={styles.muted}>Sugerimos o campo de cada coluna pelo nome dela. Ajuste o que precisar; colunas sem campo são ignoradas.</p>
                    <div className={styles.table_wrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Coluna da planilha</th><th>Exemplo</th><th>Vai para</th></tr></thead>
                            <tbody>{job.columns.map((col, i) => (
                                <tr key={i}><td><strong>{col}</strong></td><td className={styles.muted}>{job.sample?.[0]?.[i] || '—'}</td>
                                    <td><select className={styles.select} value={mapping[String(i)] || ''} onChange={(e) => { setMapping((m) => setColumnField(m, i, e.target.value)); setPreview(null); }}>
                                        <option value="">— ignorar —</option>
                                        {job.fields.map((f) => <option key={f.key} value={f.key}>{f.label}{f.required ? ' *' : ''}</option>)}
                                    </select></td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {missing.length > 0 && <Banner tone="warn">Falta escolher a coluna de: {missing.join(', ')}.</Banner>}
                    <div className={styles.btn_row}>
                        <button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={simulate} disabled={busy || missing.length > 0}>3. Simular</button>
                        <button type="button" className={styles.btn} onClick={() => run(async () => { await importsApi.cancel(job.id); reset(); })} disabled={busy}>Cancelar</button>
                    </div>
                </div>
            )}

            {preview && !result && (
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className={styles.section_title}>Simulação (nada foi gravado)</div>
                    <div className={styles.grid}>
                        <StatCard title="Serão criados" value={preview.counts.create} tone="green" />
                        <StatCard title="Serão atualizados" value={preview.counts.update} />
                        <StatCard title="Com erro (ficam de fora)" value={preview.counts.errors} tone={preview.counts.errors ? 'red' : undefined} />
                    </div>
                    <div className={styles.table_wrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Linha</th><th>O que acontece</th><th>Detalhe</th></tr></thead>
                            <tbody>{preview.preview.map((r) => (
                                <tr key={r.row}><td>{r.row}</td><td><Pill tone={ACTION_TONE[r.action]}>{r.action}</Pill></td>
                                    <td>{r.errors.length ? r.errors.join(' ') : (r.values.name || r.values.cnj || '')}</td></tr>
                            ))}</tbody>
                        </table>
                    </div>
                    {preview.counts.create + preview.counts.update > 0
                        ? <div><button type="button" className={`${styles.btn} ${styles.btn_primary}`} onClick={commit} disabled={busy}>4. Importar {preview.counts.create + preview.counts.update} linhas</button></div>
                        : <Banner tone="warn">Nenhuma linha válida para importar. Corrija a planilha e envie de novo.</Banner>}
                </div>
            )}

            {result && (
                <div className={styles.card} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div className={styles.section_title}>Importação concluída</div>
                    <p>{result.summary.created} criados · {result.summary.updated} atualizados · {result.summary.skipped} sem mudança · {result.summary.errors} com erro.</p>
                    {result.errors.length > 0 && <Banner tone="warn">Linhas com erro: {result.errors.map((e) => `${e.row} (${e.errors.join(' ')})`).join('; ')}</Banner>}
                    <div className={styles.btn_row}>
                        <Link className={`${styles.btn} ${styles.btn_primary}`} to={result.target === 'contacts' ? '/contatos' : '/processos'}>Ver {result.target === 'contacts' ? 'contatos' : 'processos'}</Link>
                        <button type="button" className={styles.btn} onClick={reset}>Importar outra planilha</button>
                    </div>
                </div>
            )}
            <div className={styles.section_title}>Importações anteriores</div>
            <Historico tick={tick} />
            {!job && <Empty>Dica: exporte a planilha do seu sistema antigo ou do Excel como CSV (UTF-8) ou .xlsx.</Empty>}
        </div>
    );
}
