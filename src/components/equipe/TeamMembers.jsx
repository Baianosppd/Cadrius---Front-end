import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiUserPlus } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import s from './Equipe.module.css';
import { Banner, Button, Field, FormModal, Input, Pill, Row, Stack, StatCard, Table } from '../ui';
import { errorMessage } from '../../utils/format';
import api from '../../services/api';

const ROLE_LABEL = { owner: 'Dono', administrador: 'Administrador', advogado_pleno: 'Membro', membro: 'Membro', member: 'Membro', viewer: 'Somente leitura', leitor: 'Somente leitura' };

// Barra de uso do mês. Sem cota individual, a pessoa usa os créditos do escritório.
function UsageBar({ used, limit }) {
    if (limit == null) return <span>{used} usado(s) <span className={ui.muted}>· sem cota</span></span>;
    const pct = limit ? Math.min(Math.round((used / limit) * 100), 100) : 100;
    return (
        <div className={s.usage}>
            <span>{used} / {limit} <span className={ui.muted}>({pct}%)</span></span>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Uso da cota" className={s.usage_track}>
                <div className={`${s.usage_fill} ${pct >= 90 ? s.usage_fill_high : ''}`} style={{ width: `${pct}%` }} />
            </div>
        </div>
    );
}

function QuotaEditor({ member, onClose, onSaved }) {
    const [value, setValue] = useState(member.creditos_limite ?? '');
    const [busy, setBusy] = useState(false);
    const save = async (e) => {
        e.preventDefault();
        setBusy(true);
        try {
            await api.patch(`teams/members/${member.id}/credits/`, { creditos_limite: value === '' ? null : Number(value) });
            toast.success('Cota atualizada.');
            onSaved();
        } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    return (
        <FormModal title={`Cota mensal de ${member.nome}`} size="sm" onClose={onClose} onSubmit={save} busy={busy} submitLabel="Salvar cota">
            <Field label="Créditos por mês" hint="Vazio = sem cota; a pessoa usa os créditos do escritório.">
                <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
            </Field>
        </FormModal>
    );
}

// Equipe (CAD-225): uso real de créditos por pessoa e do escritório no mês.
export default function TeamMembers({ members = [], summary, canManage, onInvite, onChanged }) {
    const [editing, setEditing] = useState(null);
    const usage = summary?.uso_por_atividade || [];
    return (
        <Stack>
            {summary && (
                <div className={ui.grid}>
                    <StatCard title="Créditos usados no mês" value={`${summary.creditos_usados} / ${summary.creditos_total}`}
                        tone={summary.creditos_disponiveis <= summary.creditos_total * 0.1 ? 'red' : undefined}
                        note={`${summary.creditos_disponiveis} restantes do plano${summary.creditos_avulsos ? ` + ${summary.creditos_avulsos} avulsos` : ''}`} />
                    <StatCard title="Distribuídos em cotas" value={summary.creditos_distribuidos}
                        note={`${summary.creditos_nao_distribuidos} livres para quem não tem cota`} />
                    <StatCard title="Pedidos à IA no mês" value={usage.reduce((a, r) => a + r.pedidos, 0)}
                        note={usage.slice(0, 3).map((r) => `${r.rotulo}: ${r.pedidos}`).join(' · ') || 'Nenhum ainda'} />
                </div>
            )}
            {summary && summary.creditos_disponiveis <= 0 && !summary.creditos_avulsos && (
                <Banner tone="warn">Os créditos do mês acabaram. Compre um pacote em Perfil → Assinatura e créditos ou aguarde o próximo mês.</Banner>
            )}
            <Stack as="section" gap={3} className={ui.card}>
                <Row justify="between">
                    <div>
                        <div className={`${ui.section_title} ${ui.mb_0}`}>Pessoas do escritório</div>
                        <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>O uso de cada pessoa é atualizado a cada pedido à IA.</p>
                    </div>
                    {canManage && <Button variant="primary" icon={FiUserPlus} onClick={onInvite}>Convidar pessoa</Button>}
                </Row>
                <Table flat columns={['Pessoa', 'Cargo', 'Grupo de acesso', 'Créditos no mês', { label: <span className={ui.sr_only}>Ações</span>, className: ui.td_actions }]}>
                    {members.map((m) => (
                        <tr key={m.id}>
                            <td><strong>{m.nome}</strong><div className={ui.muted}>{m.email}</div></td>
                            <td data-label="Cargo"><Pill tone={['owner', 'administrador'].includes(m.role) ? 'blue' : 'gray'}>{ROLE_LABEL[m.role] || m.role}</Pill></td>
                            <td data-label="Grupo">{m.grupo?.nome || <span className={ui.muted}>pelo cargo</span>}</td>
                            <td data-label="Créditos no mês"><UsageBar used={m.creditos_usados || 0} limit={m.creditos_limite} /></td>
                            <td className={ui.td_actions}>{canManage && <Button size="sm" onClick={() => setEditing(m)}>Definir cota</Button>}</td>
                        </tr>
                    ))}
                </Table>
            </Stack>
            {editing && <QuotaEditor member={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged?.(); }} />}
        </Stack>
    );
}
