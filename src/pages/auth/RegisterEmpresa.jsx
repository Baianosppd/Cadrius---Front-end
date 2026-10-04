import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RegisterIndividual.module.css'; // reutiliza o mesmo CSS
import RegisterHeader from '../../components/common/RegisterHeader';
import RegisterSidebar from '../../components/common/RegisterSidebar';
import RegisterFooter from '../../components/common/RegisterFooter';
import { FiGrid } from 'react-icons/fi';
import { toast } from 'react-toastify';
import api from '../../services/api.js';
import useAuth from '../../hooks/useAuth';
import useRegistrationDraft from '../../hooks/useRegistrationDraft';
import { companyPayload, validateStep, registrationError, startCheckout } from '../../services/registration';

import StepDadosBasicos from './steps/empresa/StepDadosBasicos';
import StepClassificacao from './steps/empresa/StepClassificacao';
import StepEndereco from './steps/empresa/StepEndereco';
import StepGerenteResponsavel from './steps/empresa/StepGerenteResponsavel';
import StepEquipeInicial from './steps/empresa/StepEquipeInicial';
import StepSelecaoPlanoEmpresa from './steps/empresa/StepSelecaoPlanoEmpresa';
import StepPagamentoEmpresa from './steps/empresa/StepPagamentoEmpresa';
import StepConfirmacaoEmpresa from './steps/empresa/StepConfirmacaoEmpresa';

const steps = [
    { label: 'Dados Básicos', sublabel: 'Razão social, CNPJ, tipo' },
    { label: 'Classificação', sublabel: 'Natureza, porte, regime' },
    { label: 'Endereço', sublabel: 'Localização e contato' },
    { label: 'Gerente Responsável', sublabel: 'Dados do responsável' },
    { label: 'Equipe Inicial', sublabel: 'Convide funcionários' },
    { label: 'Seleção de Plano', sublabel: 'Escolha seu plano' },
    { label: 'Pagamento', sublabel: 'Checkout seguro' },
    { label: 'Confirmação', sublabel: 'Tudo pronto!' },
];

const stepComponents = [
    StepDadosBasicos,
    StepClassificacao,
    StepEndereco,
    StepGerenteResponsavel,
    StepEquipeInicial,
    StepSelecaoPlanoEmpresa,
    StepPagamentoEmpresa,
    StepConfirmacaoEmpresa,
];

function RegisterEmpresa() {
    const navigate = useNavigate();
    const { loginWithTokens } = useAuth();
    // Rascunho em sessionStorage (sem senha/CPF): recarregar a página não perde o que foi digitado.
    const { step: currentStep, setStep: setCurrentStep, formData, setFormData, restored, discard } =
        useRegistrationDraft('empresa', { maxStep: 6 });
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (restored) toast.info('Recuperamos o que você já tinha preenchido. Por segurança, digite novamente senhas e CPF.');
    }, [restored]);

    const updateForm = useCallback((data) => setFormData(prev => ({ ...prev, ...data })), [setFormData]);

    const submit = async () => {
        setBusy(true);
        try {
            const { data } = await api.post('auth/register/empresa/', companyPayload(formData));
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
        const problem = validateStep('empresa', currentStep, formData);
        if (problem) { toast.error(problem); return; }

        if (currentStep === 6 && formData.planoGratis) {
            if (await submit()) setCurrentStep(8);
            return;
        }
        if (currentStep === 7) {
            if (!(await submit())) return;
            try {
                await startCheckout(formData.plano);
            } catch {
                toast.warn('Conta criada, mas não foi possível abrir o pagamento agora. Você pode assinar em Perfil → Plano.');
                setCurrentStep(8);
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
        if (currentStep === 8 && formData.planoGratis) {
            setCurrentStep(6);
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
                    title="Cadastro de Empresa"
                    subtitle="Preencha dados cadastrais"
                    icon={FiGrid}
                    steps={steps}
                    currentStep={currentStep}
                    tip="Campos marcados com Obrigatório são essenciais para o cadastro."
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

export default RegisterEmpresa;