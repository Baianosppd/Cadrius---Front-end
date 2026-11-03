import { Fragment } from 'react';
import s from './Markdown.module.css';

// Renderizador mínimo de Markdown (títulos, listas, tabelas, **negrito**, links https e e-mails) para os documentos legais.
// Gera elementos React (nunca HTML bruto), então o conteúdo vindo do servidor não executa scripts.
const LINK = /(https:\/\/[^\s)]+[^\s).,;]|[\w.+-]+@[\w-]+\.[\w.-]*\w)/g;
const links = (text, key) => text.split(LINK).map((part, i) => {
    if (i % 2 === 0) return <Fragment key={`${key}-${i}`}>{part}</Fragment>;
    const href = part.startsWith('https://') ? part : `mailto:${part}`;
    return <a key={`${key}-${i}`} href={href} target={href.startsWith('https') ? '_blank' : undefined} rel="noopener noreferrer">{part}</a>;
});
const inline = (text) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{links(part.slice(2, -2), i)}</strong> : <Fragment key={i}>{links(part, i)}</Fragment>);

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

// semantic: títulos como <h2>…<h5> (página pública); sem ele, <div> estilizado (dentro de modais e cartões).
export default function Markdown({ text = '', semantic = false }) {
    const lines = text.replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i += 1; continue; }

        const h = line.match(/^(#{1,4})\s+(.*)$/);
        if (h) {
            const Tag = semantic ? `h${h[1].length + 1}` : 'div';
            out.push(<Tag key={i} className={s[`h${h[1].length}`]}>{inline(h[2])}</Tag>);
            i += 1; continue;
        }
        if (isTableRow(line)) {
            const rows = [];
            while (i < lines.length && isTableRow(lines[i])) { if (!isSeparator(lines[i])) rows.push(cells(lines[i])); i += 1; }
            const [head, ...body] = rows;
            out.push(
                <div key={`t${i}`} className={s.table_wrap}><table className={s.table}>
                    <thead><tr>{head.map((c, k) => <th key={k}>{inline(c)}</th>)}</tr></thead>
                    <tbody>{body.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j}>{inline(c)}</td>)}</tr>)}</tbody>
                </table></div>,
            );
            continue;
        }
        if (/^\s*[-*]\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i += 1; }
            out.push(<ul key={`u${i}`} className={s.ul}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
            continue;
        }
        // parágrafo: junta linhas consecutivas
        const para = [];
        while (i < lines.length && lines[i].trim() && !/^(#{1,4})\s/.test(lines[i]) && !isTableRow(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) { para.push(lines[i]); i += 1; }
        out.push(<p key={`p${i}`} className={s.p}>{inline(para.join(' '))}</p>);
    }
    return <>{out}</>;
}
