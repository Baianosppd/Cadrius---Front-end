import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheck, FiMessageCircle, FiMic, FiMicOff } from 'react-icons/fi';
import ui from '../seguranca/seguranca.module.css';
import { Banner, Pill, errorMessage } from '../seguranca/ui';
import { brainApi } from '../../services/brain';
import s from './FaleSobreProcesso.module.css';

const SEEN_KEY = 'cadrius.fale.visto';
export function wasSeen() { try { return window.localStorage.getItem(SEEN_KEY) === '1'; } catch { return true; } }
export function markSeen() { try { window.localStorage.setItem(SEEN_KEY, '1'); } catch { /* sem armazenamento */ } }

const EXAMPLES = 'Ex.: "Trabalho com previdenciário, recebo muitas intimações por e-mail e perco tempo respondendo cliente que pergunta do processo. Toda sexta mando relatório aos clientes."';

// Ditado por voz (Chrome, Edge e Safari): mais confortável para quem prefere falar a digitar
function useDictation(onText) {
    const rec = useRef(null);
    const [on, setOn] = useState(false);
    const Speech = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
    useEffect(() => () => rec.current?.stop(), []);
    const toggle = () => {
        if (!Speech) return;
        if (on) { rec.current?.stop(); return; }
        const r = new Speech();
        r.lang = 'pt-BR'; r.continuous = true; r.interimResults = false;
        r.onresult = (e) => onText(Array.from(e.results).slice(e.resultIndex).map((x) => x[0].transcript).join(' '));
        r.onend = () => setOn(false);
        r.onerror = () => setOn(false);
        rec.current = r; r.start(); setOn(true);
    };
    return { supported: !!Speech, on, toggle };
}

