import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import s from './IA.module.css';
import { Banner, Button, Pill, Row, Stack } from '../ui';
import { errorMessage } from '../../utils/format';
import useLoader from '../../hooks/useLoader';
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
    const refresh = () => act('refresh', () => brainApi.refreshSuggestions())
        .then((r) => r && toast.info(r.novas ? `${r.novas} sugestão(ões) nova(s).` : 'Nenhum padrão novo por enquanto.'));
    return (
        <Stack gap={3} className={`${styles.card} ${open.length ? s.card_highlight : ''}`}>
            <Row justify="between">
                <div>
                    <div className={`${styles.section_title} ${styles.mb_0}`}>Sugestões da IA {open.length > 0 && <Pill tone="blue">{open.length}</Pill>}</div>
                    <div className={styles.muted}>Com base no que a equipe tem feito. Nada liga sem você simular e aprovar.</div>
                </div>
                {canManage && <Button size="sm" loading={busy === 'refresh'} loadingLabel="Analisando…" onClick={refresh}>Analisar agora</Button>}
            </Row>
            {data && open.length === 0 && <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>Nenhuma sugestão aberta. A análise roda todo dia.</p>}
            {open.map((sug) => (
                <Stack key={sug.id} gap={2} className={styles.card}>
                    <strong>{sug.titulo}</strong>
                    <p className={`${styles.muted} ${styles.mt_0} ${styles.mb_0}`}>{sug.motivo}</p>
                    {canManage ? (
                        <Row>
                            <Button size="sm" variant="primary" disabled={busy === sug.id}
                                onClick={() => act(sug.id, () => brainApi.acceptSuggestion(sug.id), 'Regra criada (desligada). Revise, simule e ligue.').then((r) => r && onAccepted?.(r.regra_id))}>
                                Criar a regra
                            </Button>
                            <Button size="sm" disabled={busy === sug.id}
                                onClick={() => act(sug.id, () => brainApi.dismissSuggestion(sug.id), 'Ok, não sugeriremos isso pelos próximos 60 dias.')}>
                                Agora não
                            </Button>
                        </Row>
                    ) : <Banner tone="info">Peça ao dono ou administrador para avaliar esta sugestão.</Banner>}
                </Stack>
            ))}
        </Stack>
    );
}
