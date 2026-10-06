import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { FiCompass, FiX } from 'react-icons/fi';
import { markSeen, shouldShow } from '../../services/tour';
import styles from './ModuleTour.module.css';

// Tour da primeira visita (CAD-220): cartão no canto, sem bloquear a tela. Remonta a cada módulo (key = rota).
export default function ModuleTour() {
    const { pathname } = useLocation();
    const tour = shouldShow(pathname);
    return tour ? <TourCard key={tour.key} tour={tour} /> : null;
}

function TourCard({ tour }) {
    const [step, setStep] = useState(0);
    const [closed, setClosed] = useState(false);
    if (closed) return null;
    const finish = () => { markSeen(tour.key); setClosed(true); };
    const last = step === tour.steps.length - 1;
    return (
        <aside className={styles.card} role="dialog" aria-modal="false" aria-labelledby="tour-title">
            <div className={styles.head}>
                <span className={styles.icon} aria-hidden="true"><FiCompass /></span>
                <div className={styles.title_wrap}>
                    <span className={styles.kicker}>Primeira vez aqui</span>
                    <strong id="tour-title" className={styles.title}>{tour.title}</strong>
                </div>
                <button type="button" className={styles.close} onClick={finish} aria-label="Fechar tour"><FiX /></button>
            </div>
            <p className={styles.text} aria-live="polite">{tour.steps[step]}</p>
            <div className={styles.foot}>
                <span className={styles.dots} aria-label={`Passo ${step + 1} de ${tour.steps.length}`}>
                    {tour.steps.map((s, i) => <span key={s} className={`${styles.dot} ${i === step ? styles.dot_on : ''}`} />)}
                </span>
                {!last && <button type="button" className={styles.skip} onClick={finish}>Pular</button>}
                <button type="button" className={styles.next} onClick={() => (last ? finish() : setStep(step + 1))}>
                    {last ? 'Entendi' : 'Próximo'}
                </button>
            </div>
        </aside>
    );
}