// "Fale sobre seu processo" (CAD-226): o advogado conta como trabalha e a IA indica automações. Cada sugestão vira regra
// DESLIGADA, aberta direto no fluxo para simular e ligar.
export default function FaleSobreProcesso({ onClose }) {
    const navigate = useNavigate();
    const [topics, setTopics] = useState([]);
    const [picked, setPicked] = useState([]);
    const [text, setText] = useState('');
    const [busy, setBusy] = useState(false);
    const [result, setResult] = useState(null);
    const [done, setDone] = useState({});
    const dict = useDictation((t) => setText((v) => `${v}${v && !v.endsWith(' ') ? ' ' : ''}${t.trim()}`));

    useEffect(() => { brainApi.discoveryTopics().then((r) => setTopics(r.temas)).catch(() => setTopics([])); markSeen(); }, []);
    useEffect(() => {
        const esc = (e) => e.key === 'Escape' && onClose();
        window.addEventListener('keydown', esc);
        return () => window.removeEventListener('keydown', esc);
    }, [onClose]);

    const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { setResult(await brainApi.discover(text, picked)); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const accept = async (sug, open) => {
        try {
            const r = await brainApi.acceptSuggestion(sug.id);
            setDone((d) => ({ ...d, [sug.id]: r.regra_id }));
            if (open) { onClose(); navigate(`/automacao?aba=regras&regra=${r.regra_id}`); } else toast.success('Regra criada (desligada).');
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const skip = async (sug) => {
        try { await brainApi.dismissSuggestion(sug.id); setDone((d) => ({ ...d, [sug.id]: 'skip' })); } catch (err) { toast.error(errorMessage(err)); }
    };

    return (
        <div className={ui.overlay} role="dialog" aria-modal="true" aria-labelledby="fale-title">
            <div className={`${ui.modal} ${s.modal}`}>
                <div id="fale-title" className={ui.modal_title}><FiMessageCircle aria-hidden="true" /> Fale sobre seu processo</div>
                {!result ? (
                    <form onSubmit={submit}>
                        <p className={s.lead}>Conte, do seu jeito, como é o dia a dia do escritório: o que toma tempo, o que você tem medo de
                            esquecer e o que se repete toda semana. A IA indica as automações que mais ajudam. Nada liga sem você ver o fluxo e aprovar.</p>
                        <div className={ui.field}>O que mais pesa hoje? (marque quantos quiser)</div>
                        <div className={s.chips}>
                            {topics.map((t) => (
                                <button key={t.id} type="button" aria-pressed={picked.includes(t.id)}
                                    className={`${s.chip} ${picked.includes(t.id) ? s.chip_on : ''}`} onClick={() => toggle(t.id)}>{t.label}</button>
                            ))}
                        </div>
                        <label className={ui.field} htmlFor="fale-texto">Como funciona o seu processo de trabalho?</label>
                        <div className={s.area}>
                            <textarea id="fale-texto" className={ui.textarea} rows={6} maxLength={4000} value={text}
                                onChange={(e) => setText(e.target.value)} placeholder="Escreva ou toque no microfone e fale." />
                            {dict.supported && (
                                <button type="button" className={`${s.mic} ${dict.on ? s.mic_on : ''}`} onClick={dict.toggle}
                                    aria-label={dict.on ? 'Parar o ditado' : 'Ditar por voz'} title={dict.on ? 'Parar o ditado' : 'Ditar por voz'}>
                                    {dict.on ? <FiMicOff aria-hidden="true" /> : <FiMic aria-hidden="true" />}
                                </button>
                            )}
                        </div>
                        <div className={s.examples}>{EXAMPLES}</div>
                        <div className={ui.btn_row} style={{ justifyContent: 'flex-end', marginTop: 14 }}>
                            <button type="button" className={ui.btn} onClick={onClose}>Fazer depois</button>
                            <button type="submit" className={`${ui.btn} ${ui.btn_primary}`} disabled={busy || (text.trim().length < 10 && !picked.length)}>
                                {busy ? 'Pensando nas automações…' : 'Ver automações para mim'}</button>
                        </div>
                    </form>
                ) : (
                    <>
                        <p className={s.lead}>{result.origem === 'ia' ? 'A IA leu o que você contou e escolheu estas automações:'
                            : 'Pelos temas que você citou, estas automações costumam ajudar:'}</p>
                        {result.sugestoes.length === 0 && <Banner tone="info">Não achamos nada novo: o escritório já usa os modelos desses temas. Veja Automações → Regras.</Banner>}
                        <div className={s.list}>
                            {result.sugestoes.map((sug) => (
                                <div key={sug.id} className={`${s.sug} ${done[sug.id] ? s.sug_done : ''}`}>
                                    <strong>{sug.titulo}</strong>
                                    <p>{sug.motivo}</p>
                                    {done[sug.id] ? (
                                        <div>{done[sug.id] === 'skip' ? <Pill tone="gray">dispensada</Pill>
                                            : <><Pill tone="green"><FiCheck aria-hidden="true" /> regra criada</Pill>{' '}
                                                <button type="button" className={ui.link_btn} onClick={() => { onClose(); navigate(`/automacao?aba=regras&regra=${done[sug.id]}`); }}>Abrir o fluxo</button></>}</div>
                                    ) : (
                                        <div className={ui.btn_row}>
                                            <button type="button" className={`${ui.btn} ${ui.btn_primary} ${ui.btn_sm}`} onClick={() => accept(sug, true)}>Criar e ver o fluxo</button>
                                            <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => accept(sug, false)}>Só criar</button>
                                            <button type="button" className={`${ui.btn} ${ui.btn_sm}`} onClick={() => skip(sug)}>Agora não</button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <div className={ui.btn_row} style={{ justifyContent: 'space-between' }}>
                            <button type="button" className={ui.btn} onClick={() => setResult(null)}>Contar mais</button>
                            <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={onClose}>Concluir</button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// Cartão de entrada (Painel e Automações)
export function FaleSobreProcessoCta({ onOpen, compact }) {
    return (
        <div className={s.cta}>
            <div><strong>Fale sobre seu processo</strong>
                {!compact && <span>Conte como o escritório trabalha e a IA indica as automações que mais aliviam a sua rotina.</span>}</div>
            <button type="button" className={`${ui.btn} ${ui.btn_primary}`} onClick={onOpen}><FiMessageCircle aria-hidden="true" /> Começar</button>
        </div>
    );
}
