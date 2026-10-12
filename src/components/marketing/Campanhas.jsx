import { useState } from 'react';
import { toast } from 'react-toastify';
import styles from '../ui/ui.module.css';
import { Button, Chip, Empty, Field, FilterBar, Input, Pill, Row, Stack } from '../ui';
import { errorMessage } from '../../utils/format';
import { CHANNELS, CHANNEL_LABEL } from '../../services/marketing';

const EMPTY = { nome: '', objetivo: '', publico: '', inicio: '', fim: '', canais: [] };

// Campanhas: agrupam conteúdos de um mesmo objetivo
export default function Campanhas({ api, campaigns, reload }) {
    const [form, setForm] = useState(EMPTY);
    const add = async (e) => {
        e.preventDefault();
        try { await api.addCampaign(form); toast.success('Campanha criada.'); setForm(EMPTY); reload(); }
        catch (err) { toast.error(errorMessage(err)); }
    };
    const toggle = (k) => setForm((f) => ({ ...f, canais: f.canais.includes(k) ? f.canais.filter((c) => c !== k) : [...f.canais, k] }));
    const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });
    return (
        <Stack>
            <Stack as="form" className={styles.card} onSubmit={add}>
                <FilterBar>
                    <Field label="Nome"><Input value={form.nome} required onChange={set('nome')} /></Field>
                    <Field label="Objetivo"><Input value={form.objetivo} onChange={set('objetivo')} /></Field>
                    <Field label="Público"><Input value={form.publico} onChange={set('publico')} /></Field>
                    <Field label="Início"><Input type="date" value={form.inicio} onChange={set('inicio')} /></Field>
                    <Field label="Fim"><Input type="date" value={form.fim} onChange={set('fim')} /></Field>
                </FilterBar>
                <Row role="group" aria-label="Canais da campanha">
                    {CHANNELS.map(([k, l]) => <Chip key={k} active={form.canais.includes(k)} onClick={() => toggle(k)}>{l}</Chip>)}
                </Row>
                <Button type="submit" variant="primary" className={styles.w_fit}>Criar campanha</Button>
            </Stack>
            {campaigns.length === 0 && <Empty title="Nenhuma campanha ainda">Agrupe conteúdos de um mesmo objetivo (ex.: "Mês do consumidor").</Empty>}
            <div className={styles.card_grid}>
                {campaigns.map((c) => (
                    <Stack key={c.id} gap={2} className={styles.card}>
                        <strong>{c.nome}</strong>
                        <div className={styles.muted}>{c.objetivo}</div>
                        <Row gap={1}>{c.canais.map((k) => <Pill key={k} tone="blue">{CHANNEL_LABEL[k]}</Pill>)}</Row>
                        <div className={`${styles.muted} ${styles.text_xs}`}>{c.conteudos} conteúdo(s)</div>
                        <Button size="sm" variant="danger" className={styles.w_fit}
                            onClick={() => window.confirm(`Excluir a campanha "${c.nome}"? Os conteúdos ficam.`) && api.removeCampaign(c.id).then(reload)}>Excluir</Button>
                    </Stack>
                ))}
            </div>
        </Stack>
    );
}
