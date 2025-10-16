// Función para formatear el mensaje del bot respetando saltos de línea, renderizando fórmulas y estructurando títulos/subtítulos en HTML de forma dinámica
import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';

export function formatBotMessage(text, isFinancialAnalysis = false) {
  if (!text) return null;
  // Eliminar todos los asteriscos '*' (Markdown bold/italic) y símbolos '#'
  let cleanText = text.replace(/\*/g, '').replace(/\#/g, '');
  if (isFinancialAnalysis) {
    // Procesar cada línea para detectar títulos, subtítulos y negritas, y agrupar líneas con '-' como listas
    const lines = cleanText.split(/\r?\n/);
    let htmlLines = [];
    let inList = false;
    for (let idx = 0; idx < lines.length; idx++) {
      const line = lines[idx];
      // Título principal: primera línea no vacía y no guion
      if (idx === 0 && line.trim() && !line.trim().startsWith('-')) {
        htmlLines.push(`<h1>${line.trim()}</h1>`);
        continue;
      }
      // Subtítulo: línea sola, no guion, no vacía, y anterior línea vacía
      if (
        line.trim() &&
        !line.trim().startsWith('-') &&
        (idx === 0 || lines[idx - 1].trim() === '')
      ) {
        if (idx !== 0) htmlLines.push(`<h2>${line.trim()}</h2>`);
        continue;
      }
      // Elementos de lista: líneas que empiezan con '-'
      if (line.trim().startsWith('-')) {
        // Abrir lista si no está abierta
        if (!inList) {
          htmlLines.push('<ul>');
          inList = true;
        }
        // Negrita para nombres de cuentas: - Nombre:
        const boldMatch = line.match(/^-\s*([\w\sÁÉÍÓÚáéíóúÑñ]+):/);
        if (boldMatch) {
          htmlLines.push(`<li><strong>${boldMatch[1]}:</strong>${line.replace(/^-\s*[\w\sÁÉÍÓÚáéíóúÑñ]+:/, '')}</li>`);
        } else {
          htmlLines.push(`<li>${line.replace(/^-\s*/, '')}</li>`);
        }
        // Si es la última línea o la siguiente no es lista, cerrar la lista
        if (idx === lines.length - 1 || !lines[idx + 1].trim().startsWith('-')) {
          htmlLines.push('</ul>');
          inList = false;
        }
        continue;
      }
      // Si no, devolver la línea tal cual
      htmlLines.push(line);
    }
    cleanText = htmlLines.join('\n');
  }
  // Procesar bloques LaTeX ($$...$$)
  const blockRegex = /\$\$(.+?)\$\$/gs;
  const inlineRegex = /\$(.+?)\$/g;
  let elements = [];
  let lastIndex = 0;
  let match;
  let key = 0;

  // Procesar bloques $$...$$
  while ((match = blockRegex.exec(cleanText)) !== null) {
    if (match.index > lastIndex) {
      const before = cleanText.slice(lastIndex, match.index);
      elements.push(renderHtmlOrLines(before, key));
      key += 1000;
    }
    elements.push(<BlockMath key={key++}>{match[1]}</BlockMath>);
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < cleanText.length) {
    const rest = cleanText.slice(lastIndex);
    let lastInline = 0;
    let inlineMatch;
    while ((inlineMatch = inlineRegex.exec(rest)) !== null) {
      if (inlineMatch.index > lastInline) {
        const before = rest.slice(lastInline, inlineMatch.index);
        elements.push(renderHtmlOrLines(before, key));
        key += 1000;
      }
      elements.push(<InlineMath key={key++}>{inlineMatch[1]}</InlineMath>);
      lastInline = inlineMatch.index + inlineMatch[0].length;
    }
    if (lastInline < rest.length) {
      const after = rest.slice(lastInline);
      elements.push(renderHtmlOrLines(after, key));
    }
  }
  return elements;
}

// Renderiza HTML si contiene etiquetas, si no, renderiza líneas con <br />
export function renderHtmlOrLines(text, keyBase) {
  if (/<h1>|<h2>|<strong>/.test(text)) {
    return <span key={keyBase} dangerouslySetInnerHTML={{ __html: text }} />;
  }
  // Si no hay HTML, renderiza líneas normales
  return text.split('\n').map((line, idx, arr) => (
    <React.Fragment key={keyBase + idx}>
      {line}
      {idx !== arr.length - 1 && <br />}
    </React.Fragment>
  ));
}
