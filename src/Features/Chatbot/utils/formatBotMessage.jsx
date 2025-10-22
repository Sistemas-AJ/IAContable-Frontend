import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeRaw from 'rehype-raw'; // <-- 1. IMPORTAR rehype-raw
import '../components/ChatMessages.css';

// --- 2. DEFINIR EXPRESIONES REGULARES ---
// Busca texto entre comillas simples que termine en una extensión de archivo
const excelRegex = /'[^']+\.(xlsx|xls)'/gi;
const pdfRegex = /'[^']+\.pdf'/gi;
const wordRegex = /'[^']+\.(docx|doc)'/gi;

// Función para aplicar el resaltado
function applyHighlight(text) {
  if (!text) return text;
  return text
    .replace(excelRegex, '<span class="highlight-excel">$&</span>')
    .replace(pdfRegex, '<span class="highlight-pdf">$&</span>')
    .replace(wordRegex, '<span class="highlight-word">$&</span>');
}

export function formatBotMessage(text) {
  if (!text) return null;

  // Normalizar saltos de línea
  let cleanText = text.replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
  cleanText = cleanText.replace(/\r\n|\r/g, '\n');

  // Detectar automáticamente bloques de tabla (mínimo dos filas con pipes)
  const lines = cleanText.split('\n');
  let elements = [];
  let i = 0;
  while (i < lines.length) {
    // Detectar inicio de bloque de tabla
    if (lines[i].includes('|')) {
      let tablaLines = [];
      // Mientras las siguientes líneas tengan pipes, es parte de la tabla
      while (i < lines.length && lines[i].includes('|')) {
        tablaLines.push(lines[i]);
        i++;
      }
      // Si hay al menos dos filas, renderizar como tabla
      if (tablaLines.length >= 2) {
        // ... (lógica de la tabla sin cambios) ...
        const tablaData = tablaLines.map(row =>
          row
            .split('|')
            .map(cell => cell.trim().replace(/-+/g, '').replace(/\*\*/g, '').trim()) // Elimina '**' de cada celda
            .filter(cell => cell.length > 0)
        );
        elements.push(
          <div key={`table-card-${i}`} className="bot-table-card">
            <table className="bot-table">
              <thead>
                <tr>
                  {tablaData[0].map((cell, j) => (
                    <th key={`header-cell-${j}`}>{cell}</th>
                  ))}
                </tr>
              </thead>
              {tablaData.length > 1 && (
                <tbody>
                  {tablaData.slice(1).map((cols, k) => (
                    <tr key={`body-row-${k}`}>
                      {cols.map((cell, l) => (
                        <td key={`body-cell-${k}-${l}`}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              )}
            </table>
          </div>
        );
        continue;
      } else {
        // Si solo es una línea con pipes, mostrar como texto normal
        // --- 3. APLICAR RESALTADO AQUÍ ---
        let blockText = applyHighlight(tablaLines.join('\n'));
        elements.push(
          <ReactMarkdown 
            key={`md-${i}`} 
            remarkPlugins={[remarkMath]} 
            rehypePlugins={[rehypeKatex, rehypeRaw]} // <-- 4. AÑADIR rehypeRaw
          >
            {blockText}
          </ReactMarkdown>
        );
        continue;
      }
    }
    
    // Si no es tabla, mostrar como Markdown normal
    let block = lines[i];
    if (block.trim().length > 0) {
      // --- 5. APLICAR RESALTADO AQUÍ TAMBIÉN ---
      block = applyHighlight(block);
      elements.push(
        <ReactMarkdown 
          key={`md-block-${i}`} 
          remarkPlugins={[remarkMath]} 
          rehypePlugins={[rehypeKatex, rehypeRaw]} // <-- 6. AÑADIR rehypeRaw
        >
          {block}
        </ReactMarkdown>
      );
    }
    i++;
  }

  if (elements.length > 0) {
    return <>{elements}</>;
  }

  // --- El resto de tu código (correcciones de LaTeX) parece no alcanzarse
  //     debido a la lógica del bucle 'while' que siempre retorna 'elements'.
  //     Si ese código es necesario, la estructura de esta función debe revisarse.

  // ... (código de correcciones LaTeX sin cambios) ...

  // --- ... (código de correcciones LaTeX sin cambios) ...

  // --- !!! NUEVA CORRECCIÓN IMPORTANTE !!! ---
  // ... (código de correcciones LaTeX sin cambios) ...
  // --- FIN DE NUEVA CORRECCIÓN ---

  // --- 7. APLICAR RESALTADO Y REHYPE-RAW AL 'FALLBACK' FINAL ---
  cleanText = applyHighlight(cleanText);

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex, rehypeRaw]} // <-- 8. AÑADIR rehypeRaw
    >
      {cleanText}
    </ReactMarkdown>
  );
}

// La función renderHtmlOrLines se mantiene igual
export function renderHtmlOrLines(text, keyBase) {
  // ... (sin cambios) ...
}