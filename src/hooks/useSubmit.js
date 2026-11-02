import { useState } from 'react';
import { toast } from 'react-toastify';
import { errorMessage } from '../utils/format';

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
