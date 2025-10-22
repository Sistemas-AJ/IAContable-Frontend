import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function formatBotMessage(text) {
  if (!text) return null;

  // Normalizar saltos de línea
  let cleanText = text.replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
  cleanText = cleanText.replace(/\r\n|\r/g, '\n');

  // Separar por bloques de título + tabla
  // Detectar títulos tipo "Ratios para el periodo:" y separar cada bloque
  const bloqueRegex = /(Ratios para el periodo:[^\n]*\n(?:[^|\n]*\n)*((?:[^\n]*\|[^\n]*\n)+))/g;
  let elements = [];
  let lastIndex = 0;
  let match;
  while ((match = bloqueRegex.exec(cleanText)) !== null) {
    // Texto antes del bloque (si existe)
    if (match.index > lastIndex) {
      const before = cleanText.slice(lastIndex, match.index).trim();
      if (before) {
        elements.push(
          <ReactMarkdown key={`beforeBlock-${lastIndex}`} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{before}</ReactMarkdown>
        );
      }
    }
    // Bloque de título + tabla
    const bloque = match[0];
    // Separar título y tabla
    const lines = bloque.split('\n');
    const titulo = lines[0];
    const tablaLines = lines.slice(1).filter(line => line.includes('|'));
    const tablaData = tablaLines.map(row =>
      row.split('|')
        .map(cell => cell.trim().replace(/-+/g, '').trim())
        .filter(cell => cell.length > 0)
    );
    elements.push(
      <div key={`table-card-${match.index}`} style={{
        background: '#f8fafc',
        border: '1px solid #e0e7ef',
        borderRadius: '14px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
        padding: '18px 22px',
        margin: '32px 0',
        overflowX: 'auto',
        maxWidth: '680px',
      }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.08em', marginBottom: 12, color: '#1e293b' }}>{titulo}</div>
        <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', fontSize: '0.97em', borderRadius: '8px', overflow: 'hidden' }}>
          <tbody>
            {tablaData.map((cols, i) => (
              <tr key={i}>
                {cols.map((cell, j) => (
                  <td
                    key={j}
                    style={{
                      border: '1px solid #d1d5db',
                      padding: '10px 12px',
                      fontWeight: i === 0 ? 'bold' : 'normal',
                      background: i === 0 ? '#f1f5f9' : 'inherit',
                      textAlign: 'left',
                      fontSize: i === 0 ? '1em' : '0.98em',
                    }}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
    lastIndex = bloqueRegex.lastIndex;
  }
  // Texto después del último bloque
  if (lastIndex < cleanText.length) {
    const after = cleanText.slice(lastIndex).trim();
    if (after) {
      elements.push(
        <ReactMarkdown key={`afterBlock-${lastIndex}`} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{after}</ReactMarkdown>
      );
    }
  }

  if (elements.length > 0) {
    return <>{elements}</>;
  }

  // --- INICIO DE CORRECCIONES DE LATEX ---
  cleanText = cleanText.replace(/\f(rac)/g, '\\$1');
  cleanText = cleanText.replace(/\t(ext)/g, '\\$1');
  cleanText = cleanText.replace(/\\ext/g, '\\text');
  cleanText = cleanText.replace(/\\rac/g, '\\frac');
  cleanText = cleanText.replace(/\\text\[(.*?)\]/g, '\\text{$1}');
  cleanText = cleanText.replace(/\\frac\[(.*?)\]\[(.*?)\]/g, '\\frac{$1}{$2}');
  cleanText = cleanText.replace(/rac\[(.*?)\]\[(.*?)\]/g, '\\frac{$1}{$2}');
  // --- FIN DE CORRECCIONES ---

  // --- !!! NUEVA CORRECCIÓN IMPORTANTE !!! ---
  cleanText = cleanText.replace(/\[(.+?)\]/gs, (match, content) => {
    if (content.includes('\\')) {
      return `$$${content.trim()}$$`;
    }
    return match;
  });
  // --- FIN DE NUEVA CORRECCIÓN ---

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
    >
      {cleanText}
    </ReactMarkdown>
  );
}

// La función renderHtmlOrLines se mantiene igual (no la estamos usando aquí)
export function renderHtmlOrLines(text, keyBase) {
  if (/<h1>|<h2>|<strong>/.test(text)) {
    return <span key={keyBase} dangerouslySetInnerHTML={{ __html: text }} />;
  }
  return text.split('\n').map((line, idx, arr) => (
    <React.Fragment key={keyBase + idx}>
      {line}
      {idx !== arr.length - 1 && <br />}
    </React.Fragment>
  ));
}