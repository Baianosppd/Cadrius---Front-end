import { Link } from 'react-router-dom';
import { parseBlocks, parseInline } from '../../services/assistant';

function Inline({ text }) {
    return parseInline(text).map((part, i) => {
        if (part.type === 'bold') return <strong key={i}>{part.text}</strong>;
        if (part.type === 'link') return <Link key={i} to={part.to}>{part.text}</Link>;
        return <span key={i}>{part.text}</span>;
    });
}

// Resposta da IA renderizada sem HTML cru (nada de innerHTML): só blocos e links internos do próprio sistema
export default function RichText({ text }) {
    return parseBlocks(text).map((b, i) => {
        if (b.type === 'heading') return <h4 key={i}><Inline text={b.text} /></h4>;
        if (b.type === 'list') {
            const Tag = b.ordered ? 'ol' : 'ul';
            return <Tag key={i}>{b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}</Tag>;
        }
        return <p key={i}><Inline text={b.text} /></p>;
    });
}
