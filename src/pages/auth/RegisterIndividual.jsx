import { useState } from 'react';
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
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({});

    const updateForm = (data) => setFormData(prev => ({ ...prev, ...data }));

    const handleNext = () => {
        if (currentStep === 3 && formData.plano === 'starter') {
            setCurrentStep(5);
            return;
        }
        if (currentStep < steps.length) {
            setCurrentStep(p => p + 1);
        } else {
            navigate('/dashboard');
        }
    };

    const handlePrev = () => {
        if (currentStep === 5 && formData.plano === 'starter') {
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
                onCancel={() => navigate('/criar-conta')}
                isFirst={currentStep === 1}
                isLast={currentStep === steps.length}
            />
        </div>
    );
}

export default RegisterIndividual;