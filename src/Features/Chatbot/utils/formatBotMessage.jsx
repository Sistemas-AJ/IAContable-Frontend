import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export function formatBotMessage(text) {
  if (!text) return null;

  // Normalizar saltos de línea
  let cleanText = text.replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
  cleanText = cleanText.replace(/\r\n|\r/g, '\n');

  // Dividir el texto en bloques por '###'
  const blocks = cleanText.split(/\n###/);
  let elements = [];
  blocks.forEach((block, idx) => {
    // Detectar líneas de tabla (con '|')
    const lines = block.split('\n');
    const tableLines = lines.filter(line => line.includes('|'));
    const isTable = tableLines.length > 2;

    if (isTable) {
      // Encontrar el bloque de la tabla (primer y último índice)
      const firstIdx = lines.findIndex(line => line.includes('|'));
      const lastIdx = lines.length - 1 - [...lines].reverse().findIndex(line => line.includes('|'));

      // Partes antes y después de la tabla
      const beforeTable = lines.slice(0, firstIdx).join('\n');
      const afterTable = lines.slice(lastIdx + 1).join('\n');

      // Procesar tabla: separar filas y columnas y limpiar * y ---
      const tableRows = lines.slice(firstIdx, lastIdx + 1);
      const tableData = tableRows.map(row =>
        row.split('|')
          .map(cell => cell.trim().replace(/\*+/g, '').replace(/-+/g, '').trim())
          .filter(cell => cell.length > 0)
      );

      if (beforeTable) {
        elements.push(
          <ReactMarkdown key={`beforeTable-${idx}`} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{beforeTable}</ReactMarkdown>
        );
      }
      elements.push(
        <div key={`table-${idx}`} style={{ overflowX: 'auto', margin: '1em 0' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%', background: '#fff', fontSize: '0.95em' }}>
            <tbody>
              {tableData.map((cols, i) => (
                <tr key={i}>
                  {cols.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        border: '1px solid #ccc',
                        padding: '8px',
                        fontWeight: i === 0 ? 'bold' : 'normal',
                        background: i === 0 ? '#f5f5f5' : 'inherit',
                        textAlign: 'left',
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
      if (afterTable) {
        elements.push(
          <ReactMarkdown key={`afterTable-${idx}`} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{afterTable}</ReactMarkdown>
        );
      }
    } else {
      // Si no es tabla, renderizar como Markdown normal
      if (block.trim()) {
        elements.push(
          <ReactMarkdown key={`md-${idx}`} remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>{block}</ReactMarkdown>
        );
      }
    }
  });

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