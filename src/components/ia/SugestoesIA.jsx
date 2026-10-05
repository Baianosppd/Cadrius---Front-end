import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../seguranca/seguranca.module.css';
import { Banner, Pill, errorMessage } from '../seguranca/ui';
import useLoader from '../../pages/gestao/useLoader';
import { brainApi } from '../../services/brain';

// Fase E (CAD-174): a IA observa o escritório e sugere automações prontas. Aceitar cria a regra DESLIGADA (simule e ligue).
export default function SugestoesIA({ canManage, onAccepted }) {
    const { data, error, reload } = useLoader(() => brainApi.suggestions(), []);
    const [busy, setBusy] = useState(null);
    const act = async (key, fn, ok) => {
        setBusy(key);
        try { const r = await fn(); if (ok) toast.success(ok); reload(); return r; } catch (err) { toast.error(errorMessage(err)); return null; } finally { setBusy(null); }
    };
    if (error) return null;
    const open = data?.abertas || [];
    return (
        <div className={styles.card} style={{ borderColor: open.length ? '#bfdbfe' : undefined, background: open.length ? '#f8fbff' : undefined }}>
            <div className={styles.header_row} style={{ alignItems: 'center' }}>
                <div>
                    <div className={styles.section_title} style={{ marginBottom: 2 }}>Sugestões da IA {open.length > 0 && <Pill tone="blue">{open.length}</Pill>}</div>
                    <div className={styles.muted} style={{ fontSize: '.85rem' }}>Com base no que a equipe tem feito. Nada liga sem você simular e aprovar.</div>
                </div>
                {canManage && (
                    <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={busy === 'refresh'}
                        onClick={() => act('refresh', () => brainApi.refreshSuggestions()).then((r) => r && toast.info(r.novas ? `${r.novas} sugestão(ões) nova(s).` : 'Nenhum padrão novo por enquanto.'))}>
                        {busy === 'refresh' ? 'Analisando…' : 'Analisar agora'}
                    </button>
                )}
            </div>
            {data && open.length === 0 && <p className={styles.muted} style={{ marginTop: 10, fontSize: '.88rem' }}>Nenhuma sugestão aberta. A análise roda todo dia.</p>}
            <div className={styles.stack} style={{ marginTop: open.length ? 12 : 0 }}>
                {open.map((s) => (
                    <div key={s.id} className={styles.card} style={{ padding: 14 }}>
                        <strong>{s.titulo}</strong>
                        <p className={styles.muted} style={{ fontSize: '.86rem', margin: '4px 0 10px' }}>{s.motivo}</p>
                        {canManage ? (
                            <div className={styles.btn_row}>
                                <button type="button" className={`${styles.btn} ${styles.btn_primary} ${styles.btn_sm}`} disabled={busy === s.id}
                                    onClick={() => act(s.id, () => brainApi.acceptSuggestion(s.id), 'Regra criada (desligada). Revise, simule e ligue.').then((r) => r && onAccepted?.(r.regra_id))}>
                                    Criar a regra
                                </button>
                                <button type="button" className={`${styles.btn} ${styles.btn_sm}`} disabled={busy === s.id}
                                    onClick={() => act(s.id, () => brainApi.dismissSuggestion(s.id), 'Ok, não sugeriremos isso pelos próximos 60 dias.')}>
                                    Agora não
                                </button>
                            </div>
                        ) : <Banner tone="info">Peça ao dono ou administrador para avaliar esta sugestão.</Banner>}
                    </div>
                ))}
            </div>
        </div>
    );
}
