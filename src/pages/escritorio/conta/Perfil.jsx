import { useState, useEffect } from 'react';
import api from '../../../services/api.js';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';

import ProfileInfo from '../../../components/perfil/ProfileInfo.jsx';
import ProfileCover from '../../../components/perfil/ProfileCover.jsx';
import ChangePassword from '../../../components/perfil/ChangePassword.jsx';
import MfaCard from '../../../components/seguranca/MfaCard.jsx';
import EmailSignatureCard from '../../../components/email/EmailSignatureCard.jsx';
import PlanCard from '../../../components/perfil/PlanCard.jsx';
import ui from '../../../components/ui/ui.module.css';
import { Button, Field, Input, Loading, PageHeader, Row, Stack, Tabs } from '../../../components/ui';
import useAuth from '../../../hooks/useAuth';
import usePaymentReturn from '../../../hooks/usePaymentReturn';
import { getCurrentPlan, getCreditPacks, startCreditCheckout, creditsNotice, validatePromo, startSubscriptionCheckout, redeemPromo } from '../../../services/billing';

// CAD-227: o perfil tinha 7 blocos numa coluna só (2.700 px). Agora são 4 abas curtas.
const TABS = [{ id: 'dados', label: 'Meus dados' }, { id: 'seguranca', label: 'Senha e acesso' }, { id: 'emails', label: 'Assinatura de e-mail' }, { id: 'plano', label: 'Plano e créditos' }];
const ESTADO = { trialing: 'Em teste', active: 'Ativa', past_due: 'Pagamento pendente', restricted: 'Restrita', suspended: 'Suspensa', canceled: 'Cancelada' };

