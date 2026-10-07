import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiUserPlus } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import { Banner, Pill, StatCard, errorMessage } from '../seguranca/ui';
import api from '../../services/api';

const ROLE_LABEL = { owner: 'Dono', administrador: 'Administrador', advogado_pleno: 'Membro', membro: 'Membro', member: 'Membro', viewer: 'Somente leitura', leitor: 'Somente leitura' };

// Barra de uso do mês. Sem cota individual, a pessoa usa os créditos do escritório.
function UsageBar({ used, limit }) {
    if (limit == null) return <span>{used} usado(s) <span className={ui.muted}>· sem cota</span></span>;
    const pct = limit ? Math.min(Math.round((used / limit) * 100), 100) : 100;
    return (
        <div style={{ display: 'grid', gap: 4, minWidth: 140 }}>
            <span>{used} / {limit} <span className={ui.muted}>({pct}%)</span></span>
            <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct} aria-label="Uso da cota"
                style={{ height: 6, borderRadius: 3, background: 'var(--c-border)' }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 3, background: pct >= 90 ? 'var(--c-danger)' : 'var(--c-primary)' }} />
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
        <div className={ui.overlay} role="dialog" aria-modal="true" aria-labelledby="quota-title">
            <form className={ui.modal} onSubmit={save} style={{ maxWidth: 440 }}>
                <div id="quota-title" className={ui.modal_title}>Cota mensal de {member.nome}</div>
                <label className={ui.field}>Créditos por mês (vazio = sem cota; usa os do escritório)
                    <input id="quota-value" className={ui.input} type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
                </label>
                <div className={ui.btn_row} style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className={ui.btn} onClick={onClose}>Cancelar</button>
                    <button type="submit" className={`${ui.btn} ${ui.btn_primary}`} disabled={busy}>Salvar cota</button>
                </div>
            </form>
        </div>
    );
}

// Equipe (CAD-225): uso real de créditos por pessoa e do escritório no mês.
export default function TeamMembers({ members = [], summary, canManage, onInvite, onChanged }) {
    const [editing, setEditing] = useState(null);
    const usage = summary?.uso_por_atividade || [];
    return (
        <div className={ui.stack}>
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
            <section className={ui.card}>
                <div className={ui.btn_row} style={{ justifyContent: 'space-between' }}>
                    <div>
                        <div className={ui.section_title}>Pessoas do escritório</div>
                        <p className={ui.muted}>O uso de cada pessoa é atualizado a cada pedido à IA.</p>
                    </div>
                    {canManage && (
                        <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={onInvite}>
                            <FiUserPlus aria-hidden="true" /> Convidar pessoa
                        </button>
                    )}
                </div>
                <div className={ui.table_wrap} style={{ marginTop: 12 }}>
                    <table className={`${ui.table} ${ui.table_stack}`}>
                        <thead><tr><th>Pessoa</th><th>Cargo</th><th>Grupo de acesso</th><th>Créditos no mês</th><th><span className="sr-only">Ações</span></th></tr></thead>
                        <tbody>
                            {members.map((m) => (
                                <tr key={m.id}>
                                    <td><strong>{m.nome}</strong><div className={ui.muted}>{m.email}</div></td>
                                    <td data-label="Cargo"><Pill tone={['owner', 'administrador'].includes(m.role) ? 'blue' : 'gray'}>{ROLE_LABEL[m.role] || m.role}</Pill></td>
                                    <td data-label="Grupo">{m.grupo?.nome || <span className={ui.muted}>pelo cargo</span>}</td>
                                    <td data-label="Créditos no mês"><UsageBar used={m.creditos_usados || 0} limit={m.creditos_limite} /></td>
                                    <td>{canManage && <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => setEditing(m)}>Definir cota</button>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
            {editing && <QuotaEditor member={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); onChanged?.(); }} />}
        </div>
    );
}
