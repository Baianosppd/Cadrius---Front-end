import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import { useNavigate } from 'react-router-dom';
import styles from './Perfil.module.css';

import ProfileInfo from '../../components/ui/ProfileInfo.jsx';
import ChangePassword from '../../components/ui/ChangePassword.jsx';
import PlanCard from '../../components/ui/Cards/PlanCard.jsx';
import { toast } from 'react-toastify';
import useAuth from '../../hooks/useAuth';
import { getCurrentPlan, getCreditPacks, startCreditCheckout, creditsNotice } from '../../services/billing';
import { startCheckout } from '../../services/registration';

function Perfil() {
    const [user, setUser] = useState(null);
    const [billing, setBilling] = useState(null);   // GET /api/billing/plans/current/ (plano REAL do escritório + assinatura)
    const [packs, setPacks] = useState([]);
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

    const subscribe = async (planId) => {
        try { await startCheckout(planId); }
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
            {!user ? (
                <p style={{ padding: 32, color: '#6b7280' }}>Carregando perfil...</p>
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
                    {currentPlan && (
                        <PlanCard
                            currentPlan={currentPlan}
                            otherPlans={otherPlans}
                            onManage={() => { }}
                        />
                    )}
                    {assinatura && (
                        <section aria-label="Assinatura e créditos" style={{ marginTop: 24, padding: 20, border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff' }}>
                            <h2 style={{ marginTop: 0 }}>Assinatura e créditos</h2>
                            <p>Estado: <strong>{{ trialing: 'Em teste', active: 'Ativa', past_due: 'Pagamento pendente', restricted: 'Restrita', suspended: 'Suspensa', canceled: 'Cancelada' }[assinatura.estado] || assinatura.estado}</strong></p>
                            <p>{creditsNotice(assinatura) || 'IA pausada: regularize a assinatura.'}</p>
                            {assinatura.estado === 'trialing' && isOrgManager && (
                                <div>
                                    <p>Assine para liberar os limites do seu plano:</p>
                                    {[billing.plano, ...otherPlans].filter(p => p.price !== 'Grátis').map((p) => (
                                        <button key={p.id} type="button" onClick={() => subscribe(p.id)} style={{ marginRight: 8 }}>
                                            Assinar {p.name} — {p.price}/mês
                                        </button>
                                    ))}
                                </div>
                            )}
                            {isOrgManager && assinatura.ia_ativa && packs.length > 0 && (
                                <div style={{ marginTop: 12 }}>
                                    <p>Precisa de mais créditos? (valem 12 meses e são usados depois dos do plano)</p>
                                    {packs.map((p) => (
                                        <button key={p.id} type="button" onClick={() => buyCredits(p.id)} style={{ marginRight: 8 }}>
                                            {p.credits.toLocaleString('pt-BR')} créditos — R$ {Number(p.price).toLocaleString('pt-BR')}
                                        </button>
                                    ))}
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