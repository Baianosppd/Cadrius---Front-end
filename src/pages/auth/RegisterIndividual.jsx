import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RegisterIndividual.module.css';
import RegisterHeader from '../../components/common/RegisterHeader';
import RegisterSidebar from '../../components/common/RegisterSidebar';
import RegisterFooter from '../../components/common/RegisterFooter';
import { FiUser } from 'react-icons/fi';

import StepDadosPessoais from './steps/individual/StepDadosPessoais';
import StepPerfilProfissional from './steps/individual/StepPerfilProfissional';
import StepSelecaoPlano from './steps/individual/StepSelecaoPlano';
import StepPagamento from './steps/individual/StepPagamento';
import StepConfirmacao from './steps/individual/StepConfirmacao';

import api from '../../services/api.js';
import useAuth from '../../hooks/useAuth';
import useRegistrationDraft from '../../hooks/useRegistrationDraft';
import { individualPayload, validateStep, registrationError, startCheckout } from '../../services/registration';
import { toast } from 'react-toastify';

const steps = [
    { label: 'Dados Pessoais', sublabel: 'Informações básicas' },
    { label: 'Perfil Profissional', sublabel: 'OAB e área de atuação' },
    { label: 'Seleção de Plano', sublabel: 'Escolha seu plano' },
    { label: 'Pagamento', sublabel: 'Checkout seguro' },
    { label: 'Confirmação', sublabel: 'Tudo pronto!' },
];

const stepComponents = [
    StepDadosPessoais,
    StepPerfilProfissional,
    StepSelecaoPlano,
    StepPagamento,
    StepConfirmacao,
];

function RegisterIndividual() {
    const navigate = useNavigate();
    const { loginWithTokens } = useAuth();
    // Rascunho em sessionStorage (sem senha/CPF): recarregar a página não perde o que foi digitado.
    const { step: currentStep, setStep: setCurrentStep, formData, setFormData, restored, discard } =
        useRegistrationDraft('individual', { maxStep: 3 });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (restored) toast.info('Recuperamos o que você já tinha preenchido. Por segurança, digite novamente senha e CPF.');
    }, [restored]);

    // useCallback: o LegalAcceptance usa onChange em um efeito
    const updateForm = useCallback((data) => setFormData(prev => ({ ...prev, ...data })), []);

    // Cria a conta (o back já devolve access/refresh → o usuário entra logado)
    const submit = async () => {
        setBusy(true);
        try {
            const { data } = await api.post('auth/register/', individualPayload(formData));
            discard(); // conta criada: o rascunho não é mais necessário
            await loginWithTokens(data.access, data.refresh);
            return true;
        } catch (err) {
            console.error(err.response?.data);
            toast.error(registrationError(err));
            return false;
        } finally {
            setBusy(false);
        }
    };

    const handleNext = async () => {
        if (busy) return;
        const problem = validateStep('individual', currentStep, formData);
        if (problem) { toast.error(problem); return; }

        // Plano gratuito: cria a conta e vai direto à confirmação (pula o pagamento)
        if (currentStep === 3 && formData.planoGratis) {
            if (await submit()) setCurrentStep(5);
            return;
        }
        // Plano pago: cria a conta e abre o checkout do Stripe
        if (currentStep === 4) {
            if (!(await submit())) return;
            try {
                await startCheckout(formData.plano);
            } catch {
                toast.warn('Conta criada, mas não foi possível abrir o pagamento agora. Você pode assinar em Perfil → Plano.');
                setCurrentStep(5);
            }
            return;
        }
        if (currentStep === steps.length) {
            navigate('/dashboard');
            return;
        }
        setCurrentStep(p => p + 1);
    };

    const handlePrev = () => {
        if (currentStep === 5 && formData.planoGratis) {
            setCurrentStep(3);
            return;
        }
        if (currentStep > 1) setCurrentStep(p => p - 1);
    };

    const StepComponent = stepComponents[currentStep - 1];

    return (
        <div className={styles.container}>
            <RegisterHeader />
            <div className={styles.body}>
                <RegisterSidebar
                    title="Cadastro Individual"
                    subtitle="Crie sua conta Cadrius"
                    icon={FiUser}
                    steps={steps}
                    currentStep={currentStep}
                    tip="Complete seu cadastro em poucos minutos e comece a usar o Cadrius imediatamente."
                />
                <div className={styles.content}>
                    <StepComponent formData={formData} onChange={updateForm} />
                </div>
            </div>
            <RegisterFooter
                onPrev={handlePrev}
                onNext={handleNext}
                onCancel={() => { discard(); navigate('/criar-conta'); }}
                isFirst={currentStep === 1 || currentStep === steps.length}
                isLast={currentStep === steps.length}
            />
        </div>
    );
}

export default RegisterIndividual;