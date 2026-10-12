import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Button, Checkbox, Chip, Field, Input, Row, Select, Stack, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { CHANNELS } from '../../services/marketing';

// Novo conteúdo (com ou sem IA) + ideias de pauta que preenchem o tema
export default function CriarConteudo({ api, scope, ideas, campaigns, onCreated }) {
    const [form, setForm] = useState({ canal: 'instagram', tema: '', orientacoes: '', usar_ia: true, campanha_id: '' });
    const [busy, setBusy] = useState(false);
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            const x = await api.generate({ ...form, campanha_id: form.campanha_id || null });
            toast.success(x.ia ? 'Rascunho criado com IA. Revise antes de aprovar.' : 'Esqueleto criado. Complete os trechos [COMPLETAR].');
            if (x.aviso) toast.info(x.aviso);
            setForm((f) => ({ ...f, tema: '', orientacoes: '' }));
            onCreated(x.id);
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const pick = (tema) => setForm((f) => ({ ...f, tema }));
    return (
        <div className={styles.two_col}>
            <Stack as="form" className={styles.card} onSubmit={submit}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Novo conteúdo</div>
                <Field label="Canal">
                    <Select value={form.canal} onChange={(e) => setForm({ ...form, canal: e.target.value })}>
                        {CHANNELS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </Select>
                </Field>
                <Field label="Tema">
                    <Input value={form.tema} maxLength={200} required onChange={(e) => setForm({ ...form, tema: e.target.value })}
                        placeholder={scope === 'cadrius' ? 'Ex.: como evitar perder prazos do DJEN' : 'Ex.: prazo para reclamar de produto com defeito'} />
                </Field>
                <Field label="Orientações (opcional)">
                    <Textarea value={form.orientacoes} maxLength={1000} onChange={(e) => setForm({ ...form, orientacoes: e.target.value })}
                        placeholder="Público, enfoque, exemplo a usar…" />
                </Field>
                {campaigns.length > 0 && (
                    <Field label="Campanha">
                        <Select value={form.campanha_id} onChange={(e) => setForm({ ...form, campanha_id: e.target.value })}>
                            <option value="">— nenhuma —</option>{campaigns.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
                        </Select>
                    </Field>
                )}
                <Checkbox checked={form.usar_ia} onChange={(e) => setForm({ ...form, usar_ia: e.target.checked })}>Escrever com IA</Checkbox>
                <Button type="submit" variant="primary" className={styles.w_fit} loading={busy} loadingLabel="Gerando…">Gerar rascunho</Button>
            </Stack>
            <Stack className={styles.card}>
                <div className={`${styles.section_title} ${styles.mb_0}`}>Ideias de pauta</div>
                {(ideas?.datas || []).length > 0 && (
                    <Stack gap={2}>
                        <div className={`${styles.muted} ${styles.text_xs}`}>Próximas datas</div>
                        {ideas.datas.slice(0, 5).map((d) => (
                            <Chip key={d.data + d.tema} className={styles.chip_wide} onClick={() => pick(d.tema)}>
                                <strong>{new Date(`${d.data}T12:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</strong> {d.ocasiao}: {d.tema}
                            </Chip>
                        ))}
                    </Stack>
                )}
                <div className={`${styles.muted} ${styles.text_xs}`}>Temas sempre úteis</div>
                <Row>
                    {(ideas?.temas || []).slice(0, 12).map((t) => (
                        <Chip key={t.tema} title={t.angulo || ''} onClick={() => pick(t.tema)}>{t.tema}</Chip>
                    ))}
                </Row>
                {scope === 'escritorio' && <p className={`${styles.muted} ${styles.text_xs} ${styles.mb_0}`}>As áreas vêm do Perfil do escritório (IA do escritório → Perfil).</p>}
            </Stack>
        </div>
    );
}
