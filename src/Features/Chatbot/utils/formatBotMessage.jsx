  // Función para formatear el mensaje del bot respetando saltos de línea, renderizando fórmulas y estructurando títulos/subtítulos en HTML de forma dinámica
import React from 'react';
import { BlockMath, InlineMath } from 'react-katex';


export function formatBotMessage(text) {
  if (!text) return null;

  // Normalizar saltos de línea y limpiar HTML básico
  let cleanText = text.replace(/<br\s*\/?>(\r?\n)?/gi, '\n');
  cleanText = cleanText.replace(/\r\n|\r/g, '\n');
  // Eliminar todos los asteriscos '*'
  cleanText = cleanText.replace(/\*/g, '');

  // Transformar bloques \[ ... \] a $$ ... $$ para KaTeX
  cleanText = cleanText.replace(/\\\[(.+?)\\\]/gs, (_, formula) => `$$${formula.trim()}$$`);

  // Detectar y formatear títulos y subtítulos (líneas que empiezan con número, doble asterisco, o mayúsculas)
  const lines = cleanText.split('\n');
  let elements = [];
  let key = 0;
  let inList = false;
  let listBuffer = [];

  const pushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={key++}>
          {listBuffer.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      );
      listBuffer = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) {
      pushList();
      // No insertar <br /> para líneas vacías
      continue;
    }

    // Títulos: **TEXTO:** o 1. TEXTO o TODO MAYÚSCULAS o **TEXTO**
    if (/^(\d+\.|\*\*|[A-ZÁÉÍÓÚÑ\s]{8,})/.test(line)) {
      pushList();
      // Quitar asteriscos y dos puntos
      let title = line.replace(/^\*\*|\*\*$/g, '').replace(/:$/, '');
      // Si es muy largo y mayúsculas, h2, si no h3
      if (/^[A-ZÁÉÍÓÚÑ\s]{8,}$/.test(title)) {
        elements.push(<h2 key={key++}>{title}</h2>);
      } else {
        elements.push(<h3 key={key++}>{title}</h3>);
      }
      continue;
    }

    // Listas: - item, * item
    if (/^(-|\*)\s+/.test(line)) {
      listBuffer.push(line.replace(/^(-|\*)\s+/, ''));
      continue;
    }

    // Fórmulas LaTeX en bloque $$...$$
    const blockMath = line.match(/^\$\$(.+)\$\$$/s);
    if (blockMath) {
      pushList();
      elements.push(<BlockMath key={key++}>{blockMath[1]}</BlockMath>);
      continue;
    }

    // Fórmulas inline $...$
    let lastInline = 0;
    let inlineMatch;
    const inlineRegex = /\$(.+?)\$/g;
    let inlines = [];
    while ((inlineMatch = inlineRegex.exec(line)) !== null) {
      if (inlineMatch.index > lastInline) {
        inlines.push(line.slice(lastInline, inlineMatch.index));
      }
      inlines.push(<InlineMath key={key++}>{inlineMatch[1]}</InlineMath>);
      lastInline = inlineMatch.index + inlineMatch[0].length;
    }
    if (inlines.length > 0) {
      if (lastInline < line.length) {
        inlines.push(line.slice(lastInline));
      }
      pushList();
      elements.push(<span key={key++}>{inlines}</span>);
      continue;
    }

    // Si no es nada especial, texto normal
    pushList();
    elements.push(<span key={key++}>{line}</span>);
  }
  pushList();
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
