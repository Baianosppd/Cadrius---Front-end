import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../../components/seguranca/ui';

// Carrega dados com recarga manual (reload) e cancelamento ao desmontar
export default function useLoader(fn, deps = []) {
    const [state, setState] = useState({ data: null, error: null, loading: true });
    const [tick, setTick] = useState(0);
    const reload = useCallback(() => setTick((t) => t + 1), []);
    useEffect(() => {
        let alive = true;
        setState((s) => ({ ...s, loading: true }));
        fn()
            .then((data) => alive && setState({ data, error: null, loading: false }))
            .catch((e) => alive && setState({ data: null, error: errorMessage(e), loading: false }));
        return () => { alive = false; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tick, ...deps]);
    return { ...state, reload };
}
