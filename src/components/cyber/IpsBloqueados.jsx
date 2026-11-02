import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiShieldOff } from 'react-icons/fi';
import styles from '../ui/ui.module.css';
import { Banner, Button, Empty, Field, FormModal, Input, Pill, Select, Stack, Table, Textarea } from '../ui';
import { errorMessage, fmtDateTime } from '../../utils/format';
import { backofficeApi } from '../../services/backoffice';
import { n, off } from './util';

export function BlockModal({ initial = '', onClose, onDone }) {
    const [rede, setRede] = useState(initial);
    const [horas, setHoras] = useState('24');
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const submit = async (e) => {
        e.preventDefault();
        if (reason.trim().length < 10) { setError('Informe o motivo (mínimo 10 caracteres).'); return; }
        setBusy(true);
        setError('');
        try {
            await backofficeApi.blockIp({ rede: rede.trim(), horas: horas === 'sempre' ? '' : horas, reason: reason.trim() });
            toast.success('IP bloqueado em todo o sistema.');
            onDone();
        } catch (err) {
            setError(errorMessage(err));
        } finally {
            setBusy(false);
        }
    };
    return (
        <FormModal title="Bloquear IP ou faixa" onClose={onClose} onSubmit={submit} busy={busy} error={error}
            submitLabel="Bloquear" busyLabel="Bloqueando…" submitVariant="danger">
            <Field label="IP ou faixa (CIDR)">
                <Input value={rede} onChange={(e) => setRede(e.target.value)} placeholder="203.0.113.7 ou 203.0.113.0/24" required />
            </Field>
            <Field label="Prazo">
                <Select value={horas} onChange={(e) => setHoras(e.target.value)}>
                    <option value="1">1 hora</option><option value="24">24 horas</option><option value="168">7 dias</option>
                    <option value="720">30 dias</option><option value="sempre">Até liberar manualmente</option>
                </Select>
            </Field>
            <Field label="Motivo" hint="Fica na auditoria.">
                <Textarea value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
            </Field>
            <Banner tone="warn">Bloqueia o acesso a todo o Cadrius a partir desse endereço. Redes internas e o seu próprio IP não podem ser bloqueados.</Banner>
        </FormModal>
    );
}

export default function IpsBloqueados({ rows, reload }) {
    const [open, setOpen] = useState(false);
    const [releasing, setReleasing] = useState(null);
    if (off(rows)) return <Banner tone="error">Lista indisponível.</Banner>;
    const remove = async (id) => {
        setReleasing(id);
        try {
            await backofficeApi.unblockIp(id);
            toast.success('IP liberado.');
            reload();
        } catch (e) {
            toast.error(errorMessage(e));
        } finally {
            setReleasing(null);
        }
    };
    return (
        <Stack gap={3}>
            <Button variant="primary" icon={FiShieldOff} className={styles.w_fit} onClick={() => setOpen(true)}>Bloquear IP ou faixa</Button>
            {rows.length === 0 ? <Empty title="Nenhum IP bloqueado">Bloqueie endereços que insistem em ataques de senha ou varredura (dá para escolher um prazo).</Empty> : (
                <Table columns={['IP / faixa', 'Motivo', 'Situação', 'Tentativas barradas', 'Criado', { label: '', className: styles.td_actions }]}>
                    {rows.map((b) => (
                        <tr key={b.id}>
                            <td className={styles.mono}>{b.rede}</td>
                            <td data-label="Motivo">{b.motivo}</td>
                            <td data-label="Situação">{b.ativo ? <Pill tone="red">{b.expira_em ? `Até ${fmtDateTime(b.expira_em)}` : 'Permanente'}</Pill> : <Pill tone="gray">Expirado</Pill>}</td>
                            <td data-label="Tentativas barradas">{n(b.tentativas_barradas)}{b.ultima_tentativa ? ` · última ${fmtDateTime(b.ultima_tentativa)}` : ''}</td>
                            <td data-label="Criado">{fmtDateTime(b.criado_em)}</td>
                            <td className={styles.td_actions}><Button size="sm" loading={releasing === b.id} onClick={() => remove(b.id)}>Liberar</Button></td>
                        </tr>
                    ))}
                </Table>
            )}
            {open && <BlockModal onClose={() => setOpen(false)} onDone={() => { setOpen(false); reload(); }} />}
        </Stack>
    );
}
