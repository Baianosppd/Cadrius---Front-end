import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCheckCircle, FiChevronRight, FiCircle, FiX } from 'react-icons/fi';
import { dismiss, isDismissed, loadSteps } from '../../services/onboarding';
import styles from './FirstSteps.module.css';
import useAuth from '../../hooks/useAuth';
import FaleSobreProcesso, { FaleSobreProcessoCta, wasSeen } from '../ia/FaleSobreProcesso';

// "Primeiros passos" do Painel (CAD-219): progresso visível + atalho para cada passo
export default function FirstSteps({ totalDocs }) {
    const [state, setState] = useState(null);
    const [hidden, setHidden] = useState(isDismissed);
    const [fale, setFale] = useState(false);
    const { isSolo, isOrgManager } = useAuth();
    useEffect(() => {
        if (hidden || totalDocs === undefined) return undefined;
        let live = true;
        loadSteps(totalDocs, isSolo).then((s) => {
            if (!live) return;
            setState(s);
            // Primeiro acesso (CAD-226): sem automação ligada, a entrevista abre uma vez sozinha para quem decide
            if (isOrgManager && !wasSeen() && !s.steps.find((x) => x.key === 'regra')?.done) setFale(true);
        });
        return () => { live = false; };
    }, [hidden, totalDocs, isSolo, isOrgManager]);
    const modal = fale && <FaleSobreProcesso onClose={() => setFale(false)} />;
    if (hidden || !state || state.done === state.total) return modal || null;
    return (
        <>
        {modal}
        <section className={styles.box} aria-labelledby="primeiros-passos">
            <div className={styles.head}>
                <div>
                    <h2 id="primeiros-passos" className={styles.title}>Primeiros passos no Cadrius</h2>
                    <p className={styles.sub}>{state.done} de {state.total} concluídos — termine para o escritório tirar o máximo do sistema.</p>
                </div>
                <button type="button" className={styles.close} onClick={() => { dismiss(); setHidden(true); }} aria-label="Dispensar primeiros passos"><FiX /></button>
            </div>
            {isOrgManager && <FaleSobreProcessoCta onOpen={() => setFale(true)} />}
            <div className={styles.bar} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={state.pct} aria-label="Progresso">
                <span style={{ width: `${state.pct}%` }} />
            </div>
            <ol className={styles.list}>
                {state.steps.map((s) => (
                    <li key={s.key}>
                        <Link to={s.to} className={`${styles.item} ${s.done ? styles.item_done : ''}`}>
                            {s.done ? <FiCheckCircle className={styles.ok} aria-label="feito" /> : <FiCircle className={styles.todo} aria-label="pendente" />}
                            <span>{s.label}</span>
                            {!s.done && <FiChevronRight className={styles.go} aria-hidden="true" />}
                        </Link>
                    </li>
                ))}
            </ol>
        </section>
        </>
    );
}
