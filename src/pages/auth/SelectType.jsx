import { useNavigate } from 'react-router-dom';
import { FiArrowRight, FiCalendar, FiLock, FiShield } from 'react-icons/fi';
import styles from './SelectType.module.css';
import RegisterHeader from '../../components/common/RegisterHeader';
import BackButton from '../../components/common/BackButton';
import { CourthouseScene, LawFirmTeam, LawyerDesk } from '../../components/illustrations/LegalArt';

// Escolha do tipo de conta (CAD-219): cenas do dia a dia jurídico para o advogado se reconhecer logo na entrada
const TypeCard = ({ art, title, description, features, cta, onClick }) => {
    const Art = art;
    return (
    <button type="button" className={styles.card} onClick={onClick}>
        <Art className={styles.card_art} />
        <span className={styles.card_title}>{title}</span>
        <span className={styles.card_description}>{description}</span>
        <ul className={styles.features}>
            {features.map((f) => (
                <li key={f} className={styles.feature_item}><span className={styles.feature_dot} />{f}</li>
            ))}
        </ul>
        <span className={styles.card_cta}>{cta} <FiArrowRight aria-hidden="true" /></span>
    </button>
    );
};

const TRUST = [
    { icon: FiCalendar, text: 'Prazos em dias úteis com feriados forenses e recesso' },
    { icon: FiShield, text: 'Marketing dentro do Provimento 205/2021 da OAB' },
    { icon: FiLock, text: 'Dados de clientes cifrados e trilha de auditoria (LGPD)' },
];

function SelectType() {
    const navigate = useNavigate();
    return (
        <div className={styles.container}>
            <RegisterHeader />
            <div className={styles.content}>
                <div className={styles.back_wrapper}>
                    <BackButton label="Voltar para Login" to="/" />
                </div>
                <section className={styles.hero}>
                    <div className={styles.hero_text}>
                        <span className={styles.kicker}>Feito para a advocacia brasileira</span>
                        <h1 className={styles.title}>Bem-vindo ao Cadrius</h1>
                        <p className={styles.subtitle}>Publicações, prazos, documentos e clientes em um só lugar — com a IA trabalhando
                            para o escritório e você sempre no controle.</p>
                    </div>
                    <CourthouseScene className={styles.hero_art} />
                </section>

                <h2 className={styles.question}>Como você vai usar o Cadrius?</h2>
                <div className={styles.cards}>
                    <TypeCard art={LawyerDesk} title="Advogado autônomo" cta="Criar minha conta"
                        description="Para quem advoga por conta própria e quer menos tempo com rotina e mais tempo com o cliente."
                        features={['Conta individual', 'Publicações e prazos da sua OAB', 'Leitura de documentos com IA']}
                        onClick={() => navigate('/cadastro/individual')} />
                    <TypeCard art={LawFirmTeam} title="Escritório / sociedade" cta="Cadastrar o escritório"
                        description="Para escritórios com equipe: carteira de clientes, financeiro e permissões por pessoa."
                        features={['Vários advogados e colaboradores', 'Perfis de acesso e auditoria', 'Funil, honorários e portal do cliente']}
                        onClick={() => navigate('/cadastro/empresa')} />
                </div>

                <ul className={styles.trust}>
                    {TRUST.map((t) => { const Icon = t.icon; return <li key={t.text}><Icon aria-hidden="true" />{t.text}</li>; })}
                </ul>
            </div>
        </div>
    );
}

export default SelectType;
