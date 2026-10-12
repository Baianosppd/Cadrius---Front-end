import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiCheck, FiMessageCircle, FiMic, FiMicOff } from 'react-icons/fi';
import ui from '../ui/ui.module.css';
import { Banner, Button, Chip, Modal, Pill, Row, Textarea } from '../ui';
import { errorMessage } from '../../utils/format';
import { brainApi } from '../../services/brain';
import { markFaleSeen } from '../../services/onboarding';
import s from './FaleSobreProcesso.module.css';

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

    useEffect(() => { brainApi.discoveryTopics().then((r) => setTopics(r.temas)).catch(() => setTopics([])); markFaleSeen(); }, []);

    const toggle = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
    const submit = async (e) => {
        e.preventDefault();
        setBusy(true);
        try { setResult(await brainApi.discover(text, picked)); } catch (err) { toast.error(errorMessage(err)); } finally { setBusy(false); }
    };
    const openFlow = (regraId) => { onClose(); navigate(`/automacao?aba=regras&regra=${regraId}`); };
    const accept = async (sug, open) => {
        try {
            const r = await brainApi.acceptSuggestion(sug.id);
            setDone((d) => ({ ...d, [sug.id]: r.regra_id }));
            if (open) openFlow(r.regra_id); else toast.success('Regra criada (desligada).');
        } catch (err) { toast.error(errorMessage(err)); }
    };
    const skip = async (sug) => {
        try { await brainApi.dismissSuggestion(sug.id); setDone((d) => ({ ...d, [sug.id]: 'skip' })); } catch (err) { toast.error(errorMessage(err)); }
    };
    const title = <><FiMessageCircle aria-hidden="true" /> Fale sobre seu processo</>;

    // 1ª etapa: o formulário (o rodapé fica dentro do <form>, então o Enter e o botão enviam)
    if (!result) return (
        <Modal as="form" title={title} size="lg" onClose={onClose} busy={busy} closeOnOverlay={false} onSubmit={submit}
            footer={<>
                <Button onClick={onClose}>Fazer depois</Button>
                <Button type="submit" variant="primary" disabled={text.trim().length < 10 && !picked.length} loading={busy} loadingLabel="Pensando nas automações…">
                    Ver automações para mim</Button>
            </>}>
            <p className={s.lead}>Conte, do seu jeito, como é o dia a dia do escritório: o que toma tempo, o que você tem medo de
                esquecer e o que se repete toda semana. A IA indica as automações que mais ajudam. Nada liga sem você ver o fluxo e aprovar.</p>
            <div className={ui.field}>O que mais pesa hoje? (marque quantos quiser)
                <Row role="group" aria-label="Temas">
                    {topics.map((t) => <Chip key={t.id} active={picked.includes(t.id)} onClick={() => toggle(t.id)}>{t.label}</Chip>)}
                </Row>
            </div>
            <label className={ui.field} htmlFor="fale-texto">Como funciona o seu processo de trabalho?</label>
            <div className={s.area}>
                <Textarea id="fale-texto" rows={6} maxLength={4000} value={text}
                    onChange={(e) => setText(e.target.value)} placeholder="Escreva ou toque no microfone e fale." />
                {dict.supported && (
                    <button type="button" className={`${s.mic} ${dict.on ? s.mic_on : ''}`} onClick={dict.toggle}
                        aria-label={dict.on ? 'Parar o ditado' : 'Ditar por voz'} title={dict.on ? 'Parar o ditado' : 'Ditar por voz'}>
                        {dict.on ? <FiMicOff aria-hidden="true" /> : <FiMic aria-hidden="true" />}
                    </button>
                )}
            </div>
            <div className={s.examples}>{EXAMPLES}</div>
        </Modal>
    );

    // 2ª etapa: as automações sugeridas
    return (
        <Modal title={title} size="lg" onClose={onClose}
            footer={<>
                <Button onClick={() => setResult(null)}>Contar mais</Button>
                <Button variant="primary" className={ui.ml_auto} onClick={onClose}>Concluir</Button>
            </>}>
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
                                    <button type="button" className={ui.link_btn} onClick={() => openFlow(done[sug.id])}>Abrir o fluxo</button></>}</div>
                        ) : (
                            <Row>
                                <Button size="sm" variant="primary" onClick={() => accept(sug, true)}>Criar e ver o fluxo</Button>
                                <Button size="sm" onClick={() => accept(sug, false)}>Só criar</Button>
                                <Button size="sm" onClick={() => skip(sug)}>Agora não</Button>
                            </Row>
                        )}
                    </div>
                ))}
            </div>
        </Modal>
    );
}
