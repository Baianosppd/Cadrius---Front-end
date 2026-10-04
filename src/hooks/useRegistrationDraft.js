import { useEffect, useRef, useState } from 'react';
import { clearDraft, loadDraft, saveDraft, sanitizeDraft } from '../services/registrationDraft';

// Mantém {step, formData} do cadastro no sessionStorage e avisa antes de sair com dados não concluídos.
export default function useRegistrationDraft(kind, { maxStep }) {
    const [initial] = useState(() => loadDraft(kind, { maxStep }));
    const [step, setStep] = useState(initial?.step || 1);
    const [formData, setFormData] = useState(initial?.data || {});
    const [restored] = useState(Boolean(initial && Object.keys(initial.data).length));
    const finished = useRef(false);

    useEffect(() => {
        if (finished.current) return undefined;
        const t = setTimeout(() => saveDraft(kind, { step, data: formData }), 300);
        return () => clearTimeout(t);
    }, [kind, step, formData]);

    useEffect(() => {
        const warn = (e) => {
            if (finished.current || Object.keys(sanitizeDraft(formData)).length === 0) return;
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [formData]);

    // Chamado quando a conta é criada (ou o usuário cancela): apaga o rascunho e para de avisar.
    const discard = () => { finished.current = true; clearDraft(kind); };

    return { step, setStep, formData, setFormData, restored, discard };
}
