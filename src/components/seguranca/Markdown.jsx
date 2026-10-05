import { Fragment } from 'react';

// Renderizador mínimo de Markdown (títulos, listas, tabelas, **negrito**) para os documentos legais.
// Gera elementos React (nunca HTML bruto), então o conteúdo vindo do servidor não executa scripts.
const inline = (text) =>
    text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : <Fragment key={i}>{part}</Fragment>);

const isTableRow = (l) => /^\s*\|.*\|\s*$/.test(l);
const isSeparator = (l) => /^\s*\|[\s:|-]+\|\s*$/.test(l);
const cells = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export default function Markdown({ text = '' }) {
    const lines = text.replace(/\r/g, '').split('\n');
    const out = [];
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        if (!line.trim()) { i += 1; continue; }

        const h = line.match(/^(#{1,4})\s+(.*)$/);
        if (h) {
            const size = { 1: '1.15rem', 2: '1rem', 3: '.95rem', 4: '.9rem' }[h[1].length];
            out.push(<div key={i} style={{ fontWeight: 700, fontSize: size, margin: '10px 0 4px' }}>{inline(h[2])}</div>);
            i += 1; continue;
        }
        if (isTableRow(line)) {
            const rows = [];
            while (i < lines.length && isTableRow(lines[i])) { if (!isSeparator(lines[i])) rows.push(cells(lines[i])); i += 1; }
            const [head, ...body] = rows;
            out.push(
                <table key={`t${i}`} style={{ borderCollapse: 'collapse', margin: '6px 0', width: '100%', fontSize: '.82rem' }}>
                    <thead><tr>{head.map((c, k) => <th key={k} style={{ textAlign: 'left', borderBottom: '1px solid var(--c-border-2)', padding: '4px 6px' }}>{inline(c)}</th>)}</tr></thead>
                    <tbody>{body.map((r, k) => <tr key={k}>{r.map((c, j) => <td key={j} style={{ borderBottom: '1px solid var(--c-surface-3)', padding: '4px 6px', verticalAlign: 'top' }}>{inline(c)}</td>)}</tr>)}</tbody>
                </table>,
            );
            continue;
        }
        if (/^\s*[-*]\s+/.test(line)) {
            const items = [];
            while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*]\s+/, '')); i += 1; }
            out.push(<ul key={`u${i}`} style={{ margin: '4px 0 4px 20px' }}>{items.map((t, k) => <li key={k}>{inline(t)}</li>)}</ul>);
            continue;
        }
        // parágrafo: junta linhas consecutivas
        const para = [];
        while (i < lines.length && lines[i].trim() && !/^(#{1,4})\s/.test(lines[i]) && !isTableRow(lines[i]) && !/^\s*[-*]\s+/.test(lines[i])) { para.push(lines[i]); i += 1; }
        out.push(<p key={`p${i}`} style={{ margin: '4px 0' }}>{inline(para.join(' '))}</p>);
    }
    return <>{out}</>;
}