function Perfil() {
    usePaymentReturn();
    const [user, setUser] = useState(null);
    const [billing, setBilling] = useState(null);   // GET /api/billing/plans/current/ (plano REAL do escritório + assinatura)
    const [packs, setPacks] = useState([]);
    const [promo, setPromo] = useState('');
    const [promoInfo, setPromoInfo] = useState({});   // planId → prévia do desconto
    const { isOrgManager, refreshUser } = useAuth();
    const [params, setParams] = useSearchParams();
    const paid = ['payment', 'credits'].some((k) => params.get(k));
    const tab = TABS.some((t) => t.id === params.get('aba')) ? params.get('aba') : paid ? 'plano' : 'dados';
    const go = (k) => { const n = new URLSearchParams(params); n.set('aba', k); setParams(n, { replace: true }); };

    useEffect(() => {
        api.get('auth/user/')
            .then((response) => setUser(response.data))
            .catch((error) => console.error('Erro ao carregar perfil:', error));

        getCurrentPlan().then(setBilling).catch(() => setBilling(null));   // 403 = usuário sem escritório (equipe)
        getCreditPacks().then(setPacks).catch(() => setPacks([]));
    }, []);

    const buyCredits = async (packId) => {
        try { await startCreditCheckout(packId); }
        catch (err) { toast.error(err?.response?.data?.detail || 'Não foi possível iniciar o pagamento.'); }
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

    const checkPromo = async (planId) => {
        if (!promo.trim()) return;
        try {
            const r = await validatePromo(planId, promo.trim());
            setPromoInfo((p) => ({ ...p, [planId]: r }));
            if (!r.valid) toast.warn(r.detail);
            else if (r.kind === 'trial') await redeemTrial();
        } catch (err) { toast.error(err?.response?.data?.detail || 'Não foi possível validar o cupom.'); }
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
        } catch {
            toast.error('Erro ao salvar perfil. Tente novamente.');
        }
    };

    // CAD-230: foto e capa vão para um envio próprio; o perfil devolve um link que continua valendo ao recarregar
    const uploadImage = async (kind, file) => {
        try {
            const formData = new FormData();
            formData.append('arquivo', file);
            const response = await api.post(`auth/profile/imagem/${kind}/`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setUser(response.data);
            refreshUser?.().catch(() => {});
            toast.success(kind === 'foto' ? 'Foto atualizada.' : 'Capa atualizada.');
        } catch (err) {
            toast.error(err?.response?.data?.detail || 'Não foi possível enviar a imagem.');
        }
    };
    const removeImage = async (kind) => {
        try {
            const response = await api.delete(`auth/profile/imagem/${kind}/`);
            setUser(response.data);
            refreshUser?.().catch(() => {});
        } catch (err) { toast.error(err?.response?.data?.detail || 'Não foi possível remover.'); }
    };
    const saveCover = async (data) => {
        try {
            const response = await api.patch('auth/profile/', data);
            setUser(response.data);
            toast.success('Capa salva.');
        } catch { toast.error('Não foi possível salvar a capa.'); }
    };

    const assinatura = billing?.assinatura;
    const nextBilling = billing?.proxima_cobranca ? new Date(billing.proxima_cobranca).toLocaleDateString('pt-BR') : '—';
    const currentPlan = billing ? { ...billing.plano, billingDate: nextBilling } : null;
    const otherPlans = billing?.outros_planos || [];

    return (
        <div className={ui.page}>
            <PageHeader title="Meu perfil" />
            <Tabs tabs={TABS} value={tab} onChange={go} aria-label="Seções do perfil" />
            {!user ? <Loading /> : (
                <>
                    {tab === 'dados' && <ProfileCover user={user} onUpload={uploadImage} onRemove={removeImage} onSaveCover={saveCover} />}
                    {/* Campos vazios ficam vazios (antes vinham com "—", que era gravado ao salvar) */}
                    {tab === 'dados' && <ProfileInfo
                        key={user.id}
                        user={{
                            nome: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
                            email: user.email || '',
                            telefone: user.phone || '',
                            oab: user.oab_number || '',
                        }}
                        onSave={handleSave}
                    />}
                    {tab === 'seguranca' && <Stack><ChangePassword /><MfaCard /></Stack>}
                    {tab === 'emails' && <EmailSignatureCard />}
                    {tab === 'plano' && currentPlan && <PlanCard currentPlan={currentPlan} otherPlans={otherPlans} />}
                    {tab === 'plano' && assinatura && (
                        <Stack as="section" gap={3} aria-label="Assinatura e créditos" className={ui.card}>
                            <h2 className={`${ui.section_title} ${ui.mb_0}`}>Situação e créditos</h2>
                            <p className={`${ui.mt_0} ${ui.mb_0}`}>Estado: <strong>{ESTADO[assinatura.estado] || assinatura.estado}</strong></p>
                            <p className={`${ui.mt_0} ${ui.mb_0}`}>{creditsNotice(assinatura) || 'IA pausada: regularize a assinatura.'}</p>
                            {assinatura.estado === 'trialing' && isOrgManager && (
                                <Stack gap={3}>
                                    <p className={`${ui.mt_0} ${ui.mb_0}`}>Assine para liberar os limites do seu plano:</p>
                                    {user?.organization?.cupom_pendente && (
                                        <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Cupom <strong>{user.organization.cupom_pendente.codigo}</strong> ({user.organization.cupom_pendente.nome}) reservado no cadastro: entra sozinho no pagamento.</p>
                                    )}
                                    <Field label="Cupom (desconto ou dias extras)" className={ui.w_fit}>
                                        <Input value={promo} onChange={(e) => { setPromo(e.target.value.toUpperCase()); setPromoInfo({}); }} placeholder="CÓDIGO" />
                                    </Field>
                                    <Stack gap={2}>
                                        {[billing.plano, ...otherPlans].filter((p) => p.price !== 'Grátis').map((p) => (
                                            <Row key={p.id}>
                                                <Button variant="primary" onClick={() => subscribe(p.id)}>Assinar {p.name} — {p.price}/mês</Button>
                                                {promo.trim() && <Button onClick={() => checkPromo(p.id)}>Aplicar cupom</Button>}
                                                {promoInfo[p.id]?.valid && promoInfo[p.id].kind !== 'trial' && (
                                                    <small className={ui.text_success}>Com o cupom: R$ {Number(promoInfo[p.id].discounted).toLocaleString('pt-BR')} ({promoInfo[p.id].duration === 'once' ? 'na 1ª cobrança' : promoInfo[p.id].duration === 'forever' ? 'sempre' : `por ${promoInfo[p.id].duration_months} meses`})</small>
                                                )}
                                            </Row>
                                        ))}
                                    </Stack>
                                </Stack>
                            )}
                            {isOrgManager && assinatura.ia_ativa && packs.length > 0 && (
                                <Stack gap={2}>
                                    <p className={`${ui.muted} ${ui.mt_0} ${ui.mb_0}`}>Precisa de mais créditos? Valem 12 meses e são usados depois dos do plano.</p>
                                    <Row>{packs.map((p) => (
                                        <Button key={p.id} onClick={() => buyCredits(p.id)}>
                                            {p.credits.toLocaleString('pt-BR')} créditos — R$ {Number(p.price).toLocaleString('pt-BR')}
                                        </Button>
                                    ))}</Row>
                                </Stack>
                            )}
                        </Stack>
                    )}
                </>
            )}
        </div>
    );
}

export default Perfil;
