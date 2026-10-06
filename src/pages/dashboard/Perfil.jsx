import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
import styles from './Perfil.module.css';

import ProfileInfo from '../../components/ui/ProfileInfo.jsx';
import ChangePassword from '../../components/ui/ChangePassword.jsx';
import MfaCard from '../../components/seguranca/MfaCard.jsx';
import PlanCard from '../../components/ui/Cards/PlanCard.jsx';
import { toast } from 'react-toastify';
import ui from '../../components/seguranca/seguranca.module.css';
import { PageHeader } from '../../components/seguranca/ui';
import useAuth from '../../hooks/useAuth';
import usePaymentReturn from '../../hooks/usePaymentReturn';
import { getCurrentPlan, getCreditPacks, startCreditCheckout, creditsNotice, validatePromo, startSubscriptionCheckout, redeemPromo } from '../../services/billing';

function Perfil() {
    usePaymentReturn();
    const [user, setUser] = useState(null);
    const [billing, setBilling] = useState(null);   // GET /api/billing/plans/current/ (plano REAL do escritório + assinatura)
    const [packs, setPacks] = useState([]);
    const [promo, setPromo] = useState('');
    const [promoInfo, setPromoInfo] = useState({});   // planId → prévia do desconto
    const { isOrgManager } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        api.get('auth/user/')
            .then(response => setUser(response.data))
            .catch(error => console.error("Erro ao carregar perfil:", error));

        getCurrentPlan().then(setBilling).catch(() => setBilling(null));   // 403 = usuário sem escritório (equipe)
        getCreditPacks().then(setPacks).catch(() => setPacks([]));
    }, []);

    const buyCredits = async (packId) => {
        try { await startCreditCheckout(packId); }
        catch (err) { toast.error(err?.response?.data?.detail || 'Não foi possível iniciar o pagamento.'); }
    };

    const checkPromo = async (planId) => {
        if (!promo.trim()) return;
        try {
            const r = await validatePromo(planId, promo.trim());
            setPromoInfo((p) => ({ ...p, [planId]: r }));
            if (!r.valid) toast.warn(r.detail);
            else if (r.kind === 'trial') await redeemTrial();
        } catch (err) { toast.error(err?.response?.data?.detail || 'Não foi possível validar o cupom.'); }
    };

    // Cupom de dias extras de teste (CAD-224): vale na hora, sem pagamento.
    const redeemTrial = async () => {
        try {
            const r = await redeemPromo(promo.trim());
            toast.success(`Cupom aplicado: +${r.dias} dias de teste (até ${new Date(r.teste_ate).toLocaleDateString('pt-BR')}).`);
            setPromo(''); setPromoInfo({});
            getCurrentPlan().then(setBilling).catch(() => {});
        } catch (err) { toast.error(err?.response?.data?.detail || 'Não foi possível aplicar o cupom.'); }
    };

    const subscribe = async (planId) => {
        try { await startSubscriptionCheckout(planId, promo.trim()); }
        catch (err) { toast.error(err?.response?.data?.detail || 'Não foi possível iniciar o pagamento.'); }
    };

    const handleSave = async (data) => {
        try {
            const response = await api.patch('auth/profile/', {
                first_name: data.nome.split(' ')[0] || '',
                last_name: data.nome.split(' ').slice(1).join(' ') || '',
                phone: data.telefone,
                oab_number: data.oab,
            });
            setUser(response.data);
            toast.success('Perfil atualizado com sucesso!');
        } catch (err) {
            toast.error('Erro ao salvar perfil. Tente novamente.');
        }
    };


    const handlePhotoChange = async (file) => {
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);  // 👈 era foto
            const response = await api.patch('auth/profile/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setUser(response.data);
            toast.success('Foto atualizada com sucesso!');
        } catch (err) {
            toast.error('Erro ao atualizar foto. Tente novamente.');
        }
    };

    const assinatura = billing?.assinatura;
    const nextBilling = billing?.proxima_cobranca ? new Date(billing.proxima_cobranca).toLocaleDateString('pt-BR') : '—';
    const currentPlan = billing ? { ...billing.plano, billingDate: nextBilling } : null;
    const otherPlans = billing?.outros_planos || [];

    return (
        <div className={styles.perfil_container}>
            <PageHeader title="Meu perfil" subtitle="Seus dados, senha, verificação em duas etapas e a assinatura do escritório" />
            {!user ? (
                <p className={ui.muted}>Carregando perfil…</p>
            ) : (
                <>
                    <ProfileInfo
                        user={{
                            nome: `${user.first_name} ${user.last_name}`.trim() || '—',
                            email: user.email || '—',
                            telefone: user.phone || '—',
                            oab: user.oab_number || '—',
                            foto: user.profile_picture || null,
                            iniciais: user.initials || '??',
                        }}
                        onSave={handleSave}
                        onPhotoChange={handlePhotoChange}
                    />
                    <ChangePassword onSave={(data) => console.log(data)} />
                    <MfaCard />
                    {currentPlan && (
                        <PlanCard
                            currentPlan={currentPlan}
                            otherPlans={otherPlans}
                            onManage={() => { }}
                        />
                    )}
                    {assinatura && (
                        <section aria-label="Assinatura e créditos" className={`${ui.card} ${ui.stack}`}>
                            <h2 className={ui.section_title}>Assinatura e créditos</h2>
                            <p>Estado: <strong>{{ trialing: 'Em teste', active: 'Ativa', past_due: 'Pagamento pendente', restricted: 'Restrita', suspended: 'Suspensa', canceled: 'Cancelada' }[assinatura.estado] || assinatura.estado}</strong></p>
                            <p>{creditsNotice(assinatura) || 'IA pausada: regularize a assinatura.'}</p>
                            {assinatura.estado === 'trialing' && isOrgManager && (
                                <div>
                                    <p>Assine para liberar os limites do seu plano:</p>
                                    {user?.organization?.cupom_pendente && (
                                        <p className={ui.muted}>Cupom <strong>{user.organization.cupom_pendente.codigo}</strong> ({user.organization.cupom_pendente.nome}) reservado no cadastro: entra sozinho no pagamento.</p>
                                    )}
                                    <label className={ui.field} style={{ maxWidth: 260 }}>Cupom (desconto ou dias extras)<input className={ui.input} value={promo} onChange={(e) => { setPromo(e.target.value.toUpperCase()); setPromoInfo({}); }} placeholder="CÓDIGO" /></label>
                                    <div className={ui.btn_row} style={{ marginTop: 8 }}>
                                        {[billing.plano, ...otherPlans].filter(p => p.price !== 'Grátis').map((p) => (
                                            <span key={p.id} className={ui.btn_row}>
                                                <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={() => subscribe(p.id)}>Assinar {p.name} — {p.price}/mês</button>
                                                {promo.trim() && <button type="button" className={ui.btn} onClick={() => checkPromo(p.id)}>Aplicar cupom</button>}
                                                {promoInfo[p.id]?.valid && promoInfo[p.id].kind !== 'trial' && <small style={{ display: 'block', color: 'var(--c-success)' }}>Com o cupom: R$ {Number(promoInfo[p.id].discounted).toLocaleString('pt-BR')} ({promoInfo[p.id].duration === 'once' ? 'na 1ª cobrança' : promoInfo[p.id].duration === 'forever' ? 'sempre' : `por ${promoInfo[p.id].duration_months} meses`})</small>}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            {isOrgManager && assinatura.ia_ativa && packs.length > 0 && (
                                <div className={ui.stack}>
                                    <p className={ui.muted}>Precisa de mais créditos? Valem 12 meses e são usados depois dos do plano.</p>
                                    <div className={ui.btn_row}>{packs.map((p) => (
                                        <button key={p.id} type="button" className={ui.btn} onClick={() => buyCredits(p.id)}>
                                            {p.credits.toLocaleString('pt-BR')} créditos — R$ {Number(p.price).toLocaleString('pt-BR')}
                                        </button>
                                    ))}</div>
                                </div>
                            )}
                        </section>
                    )}
                </>
            )}
        </div>
    );
}

export default Perfil;