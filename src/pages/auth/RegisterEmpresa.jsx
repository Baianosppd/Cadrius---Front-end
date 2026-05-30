import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './RegisterIndividual.module.css'; // reutiliza o mesmo CSS
import RegisterHeader from '../../components/common/RegisterHeader';
import RegisterSidebar from '../../components/common/RegisterSidebar';
import RegisterFooter from '../../components/common/RegisterFooter';
import { FiGrid } from 'react-icons/fi';

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
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState({});

    const updateForm = (data) => setFormData(prev => ({ ...prev, ...data }));

    const handleNext = () => {
        if (currentStep === 6 && formData.plano === 'starter') {
            setCurrentStep(8);
            return;
        }
        if (currentStep < steps.length) {
            setCurrentStep(p => p + 1);
        } else {
            navigate('/dashboard');
        }
    };

    const handlePrev = () => {
        if (currentStep === 8 && formData.plano === 'starter') {
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
                onCancel={() => navigate('/criar-conta')}
                isFirst={currentStep === 1}
                isLast={currentStep === steps.length}
            />
        </div>
    );
}

export default RegisterEmpresa;