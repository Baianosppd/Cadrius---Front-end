import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

// Volta do checkout do Stripe (CAD-224): avisa o resultado e limpa a URL.
const MESSAGES = {
    payment: {
        success: ['success', 'Pagamento enviado. A assinatura é ativada assim que o Stripe confirmar (em geral, em segundos).'],
        cancelled: ['info', 'Pagamento cancelado. Nada foi cobrado.'],
    },
    credits: {
        success: ['success', 'Compra de créditos enviada. Eles aparecem assim que o Stripe confirmar.'],
        cancelled: ['info', 'Compra de créditos cancelada. Nada foi cobrado.'],
    },
};

export default function usePaymentReturn() {
    const { search, pathname } = useLocation();
    const navigate = useNavigate();
    useEffect(() => {
        const params = new URLSearchParams(search);
        let shown = false;
        Object.entries(MESSAGES).forEach(([key, map]) => {
            const hit = map[params.get(key)];
            if (hit) { toast[hit[0]](hit[1], { toastId: `${key}-${params.get(key)}` }); params.delete(key); shown = true; }
        });
        if (shown) navigate({ pathname, search: params.toString() }, { replace: true });
    }, [search, pathname, navigate]);
}
