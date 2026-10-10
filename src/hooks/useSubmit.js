import { useState } from 'react';
import { toast } from 'react-toastify';
import { errorMessage } from '../utils/format';

// Envia um formulário controlando carregamento e erro → { busy, error, falha, submit }.
// "error" é a mensagem pronta para a tela; "falha" é o erro original (para checar códigos da API).
// Opções: onDone(resposta) após sucesso; ok = texto do toast de sucesso.
export default function useSubmit(fn, { onDone, ok } = {}) {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [falha, setFalha] = useState(null);
    const submit = async (e) => {
        e?.preventDefault();
        setBusy(true); setError(''); setFalha(null);
        try { const r = await fn(); if (ok) toast.success(ok); onDone?.(r); }
        catch (err) { setError(errorMessage(err)); setFalha(err); }
        finally { setBusy(false); }
    };
    return { busy, error, falha, submit };
}
